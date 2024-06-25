import sharp from 'sharp'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/server/db'
import { PutObjectCommand, s3Client } from '$lib/s3-config';
import { S3_BUCKET } from '$env/static/private';
import { eventColumns } from '$lib/server/queries';
import sanitizeHtml from 'sanitize-html';
import { toSlug, truncateAndAppend } from '$lib/strings'

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
		error(503, 'Database error');
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

	const requestBody = await event.request.json()
	const eventId = requestBody.id

	// Delete unpublished event permanently from database
	try {
		await query(`DELETE FROM events WHERE published = false AND id = ${eventId}`);
	} catch (err) {
		error(503, 'Database error');
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
	const existingEventResult = await query(`SELECT id, user_id AS "userId", hidden, published FROM events WHERE id = ${eventUpdate.id}`);
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
		error(503, 'Database error')
	}
	
	// Upload file (this also updates event with image key)
	await doFileUpload(formData, eventUpdate.id)

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
	await doFileUpload(formData, eventId)

	if (needsModeration) {
		// TODO: send email notification
	}

	return json({
		message: 'Evento creado'
	})
}

const doFileUpload = async (formData: FormData, eventId: number): Promise<void> => {
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
		const processedImageLarge = await sharp(Buffer.from(imageBuffer))
			.resize({ width: 1200, withoutEnlargement: true }) // Max width 1200px
			.jpeg({ quality: 80 }) // JPEG compression
			.toBuffer();
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
		const processedImageSmall = await sharp(Buffer.from(imageBuffer))
			.resize({ width: 400, withoutEnlargement: true }) // Max width 400px
			.jpeg({ quality: 80 }) // JPEG compression
			.toBuffer();
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

	} catch (err) {
		console.log('Error uploading event image', err)
		error(503, 'No se pudo subir la imagen')		
	}
}


