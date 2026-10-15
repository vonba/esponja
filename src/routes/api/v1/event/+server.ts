import Jimp from 'jimp';
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/server/db'
import { DeleteObjectCommand, PutObjectCommand, s3Client } from '$lib/s3-config';
import { S3_BUCKET } from '$env/static/private';
import { eventColumns, withoutSubmitter } from '$lib/server/queries';
import { publicCacheHeaders } from '$lib/cache';
import { clearPublicCache } from '$lib/server/cache';
import { sendModerationNotification, sendModerationSuccessfulNotification } from '$lib/server/mail'
import { getCurrentDateInMexicoCity } from '$lib/dateTime';
import {
	DUPLICATE_SLUG_MESSAGE,
	assertSlugIsAvailable,
	buildEventSlug,
	eventFromFormData,
	isDuplicateSlugError,
	normalizeEventSlug,
	parseEventId,
	sanitizeEventText,
	toEventQueryBody,
} from '$lib/server/events';

// ====== Endpoint for listing events ======
// Possible query parameters:
// today=YYYY-MM-DD : use this as the current date (defaults to today in Mexico City)
// showHidden=true : include events where hidden=true
// showUnpublished=true : include events where published=false
// showOnlyPastEvents=true : show only events in the past
export const GET: RequestHandler = async event => {

	const { setHeaders } = event
	const { user } = event.locals
	// The response carries submitter contact details for a logged-in user, so only the
	// anonymous variant may be cached
	setHeaders(user ? { 'Cache-Control': 'private, no-store' } : publicCacheHeaders())

	// Set query constraints
	const searchParams = event.url.searchParams;
	const todayParam = searchParams.get('today')
	const currentDate = todayParam ? todayParam : getCurrentDateInMexicoCity();
	const publishedConstraint = searchParams.get('showUnpublished') ? '1=1' : 'published = true';
	const hiddenConstraint = searchParams.get('showHidden') ? '1=1' : 'hidden = false';
	const dateConstraint = searchParams.get('showOnlyPastEvents') 
		? `start_date < '${currentDate}' AND (end_date IS NULL OR end_date < '${currentDate}')` 
		: `start_date >= '${currentDate}' OR (end_date IS NOT NULL AND end_date >= '${currentDate}')`;

	// Check format of currentDate since it comes from the client
	if (todayParam) {
		const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
		if (!dateRegex.test(currentDate)) {
			throw new Error('El formato de la fecha debe ser YYYY-MM-DD');
		}
	}

	// Upcoming events are sorted in three groups so that long-running events (classes etc.)
	// don't pile up at the top of the list:
	// 1. events starting during the current week (Monday to Sunday)
	// 2. multi-day events that started before this week and are still running
	// 3. events starting after this week
	const weekStart = `date_trunc('week', '${currentDate}'::date)`
	const orderBy = searchParams.get('showOnlyPastEvents')
		? 'start_date ASC'
		: `CASE
				WHEN start_date < ${weekStart} THEN 2
				WHEN start_date < ${weekStart} + interval '7 days' THEN 1
				ELSE 3
			END, start_date ASC, start_time ASC`

	// Build query string. The date constraint contains an OR, so it needs its own parentheses:
	// without them any multi-day event still running would skip the hidden/published checks.
	const queryString = `SELECT ${eventColumns}
			FROM events
			WHERE ${hiddenConstraint} AND ${publishedConstraint}
			AND (${dateConstraint})
			ORDER BY ${orderBy}`

	let result;
	try {
		result = await query(queryString);
	} catch (err) {
		console.log('Error loading events', err)
		error(503, 'Error de base de datos')
	}

	const formattedRows = result.rows.map(row => {
		const formatted = {
			...row,
			// pg creates date objects but we only want the actual date
			startDate: row.startDate.toISOString().split('T')[0],
			endDate: row.endDate ? row.endDate.toISOString().split('T')[0] : null,
		}
		// If there's no logged in user, remove submitter info (including user ID) from results
		return user ? formatted : withoutSubmitter(formatted)
	})

	return json(formattedRows);
}

