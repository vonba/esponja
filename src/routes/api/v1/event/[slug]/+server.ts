import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/server/db'
import { eventColumns, withoutSubmitter } from '$lib/server/queries'
import { publicCacheHeaders } from '$lib/cache'
import { getCurrentDateInMexicoCity } from '$lib/dateTime'

const dateKeys = ['startDate', 'endDate', 'startTime', 'endTime']

export const GET: RequestHandler = async event => {
	const { user } = event.locals

	const { setHeaders } = event
	// A logged-in user also gets unpublished events and the author, so only the anonymous
	// variant may be cached. Previews (?preview) are never cached either, so the CDN can
	// never answer a logged-in preview with the public copy of the same URL.
	const isPreview = event.url.searchParams.has('preview')
	setHeaders(user || isPreview ? { 'Cache-Control': 'private, no-store' } : publicCacheHeaders())

	const slug = event.params.slug
	const currentDate = getCurrentDateInMexicoCity()

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
				WHERE hidden = false AND venue_id = $1 AND slug != $2 AND start_date >= $3
				ORDER BY start_date ASC
			`, [venueId, slug, currentDate])
		}

	} catch (err) {
		console.error('Error fetching event', err)
		return json({ error: 'Database error' }, { status: 503 })
	}

	// Helper to format dates
	const formatDate = (date: Date) => (date ? date.toISOString().split('T')[0] : null)

	// Format the event data. Submitter contact details are only for logged-in users.
	const formatEvent = (row: Record<string, unknown> & { startDate: Date, endDate: Date }) => {
		const formatted = {
			...row,
			startDate: formatDate(row.startDate),
			endDate: formatDate(row.endDate)
		}
		return user ? formatted : withoutSubmitter(formatted)
	}

	const theEventFormatted = {
		...formatEvent(theEvent),
		author: user && theEvent.authorFirstName
			? `${theEvent.authorFirstName} ${theEvent.authorLastName}`
			: null
	}

	// Format the related events
	const relatedEvents = otherEventsResult
		? otherEventsResult.rows.map(formatEvent)
		: []

	return json({ event: theEventFormatted, relatedEvents })
}



