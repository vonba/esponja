import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/server/db'
import { PutObjectCommand, s3Client } from '$lib/s3-config';
import { S3_BUCKET } from '$env/static/private';

export const GET: RequestHandler = async event => {
	let result;
	try {
		result = await query(`SELECT id, user_id AS "userId", venue_id AS "venueId", 
		name, start_date AS "startDate", start_time AS "startTime", end_date AS "endDate",
		end_time AS "endTime", description, ticket_link AS "ticketLink", price_cents AS "priceCents", image_url as "imageURL" 
		FROM events WHERE hidden = false ORDER BY start_date ASC`);
	} catch (err) {
		error(503, 'Database error')
	}

	return json(result.rows);
}

export const PUT: RequestHandler = async event => {
	const { user } = event.locals
	if (!user) error(401, 'Unauthorized')
		
	// Copy form data from the request body (we need form data )
	const formData = await event.request.formData();
	
	const eventUpdate: any = {};
	for (const [key, value] of formData as any) {
		if (!(value instanceof File)) {
			eventUpdate[key] = value;
		}
	}

	// Update event
	try {
		await query(`CALL upsert_event($1, $2);`, [JSON.stringify(eventUpdate).replaceAll('"null"', 'null'), null])
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
	if (!user) error(401, 'Unauthorized')
		
	// Copy form data from the request body (we need form data )
  const formData = await event.request.formData();
  const eventCreate: any = {};
  for (const [key, value] of formData as any) {
		if (!(value instanceof File)) {
			eventCreate[key] = value;
		}
	}
	
	// Update event
	let eventId
	eventCreate.userId = user.id
	try {
		// Creates new event (id = 0)
		const dbResult = await query(`CALL upsert_event($1, $2);`, [JSON.stringify(eventCreate), null])
		eventId = dbResult.rows[0].new_id;
		if (!eventId) throw new Error ('Error creating event (id)')
	} catch (err) {
		console.log('Error creating event', err)
		error(503, 'No se pudo crear el evento')
	}

	// Upload file (this also updates event with image key)
	await doFileUpload(formData, eventId)

	return json({
		message: 'Successfully created event.'
	})
}

const doFileUpload = async (formData: FormData, eventId: number): Promise<void> => {
	try {
		const file = formData.get('eventImage') as File;
		
		// TODO: check file format and size
		// TODO: resize image
		
		if (file) {
			const fileData = await file.arrayBuffer();
			const fileBody = Buffer.from(fileData);
			const fileSuffix = file.name.split('.')[1]
			const fileKey = `event-${eventId}-${Date.now()}.${fileSuffix}`
			const uploadResult = await s3Client.send(
				new PutObjectCommand({
					Bucket: S3_BUCKET,
					Key: fileKey,
					Body: fileBody,
				})
			);

			if (uploadResult.$metadata.httpStatusCode !== 200) {
				console.log('S3 upload error', uploadResult)
			}

			// Update the event with the image URL
			await query(`UPDATE events SET image_url = $1 WHERE id = $2;`, [fileKey, eventId]);
		}
	} catch (err) {
		console.log('Error uploading event image', err)
		error(503, 'No se pudo subir la imagen')		
	}
}


