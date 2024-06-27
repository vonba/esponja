import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/server/db'
import { eventColumns } from '$lib/server/queries'

export const GET: RequestHandler = async event => {
	const slug = event.params.slug

	let venue, events

	try {
		const venueResult = await query(`SELECT * FROM venues WHERE hidden = false AND slug = '${slug}'`);
		if (venueResult.rows) {
			venue = venueResult.rows[0];

			// Fetch other events at the same venue
			const eventsResult = await query(`
				SELECT ${eventColumns} FROM events
				WHERE hidden = false AND venue_id = ${venue.id} AND start_date >= CURRENT_DATE
				ORDER BY start_date ASC
			`);

			events = eventsResult.rows.map(row => {
				return {
					...row,
					// pg creates date objects but we only want the actual date
					startDate: row.startDate.toISOString().split('T')[0],
					endDate: row.endDate ? row.endDate.toISOString().split('T')[0] : null,
				}
			})
		}
	} catch (err) {
		console.log(err)
		error(503, 'Error de base de datos')
	}

	return json({venue, events});
}


