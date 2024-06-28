import Jimp from 'jimp';
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/server/db'
import { DeleteObjectCommand, PutObjectCommand, s3Client } from '$lib/s3-config';
import { S3_BUCKET } from '$env/static/private';
import { eventColumns } from '$lib/server/queries';
import sanitizeHtml from 'sanitize-html';
import { toSlug, truncateAndAppend } from '$lib/strings'
import { sendModerationNotification, sendModerationSuccessfulNotification } from '$lib/server/mail'

const dateKeys = ['startDate', 'endDate', 'startTime', 'endTime']

// Possible query parameters:
// showHidden=true : include events with hidden=true
// showUnpublished=true : include events with published=false
// showOnlyPastEvents=true : include events in the past

export const GET: RequestHandler = async event => {

	// Set query constraints
	const searchParams = event.url.searchParams;
	const publishedConstraint = searchParams.get('showUnpublished') ? '1=1' : 'published = true';
	const hiddenConstraint = searchParams.get('showHidden') ? '1=1' : 'hidden = false';
	const dateConstraint = searchParams.get('showOnlyPastEvents') ? 'start_date < CURRENT_DATE' : 'start_date >= CURRENT_DATE';

	let result;
	try {
		result = await query(`SELECT ${eventColumns} 
			FROM events
			WHERE ${hiddenConstraint} AND ${publishedConstraint}
			AND ${dateConstraint}
			ORDER BY start_date ASC`);
	} catch (err) {
		console.log('Error loading events', err)
		error(503, 'Error de base de datos')
	}

	const formattedRows = result.rows.map(row => {
		return {
			...row,
			// pg creates date objects but we only want the actual date
			startDate: row.startDate.toISOString().split('T')[0],
			endDate: row.endDate ? row.endDate.toISOString().split('T')[0] : null,
		}
	})

	return json(formattedRows);
}

export const DELETE: RequestHandler = async event => {
	const { user } = event.locals
	if (!user) error(401, 'Unauthorized')

	const requestBody = await event.request.json() as EventProperties
	const { id, imageKeyLarge, imageKeySmall } = requestBody

	if (!id) error(503, 'Evento no especificado')

	// Delete unpublished event permanently from database
	try {
		// Delete the event permanently
		await query(`DELETE FROM events WHERE (published = false OR hidden = true) AND id = ${id}`);

		// Now delete the orphaned images
		deleteFiles([imageKeyLarge, imageKeySmall])
	} catch (err) {
		console.log('Error while deleting event', err)
		error(503, 'Error de base de datos')
	}

	return json({
		message: 'Evento borrado permanentemente'
	})
}

export const PUT: RequestHandler = async event => {
	const { user } = event.locals
	if (!user) error(401, 'Unauthorized')
		
	// Copy form data from the request body (we need form data )
	const formData = await event.request.formData();
	
	const eventUpdate: any = {};
	for (const [key, value] of formData as any) {
		if (!(value instanceof File)) {
			if (value || !dateKeys.includes(key)) {
				eventUpdate[key] = value;
			}
		}
	}

	// Get existing event
	const existingEventResult = await query(`SELECT id, user_id AS "userId", hidden, published, 
		image_key_large AS "imageKeyLarge", image_key_small AS "imageKeySmall" 
		FROM events WHERE id = ${eventUpdate.id}`);
	if (!existingEventResult.rowCount) error(404, 'Event not found')
	const existingEvent =  existingEventResult.rows[0]
		
	// Only admins can edit other users' events
	if (user.role !== 'admin' && user.id !== existingEvent.user_id) {
		error(401, 'Unauthorized')
	}

	// Check for slug duplicates
	eventUpdate.slug = toSlug(eventUpdate.slug)
	const sameSlugResult = await query(`SELECT id FROM events WHERE slug = '${eventUpdate.slug}' AND id != ${existingEvent.id}`);
	if (sameSlugResult.rowCount) {
		// If slug already exists will add a "-2" at the end
		eventUpdate.slug = truncateAndAppend(eventUpdate.slug)
	}

	// Remove any HTML
	eventUpdate.name = sanitizeHtml(eventUpdate.name);
	eventUpdate.description = sanitizeHtml(eventUpdate.description);
	eventUpdate.ticketLink = sanitizeHtml(eventUpdate.ticketLink);
	
	// If event was not published, it will be now
	const wasApproved = !existingEvent.published
	if (wasApproved) {
		sendModerationSuccessfulNotification(
			eventUpdate.submitterName,
			eventUpdate.submitterEmail,
			eventUpdate.name,
			eventUpdate.slug,
			eventUpdate.imageKeySmall,
		)
	}

	// Set status to published
	eventUpdate.published = true

	// Correct null values
	const queryBody = JSON.stringify(eventUpdate)
		.replace(/"null"/g, 'null')
		.replace(/"undefined"/g, 'null');

	// Update event
	try {
		await query(`CALL upsert_event($1, $2);`, [queryBody, null])
	} catch (err) {
		console.log('Error updating event', err)
		error(503, 'Error de base de datos')
	}
	
	// Upload file (this also updates event with image key)
	await doFileUpload(formData, eventUpdate.id)

	// If a new image was uploaded, delete the old ones
	const imageWasUpdated = !!formData.get('eventImage')
	deleteFiles([existingEvent.imageKeyLarge, existingEvent.imageKeySmall])

	return json({
		message: 'Successfully updated event.'
	})
}

