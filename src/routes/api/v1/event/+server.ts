import sharp from 'sharp'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/server/db'
import { PutObjectCommand, s3Client } from '$lib/s3-config';
import { S3_BUCKET } from '$env/static/private';
import { eventColumns } from '$lib/server/queries';

const dateKeys = ['startDate', 'endDate', 'startTime', 'endTime']

export const GET: RequestHandler = async event => {
	let result;
	try {
		result = await query(`SELECT ${eventColumns}
		FROM events WHERE hidden = false ORDER BY start_date ASC`);
	} catch (err) {
		error(503, 'Database error')
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

	// Only admins can edit other users' events
	// TODO: check what the user id of the event is in db
	// if (user.role !== 'admin') {
	// 	error(401, 'Unauthorized')
	// }

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
			if (value || !dateKeys.includes(key)) {
				eventCreate[key] = value;
			}
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


