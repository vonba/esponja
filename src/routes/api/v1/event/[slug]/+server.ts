import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/server/db'
import { eventColumns } from '$lib/server/queries'

const dateKeys = ['startDate', 'endDate', 'startTime', 'endTime']

export const GET: RequestHandler = async event => {
	const slug = event.params.slug;

	let mainEventResult;
	let otherEventsResult;

	try {
		// Fetch the main event by eventId
		mainEventResult = await query(`
			SELECT ${eventColumns}
			FROM events
			WHERE hidden = false AND slug = '${slug}'
			ORDER BY start_date ASC
		`);

		if (mainEventResult.rows.length === 0) {
			return json({ error: 'Event not found' }, { status: 404 });
		}

		const venueId = mainEventResult.rows[0].venueId;

		// Fetch other events at the same venue
		otherEventsResult = await query(`
			SELECT ${eventColumns}
			FROM events
			WHERE hidden = false AND venue_id = ${venueId} AND slug != '${slug}' AND start_date >= CURRENT_DATE
			ORDER BY start_date ASC
		`);

	} catch (err) {
		console.log(err)
		return json({ error: 'Database error' }, { status: 503 });
	}

	const formatDate = (date: Date) => date ? date.toISOString().split('T')[0] : null;

	const mainEvent = {
		...mainEventResult.rows[0],
		startDate: formatDate(mainEventResult.rows[0].startDate),
		endDate: formatDate(mainEventResult.rows[0].endDate)
	};

	const relatedEvents = otherEventsResult.rows.map(row => ({
		...row,
		startDate: formatDate(row.startDate),
		endDate: formatDate(row.endDate)
	}));


	return json({ event: mainEvent, relatedEvents });
};


