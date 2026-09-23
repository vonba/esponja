import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/server/db'
import { eventColumns, withoutSubmitter } from '$lib/server/queries'
import { getCurrentDateInMexicoCity } from '$lib/dateTime'
import { publicCacheHeaders } from '$lib/cache'

export const GET: RequestHandler = async event => {
	const { setHeaders } = event
	setHeaders(publicCacheHeaders())

	const slug = event.params.slug
	const currentDate = getCurrentDateInMexicoCity()
	let venue, events

	try {
		const venueResult = await query(`SELECT * FROM venues WHERE hidden = false AND slug = $1`, [slug]);
		venue = venueResult.rows[0];
		if (venue) {

			// Fetch other events at the same venue
			const eventsResult = await query(`
				SELECT ${eventColumns} FROM events
				WHERE hidden = false AND published = true AND venue_id = $1 AND start_date >= $2
				ORDER BY start_date ASC
			`, [venue.id, currentDate]);

			// This endpoint is public, so the submitter's contact details never go out
			events = eventsResult.rows.map(row => withoutSubmitter({
				...row,
				// pg creates date objects but we only want the actual date
				startDate: row.startDate.toISOString().split('T')[0],
				endDate: row.endDate ? row.endDate.toISOString().split('T')[0] : null,
			}))
		}
	} catch (err) {
		console.log(err)
		error(503, 'Error de base de datos')
	}

	// A 404 (unlike a 503) can be cached, so repeated requests for a missing venue skip the database
	if (!venue) error(404, 'Foro no encontrado')

	return json({venue, events});
}


