import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/server/db'
import { eventColumns } from '$lib/server/queries'

const dateKeys = ['startDate', 'endDate', 'startTime', 'endTime']

export const GET: RequestHandler = async event => {
	const eventId = event.params.slug

	let result;
	try {
		result = await query(`SELECT ${eventColumns}
		FROM events WHERE hidden = false AND id = ${eventId} ORDER BY start_date ASC`);
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


