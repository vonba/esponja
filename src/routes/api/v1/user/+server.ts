import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/server/db'

export const GET: RequestHandler = async event => {
	const { user } = event.locals

	if (!user) error(401, 'Unauthorized')

	let result;
	try {
		result = await query('SELECT id, email, role, hidden, first_name AS "firstName", last_name AS "lastName" FROM users WHERE hidden = false ORDER BY first_name ASC');
	} catch (err) {
		console.log(err)
		error(503, 'Database error')
	}

	return json(result.rows);
}

export const PUT: RequestHandler = async event => {
	const { user } = event.locals
	const userUpdate = await event.request.json()

	if (!user) error(401, 'Unauthorized (not signed in)')
	
		// Only admins can update other users
	if (user.id !== userUpdate.id && user.role !== 'admin') {
		error(401, 'Unauthorized (not permitted to edit users)')
	}
	
	// Prevent changing role of own user
	if (user.id === userUpdate.id && user.role !== userUpdate.role) {
		error(401, 'Unauthorized (privilege esc)')
	}

	try {
		await query(`CALL update_user($1, $2);`, [userUpdate.id, JSON.stringify(userUpdate)])
	} catch (err) {
		console.log('Error updating user', err)
		error(503, 'Database error')
	}

	return json({
		message: 'Successfully updated user profile.'
	})
}