export const POST: RequestHandler = async event => {
	const { user } = event.locals

	// Copy FormData from the request body (NOTE we only use FormData when file uploads are involved)
  const formData = await event.request.formData();
  const eventCreate: any = {};
  for (const [key, value] of formData as any) {
		if (!(value instanceof File)) {
			if (value || !dateKeys.includes(key)) {
				eventCreate[key] = value;
			}
		}
	}

	// Check for slug duplicates
	eventCreate.slug = toSlug(eventCreate.slug)
	const sameSlugResult = await query(`SELECT id FROM events WHERE slug = '${eventCreate.slug}'`);
	if (sameSlugResult.rowCount) {
		// If slug already exists will add a "-2" at the end
		eventCreate.slug = truncateAndAppend(eventCreate.slug)
	}

	// Remove any HTML
	eventCreate.name = sanitizeHtml(eventCreate.name);
	eventCreate.description = sanitizeHtml(eventCreate.description);
	eventCreate.ticketLink = sanitizeHtml(eventCreate.ticketLink);

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
	const queryBody = JSON.stringify(eventCreate)
		.replace(/"null"/g, 'null')
		.replace(/"undefined"/g, 'null');

	try {
		// Creates new event (id = 0)
		const dbResult = await query(
			`CALL upsert_event($1, $2);`, 
			// Correct formatting of null values
			[queryBody, null]
		)
		eventId = dbResult.rows[0].new_id;
		if (!eventId) throw new Error ('Error creating event (id)')
	} catch (err) {
		console.log('Error creating event', err)
		error(503, 'No se pudo crear el evento')
	}

	// Upload file (this also updates event with image key)
	const fileUploadResult = await doFileUpload(formData, eventId)

	if (needsModeration) {
		sendModerationNotification(
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
async function processImage(arrayBuffer: ArrayBuffer): Promise<Buffer> {
	const imageBuffer = Buffer.from(arrayBuffer); // Convert ArrayBuffer to Buffer

	// Read the image from the buffer
	const image = await Jimp.read(imageBuffer);

	// Resize the image to a maximum width of 1200px, maintaining aspect ratio
	image.resize(1200, Jimp.AUTO);

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
		// const processedImageLarge = await sharp(Buffer.from(imageBuffer))
		// 	.resize({ width: 1200, withoutEnlargement: true }) // Max width 1200px
		// 	.jpeg({ quality: 80 }) // JPEG compression
		// 	.toBuffer();
		const processedImageLarge = await processImage(imageBuffer);
		const fileKeyLarge = `event-${eventId}-${Date.now()}.jpg`
		let uploadResult = await s3Client.send(
			new PutObjectCommand({
				Bucket: S3_BUCKET,
				Key: fileKeyLarge,
				Body: processedImageLarge,
			})
		);
		if (uploadResult.$metadata.httpStatusCode !== 200) {
			console.log('S3 upload error', uploadResult)
		}
		// Convert to small jpeg
		// const processedImageSmall = await sharp(Buffer.from(imageBuffer))
		// 	.resize({ width: 400, withoutEnlargement: true }) // Max width 400px
		// 	.jpeg({ quality: 80 }) // JPEG compression
		// 	.toBuffer();
		const processedImageSmall = await processImage(imageBuffer);
		const fileKeySmall = `event-${eventId}-${Date.now()}.jpg`
		uploadResult = await s3Client.send(
			new PutObjectCommand({
				Bucket: S3_BUCKET,
				Key: fileKeySmall,
				Body: processedImageSmall,
			})
		);
		if (uploadResult.$metadata.httpStatusCode !== 200) {
			console.log('S3 upload error', uploadResult)
		}
		// Finished uploading

		// Update the event with the image URL
		await query(`UPDATE events SET image_key_large = $1, image_key_small = $2 WHERE id = $3;`, [fileKeyLarge, fileKeySmall, eventId]);

		return { fileKeyLarge, fileKeySmall }

	} catch (err) {
		console.log('Error uploading event image', err)
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
      console.log(`Deleted ${key} from S3`);
    }
  } catch (err) {
    console.error("Error deleting images from S3", err);
  }
}