// Endpoint for deleting events
export const DELETE: RequestHandler = async event => {
	const { user } = event.locals
	if (!user) error(401, 'Unauthorized')

	const requestBody = await event.request.json() as EventProperties
	const { id, imageKeyLarge, imageKeySmall } = requestBody

	const eventId = parseEventId(id)

	// Delete unpublished event permanently from database
	try {
		// Delete the event permanently
		await query(`DELETE FROM events WHERE (published = false OR hidden = true) AND id = $1`, [eventId]);

		// Now delete the orphaned images
		deleteFiles([imageKeyLarge, imageKeySmall])

		await clearPublicCache()
	} catch (err) {
		console.log('Error while deleting event', err)
		error(503, 'Error de base de datos')
	}

	return json({
		message: 'Evento borrado permanentemente'
	})
}

// Endpoint for updating events
export const PUT: RequestHandler = async event => {
	const { user } = event.locals
	if (!user) error(401, 'Unauthorized')
		
	// Copy form data from the request body (we need form data )
	const formData = await event.request.formData();
	const eventUpdate = eventFromFormData(formData)
	const eventId = parseEventId(eventUpdate.id)

	// Get existing event
	const existingEventResult = await query(`SELECT id, user_id AS "userId", hidden, published,
		image_key_large AS "imageKeyLarge", image_key_small AS "imageKeySmall",
		submitter_name AS "submitterName", submitter_email AS "submitterEmail"
		FROM events WHERE id = $1`, [eventId]);
	if (!existingEventResult.rows.length) error(404, 'Event not found')
	const existingEvent =  existingEventResult.rows[0]

	// Only admins can edit other users' events
	if (user.role !== 'admin' && user.id !== existingEvent.userId) {
		error(401, 'Unauthorized')
	}

	// Keep the slug the event was created with, but refuse to collide with another one
	eventUpdate.slug = normalizeEventSlug(eventUpdate.slug)
	await assertSlugIsAvailable(eventUpdate.slug, existingEvent.id)

	// Remove any HTML
	sanitizeEventText(eventUpdate)

	// The submitter is only recorded when an event is created. upsert_event overwrites
	// these columns, so carry the stored values forward whatever the client sent.
	eventUpdate.submitterName = existingEvent.submitterName
	eventUpdate.submitterEmail = existingEvent.submitterEmail

	// If event was not published, it will be now
	const wasApproved = !existingEvent.published
	if (wasApproved) {
		eventUpdate.userId = user.id // Assign to current user
	}

	// Set status to published
	eventUpdate.published = true

	// Correct null values
	const queryBody = toEventQueryBody(eventUpdate)

	// Update event
	try {
		await query(`CALL upsert_event($1, $2);`, [queryBody, null])
	} catch (err) {
		// A concurrent request may have taken the slug since the check above
		if (isDuplicateSlugError(err)) error(409, DUPLICATE_SLUG_MESSAGE)
		console.error('Error updating event', err)
		error(503, 'Error de base de datos')
	}
	
	// Upload file (this also updates event with image key)
	await doFileUpload(formData, eventId)

	// TODO: check that if file upload fails, no attempt to delete is made

	// If a new image was uploaded, delete the old ones
	const imageWasUpdated = !!formData.get('eventImage')
	if (imageWasUpdated) {
		deleteFiles([existingEvent.imageKeyLarge, existingEvent.imageKeySmall])
	}

	await clearPublicCache()

	// Notify the uploader
	if (wasApproved) {
		await sendModerationSuccessfulNotification(
			eventUpdate.submitterName,
			eventUpdate.submitterEmail,
			eventUpdate.name,
			eventUpdate.slug,
			eventUpdate.imageKeySmall,
		)
	}

	return json({
		message: 'Successfully updated event.'
	})
}

