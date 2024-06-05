import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/server/db'

export const GET: RequestHandler = async event => {
	let result;
	try {
		result = await query(`SELECT id, user_id AS "userId", venue_id AS "venueId", 
		name, start_date AS "startDate", start_time AS "startTime", end_date AS "endDate",
		end_time AS "endTime", description, ticket_link AS "ticketLink", price_cents AS "priceCents"
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
		await query(`CALL upsert_event($1);`, [JSON.stringify(eventUpdate)])
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
		
	const eventCreate = await event.request.json()

	try {
		// Creates new event (id = 0)
		await query(`CALL upsert_event($1, $2);`, [0, JSON.stringify(eventCreate)])
	} catch (err) {
		console.log('Error creating event', err)
		error(503, 'Database error')
	}

	return json({
		message: 'Successfully created event.'
	})
}


