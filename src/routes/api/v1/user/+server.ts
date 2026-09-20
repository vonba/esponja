import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/server/db'

// Possible query parameters:
// showBlocked=true : include users with blocked=true
export const GET: RequestHandler = async event => {
	const { setHeaders } = event
	setHeaders({
    "Cache-Control": 'private, no-store',
  });

	const { user } = event.locals
	if (!user || user.role !== 'admin') error(401, 'Unauthorized')

	// Set query constraints
	const searchParams = event.url.searchParams;
	const blockedConstraint = searchParams.get('showBlocked') ? '1=1' : 'blocked = false';

	let result;
	try {
		result = await query(`SELECT 
			id, email, role, blocked, first_name AS "firstName", last_name AS "lastName" 
			FROM users WHERE ${blockedConstraint} ORDER BY first_name ASC`);
	} catch (err) {
		console.log(err)
		error(503, 'Error de base de datos')
	}

	return json(result.rows);
}

export const PUT: RequestHandler = async event => {
	const { user } = event.locals
	const userUpdate = await event.request.json()

	if (!user) error(401, 'Prohibido')

	// Prevent changing someone else's password
	if (user.id !== userUpdate.id && userUpdate.password) error(401, 'Tú no')
	
	// Prevent changing role or status of your own user (privilege escalation)
	if (
		user.id === userUpdate.id 
		&& (user.role !== userUpdate.role || user.blocked !== userUpdate.blocked)
	) {
		error(401, 'Check your privilege')
	}

	try {
		await query(`CALL upsert_user($1);`, [JSON.stringify(userUpdate)])
	} catch (err) {
		console.log('Error updating user', err)
		error(503, 'Error de base de datos')
	}

	return json({
		message: 'Usuario actualizado'
	})
}

export const POST: RequestHandler = async event => {
	const { user } = event.locals
	const userCreate = await event.request.json()

	// Only admins
	if (!user || user.role !== 'admin') error(401, 'Unauthorized')
	
	// Can only create editors
	userCreate.role = 'editor'

	try {
		await query(`CALL upsert_user($1);`, [JSON.stringify(userCreate)])
	} catch (err) {
		console.log('Error creating user', err)
		error(503, 'Error de base de datos')
	}

	return json({
		message: 'Nuevo usuario creado'
	})
}