// Endpoint for creating new events
export const POST: RequestHandler = async event => {
	const { user } = event.locals

	// Copy FormData from the request body (NOTE we only use FormData when file uploads are involved)
  const formData = await event.request.formData();
  const eventCreate = eventFromFormData(formData)

	// Append start date to slug, so a repeating event gets a distinct slug each time
	eventCreate.slug = buildEventSlug(eventCreate.slug || eventCreate.name, eventCreate.startDate)

	// Two events with the same name on the same day are not allowed
	await assertSlugIsAvailable(eventCreate.slug)

	// Remove any HTML
	sanitizeEventText(eventCreate)

	// Create event
	let eventId
	let needsModeration = true
	if (user) {
		needsModeration = false
		eventCreate.userId = user.id
		eventCreate.published = true
	} else {
		eventCreate.userId = null
		eventCreate.published = false
	}
	// Correct formatting of null values
	const queryBody = toEventQueryBody(eventCreate)

	try {
		// Creates new event (id = 0)
		const dbResult = await query(`CALL upsert_event($1, $2);`, [queryBody, null])
		eventId = dbResult.rows[0].new_id;
		if (!eventId) throw new Error ('Error creating event (id)')
	} catch (err) {
		// A concurrent request may have taken the slug since the check above
		if (isDuplicateSlugError(err)) error(409, DUPLICATE_SLUG_MESSAGE)
		console.error('Error creating event', err)
		error(503, 'No se pudo crear el evento')
	}

	// Upload file (this also updates event with image key)
	const fileUploadResult = await doFileUpload(formData, eventId)

	// Submissions from the public stay out of sight until approved (a PUT), so only
	// events published straight away change what visitors see
	if (!needsModeration) await clearPublicCache()

	if (needsModeration) {
		await sendModerationNotification(
			eventCreate.name,
			eventCreate.submitterName,
			eventCreate.submitterEmail,
			fileUploadResult?.fileKeySmall ? fileUploadResult.fileKeySmall : null
		)
	}

	return json({
		message: 'Evento creado'
	})
}

// Resize image with Jimp
async function processImage(arrayBuffer: ArrayBuffer, width: number = 1200): Promise<Buffer> {
	const imageBuffer = Buffer.from(arrayBuffer); // Convert ArrayBuffer to Buffer

	// Read the image from the buffer
	const image = await Jimp.read(imageBuffer);

	// Resize the image to a maximum width of 1200px, maintaining aspect ratio
	image.resize(width, Jimp.AUTO);

	// Compress the image with quality 80
	image.quality(80);

	// Get the image as a buffer in JPEG format
	const processedImageLarge = await image.getBufferAsync(Jimp.MIME_JPEG);

	return processedImageLarge;
}

const doFileUpload = async (formData: FormData, eventId: number): Promise<void | {fileKeyLarge: string, fileKeySmall: string}> => {
	try {		
		// Get file from form data
		const file = formData.get('eventImage') as File;
    if (!file) return

    // Check file format
    const allowedFormats = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedFormats.includes(file.type)) {
      throw new Error("Solo se permiten imagenes JPEG, PNG y GIF");
    }

    // Check file size (limit to 5MB for example)
    const maxSizeInBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      throw new Error("El tamaño máximo del archivo es de 5 MB");
    }

		// Get image data
		const imageBuffer = await file.arrayBuffer();
		
		// Convert to large jpeg
		const processedImageLarge = await processImage(imageBuffer, 1200);
		const fileKeyLarge = `event-${eventId}-${Date.now()}.jpg`
		let uploadResult = await s3Client.send(
			new PutObjectCommand({
				Bucket: S3_BUCKET,
				Key: fileKeyLarge,
				Body: processedImageLarge,
			})
		);
		if (uploadResult.$metadata.httpStatusCode !== 200) {
			console.error('S3 upload error', uploadResult)
		}
		// Convert to small jpeg
		const processedImageSmall = await processImage(imageBuffer, 400);
		const fileKeySmall = `event-${eventId}-${Date.now()}.jpg`
		uploadResult = await s3Client.send(
			new PutObjectCommand({
				Bucket: S3_BUCKET,
				Key: fileKeySmall,
				Body: processedImageSmall,
			})
		);
		if (uploadResult.$metadata.httpStatusCode !== 200) {
			console.error('S3 upload error', uploadResult)
		}
		// Finished uploading

		// Update the event with the image URL
		await query(`UPDATE events SET image_key_large = $1, image_key_small = $2 WHERE id = $3;`, [fileKeyLarge, fileKeySmall, eventId]);

		return { fileKeyLarge, fileKeySmall }

	} catch (err) {
		console.error('Error uploading event image', err)
		error(503, 'No se pudo subir la imagen')		
	}
}

// Function to delete images from S3
async function deleteFiles(imageKeys: (string | undefined)[]) {
  try {
    for (const key of imageKeys) {
			if (!key) continue
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: S3_BUCKET,
          Key: key
        })
      );
    }
  } catch (err) {
    console.error("Error deleting images from S3", err);
  }
}

