import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/server/db'
import { readJsonBody } from '$lib/server/http'
import { toSlug } from '$lib/strings';
import { publicCacheHeaders } from '$lib/cache';
import { clearPublicCache } from '$lib/server/cache';

// Possible query parameters:
// showHidden=true : include venues with hidden=true (logged-in users only)
export const GET: RequestHandler = async event => {
	const { setHeaders } = event
	const { user } = event.locals

	// Hidden venues are for the admin panel, so anyone else asking for them gets the public list
	const showHidden = !!user && !!event.url.searchParams.get('showHidden')

	// A list with hidden venues depends on who asked, so the CDN must never keep it
	setHeaders(showHidden ? { 'Cache-Control': 'private, no-store' } : publicCacheHeaders())

	// Set query constraints
	const hiddenConstraint = showHidden ? '1=1' : 'hidden = false';
	
	let result;
	try {
		result = await query(`SELECT * FROM venues WHERE ${hiddenConstraint} ORDER BY name ASC`);
	} catch (err) {
		console.log(err)
		error(503, 'Error de base de datos')
	}

	return json(result.rows);
}

export const PUT: RequestHandler = async event => {
	const { user } = event.locals
	if (!user) error(401, 'Unauthorized')
		
	const venueUpdate = await readJsonBody(event.request)

	try {
		await query(`CALL upsert_venue($1, $2);`, [JSON.stringify(venueUpdate), null])
	} catch (err) {
		console.log('Error updating venue', err)
		error(503, 'No se pudo actualizar el foro')
	}

	await clearPublicCache()

	return json({
		message: 'Foro actualizado'
	})
}

export const POST: RequestHandler = async event => {
	const { user } = event.locals
	if (!user) error(401, 'Unauthorized')
		
	const venueCreate = await readJsonBody(event.request)
	const newSlug = toSlug(venueCreate.name)
	venueCreate.slug = newSlug

	let newId
	try {
		// Creates new venue (id = 0)
		const dbResult = await query(`CALL upsert_venue($1, $2);`, [JSON.stringify(venueCreate), null])
		newId = dbResult.rows[0].new_id;
	} catch (err) {
		let message = 'No se pudo crear el foro'
		if ((err as { routine?: string }).routine === '_bt_check_unique') {
			message = "Ya existe el URL o nombre del foro";
		}
		error(503, message)
	}

	await clearPublicCache()

	return json({
		message: 'Nuevo foro creado',
		newId
	})
}


