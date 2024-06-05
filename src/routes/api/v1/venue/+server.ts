import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/server/db'

export const GET: RequestHandler = async event => {
	let result;
	try {
		result = await query('SELECT * FROM venues WHERE hidden = false ORDER BY name ASC');
	} catch (err) {
		error(503, 'Database error')
	}

	return json(result.rows);
}

export const PUT: RequestHandler = async event => {
	const { user } = event.locals
	if (!user) error(401, 'Unauthorized')
		
	const venueUpdate = await event.request.json()

	try {
		await query(`CALL upsert_venue($1);`, [JSON.stringify(venueUpdate)])
	} catch (err) {
		console.log('Error updating venue', err)
		error(503, 'Database error')
	}

	return json({
		message: 'Successfully updated venue.'
	})
}

export const POST: RequestHandler = async event => {
	const { user } = event.locals
	if (!user) error(401, 'Unauthorized')
		
	const venueCreate = await event.request.json()

	try {
		// Creates new venue (id = 0)
		await query(`CALL upsert_venue($1, $2);`, [0, JSON.stringify(venueCreate)])
	} catch (err) {
		console.log('Error creating venue', err)
		error(503, 'Database error')
	}

	return json({
		message: 'Successfully created venue.'
	})
}


