import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/server/db'

export const GET: RequestHandler = async event => {
	const { setHeaders } = event
	const cacheSeconds = 60 * 5 // 5 minutes
	setHeaders({
		"Cache-Control": `max-age=${cacheSeconds}`,
	});

	const { user } = event.locals
	if (!user || user.role !== 'admin') error(401, 'Unauthorized')

	let result;
	try {
		result = await query(`SELECT
			id, email, active, subscribed_at AS "subscribedAt"
			FROM digest_subscribers ORDER BY subscribed_at DESC`);
	} catch (err) {
		console.log(err)
		error(503, 'Error de base de datos')
	}

	return json(result.rows);
}
