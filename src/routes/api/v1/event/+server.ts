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
		
	const eventUpdate = await event.request.json()

	try {
		await query(`CALL upsert_event($1, $2);`, [JSON.stringify(eventUpdate), null])
	} catch (err) {
		console.log('Error updating event', err)
		error(503, 'Database error')
	}

	return json({
		message: 'Successfully updated event.'
	})
}

export const POST: RequestHandler = async event => {
	const { user } = event.locals
	if (!user) error(401, 'Unauthorized')
		
	// const eventCreate = await event.request.json()
	// / Get form data from the request body
  const formData = await event.request.formData();
  const eventCreate: any = {};

  // Copy everything that isn't a file
  for (const [key, value] of formData as any) {
		if (!(value instanceof File)) {
			eventCreate[key] = value;
		}
	}
	eventCreate.userId = user.id

	let eventId
	try {
		// Creates new event (id = 0)
		const dbResult = await query(`CALL upsert_event($1, $2);`, [JSON.stringify(eventCreate), null])
		eventId = dbResult.rows[0].new_id;
		if (!eventId) throw new Error ('Error creating event (id)')
	} catch (err) {
		console.log('Error creating event', err)
		error(503, 'No se pudo crear el evento')
	}

	try {
		// File upload
		const file = formData.get('eventImage') as File;
		const fileData = await file.arrayBuffer();
		const fileBody = Buffer.from(fileData);
		
		// TODO: check file format and size
		// TODO: resize image
		
		if (file) {
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
		error(503, 'No se pudo subir el imagen')		
	}

	return json({
		message: 'Successfully created event.'
	})
}


