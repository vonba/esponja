import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/server/db'
import { eventColumns } from '$lib/server/queries'

export const GET: RequestHandler = async event => {
	const eventId = event.params.slug

	let result;
	try {
		result = await query(`SELECT * FROM venues WHERE hidden = false AND id = ${eventId}`);
	} catch (err) {
		error(503, 'Database error')
	}

	return json(result.rows);
}


