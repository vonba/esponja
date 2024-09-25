import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/server/db'
import { eventColumns } from '$lib/server/queries'

const dateKeys = ['startDate', 'endDate', 'startTime', 'endTime']

export const GET: RequestHandler = async event => {
	const { user } = event.locals

	const { setHeaders } = event
	const cacheSeconds = 60 * 60 * 4 // 4 hours
	setHeaders({
		"Cache-Control": `max-age=${cacheSeconds}`,
	})

	const slug = event.params.slug

	let mainEventResult
	let otherEventsResult
	let theEvent

	try {
		// Fetch the main event by eventId
		mainEventResult = await query(`
			SELECT ${eventColumns}, users.first_name AS "authorFirstName", users.last_name AS "authorLastName"
			FROM events
			LEFT JOIN users ON events.user_id = users.id
			WHERE events.hidden = false AND events.slug = $1
			ORDER BY events.start_date ASC
		`, [slug])

		if (mainEventResult.rows.length === 0) {
			return json({ error: 'Event not found' }, { status: 404 })
		}

		theEvent = mainEventResult.rows[0]
		const { venueId } = theEvent

		// If the event is not published, check for a logged-in user
		if (!theEvent.published) {
			if (!user) return json({ error: 'Event not found' }, { status: 404 })
		}

		// Fetch other events at the same venue
		if (venueId) {
			otherEventsResult = await query(`
				SELECT ${eventColumns}
				FROM events
				WHERE hidden = false AND venue_id = $1 AND slug != $2 AND start_date >= CURRENT_DATE
				ORDER BY start_date ASC
			`, [venueId, slug])
		}

	} catch (err) {
		console.error('Error fetching event', err)
		return json({ error: 'Database error' }, { status: 503 })
	}

	// Helper to format dates
	const formatDate = (date: Date) => (date ? date.toISOString().split('T')[0] : null)

	// Format the event data
	const theEventFormatted = {
		...theEvent,
		startDate: formatDate(theEvent.startDate),
		endDate: formatDate(theEvent.endDate),
		author: user && theEvent.authorFirstName
			? `${theEvent.authorFirstName} ${theEvent.authorLastName}`
			: null
	}

	// Format the related events
	const relatedEvents = otherEventsResult
		? otherEventsResult.rows.map(row => ({
			...row,
			startDate: formatDate(row.startDate),
			endDate: formatDate(row.endDate)
		}))
		: []

	return json({ event: theEventFormatted, relatedEvents })
}



