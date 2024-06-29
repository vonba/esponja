import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/server/db'
import { eventColumns } from '$lib/server/queries'

const dateKeys = ['startDate', 'endDate', 'startTime', 'endTime']

export const GET: RequestHandler = async event => {
	const { setHeaders } = event
	const cacheSeconds = 60 * 60 * 4 // 4 hours
	setHeaders({
    "cache-control": `max-age=${cacheSeconds}`,
  });

	const slug = event.params.slug

	let mainEventResult
	let otherEventsResult
	let theEvent

	try {
		// Fetch the main event by eventId
		mainEventResult = await query(`
			SELECT ${eventColumns}
			FROM events
			WHERE hidden = false AND slug = '${slug}'
			ORDER BY start_date ASC
		`)

		if (mainEventResult.rows.length === 0) {
			return json({ error: 'Event not found' }, { status: 404 })
		}

		theEvent = mainEventResult.rows[0]
		const {venueId} = theEvent

		if (!theEvent.published) {
			const { user } = event.locals
			if (!user) return json({ error: 'Event not found' }, { status: 404 })
		}

		// Fetch other events at the same venue
		if (venueId) {
			otherEventsResult = await query(`
				SELECT ${eventColumns}
				FROM events
				WHERE hidden = false AND venue_id = ${venueId} AND slug != '${slug}' AND start_date >= CURRENT_DATE
				ORDER BY start_date ASC
			`)
		}

	} catch (err) {
		console.log('Error fetching event', err)
		return json({ error: 'Database error' }, { status: 503 })
	}

	const formatDate = (date: Date) => date ? date.toISOString().split('T')[0] : null

	const theEventFormatted = {
		...theEvent,
		startDate: formatDate(theEvent.startDate),
		endDate: formatDate(theEvent.endDate)
	}

	const relatedEvents = otherEventsResult 
		? otherEventsResult.rows.map(row => ({
			...row,
			startDate: formatDate(row.startDate),
			endDate: formatDate(row.endDate)
		})) 
		: []

	return json({ event: theEventFormatted, relatedEvents });
};


