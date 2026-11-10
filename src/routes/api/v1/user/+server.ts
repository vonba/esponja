import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/server/db'
import { readJsonBody } from '$lib/server/http'

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

const ROLES: UserProperties['role'][] = ['contributor', 'editor', 'admin']
const MIN_PASSWORD_LENGTH = 8

// The users table has one unique constraint, on email
const isDuplicateEmailError = (err: unknown) => (err as { code?: string })?.code === '23505'

// Everyone can edit their own account (name, email, password). Only admins can edit other
// users, and only admins change roles or block access.
export const PUT: RequestHandler = async event => {
	const { user } = event.locals
	if (!user) error(401, 'Prohibido')

	const userUpdate = await readJsonBody(event.request)

	// The id arrives as JSON, where "5" and 5 are different values but name the same user to the
	// database (a string id used to get past the own-account check). Use the number from here on,
	// so the user checked below is exactly the user upsert_user updates.
	const targetId = Number(userUpdate.id)
	if (!Number.isInteger(targetId) || targetId <= 0) error(400, 'Usuario no especificado')
	userUpdate.id = targetId

	if (targetId === user.id) {
		// Your own account: whatever the request says, role and access stay as they are, so
		// nobody can promote or unblock themselves
		userUpdate.role = user.role
		userUpdate.blocked = false // A blocked user has no session (see get_session)
	} else {
		if (user.role !== 'admin') error(403, 'Solo un administrador puede modificar a otros usuarios')
		// Not even an admin sets someone else's password; there is "¿Olvidaste tu contraseña?"
		if (userUpdate.password) error(403, 'Tú no')
		if (!ROLES.includes(userUpdate.role)) error(400, 'Papel no válido')
	}

	try {
		await query(`CALL upsert_user($1);`, [JSON.stringify(userUpdate)])
	} catch (err) {
		if (isDuplicateEmailError(err)) error(409, 'Ya existe un usuario con ese correo')
		console.log('Error updating user', err)
		error(503, 'Error de base de datos')
	}

	return json({
		message: 'Usuario actualizado'
	})
}

// Only admins create users. This is the only way to get an account (there is no public sign-up).
export const POST: RequestHandler = async event => {
	const { user } = event.locals
	if (!user) error(401, 'Unauthorized')
	if (user.role !== 'admin') error(403, 'Solo un administrador puede crear usuarios')

	const userCreate = await readJsonBody(event.request)

	// Always a new user: upsert_user updates whichever id it is handed
	userCreate.id = 0

	if (!userCreate.email || !userCreate.firstName || !userCreate.lastName) {
		error(400, 'Faltan datos requeridos del usuario')
	}
	// upsert_user would otherwise store a hash of the empty string, which then logs in
	if (typeof userCreate.password !== 'string' || userCreate.password.length < MIN_PASSWORD_LENGTH) {
		error(400, `La contraseña debe tener un mínimo de ${MIN_PASSWORD_LENGTH} caracteres`)
	}
	if (!ROLES.includes(userCreate.role)) error(400, 'Papel no válido')

	try {
		await query(`CALL upsert_user($1);`, [JSON.stringify(userCreate)])
	} catch (err) {
		if (isDuplicateEmailError(err)) error(409, 'Ya existe un usuario con ese correo')
		console.log('Error creating user', err)
		error(503, 'Error de base de datos')
	}

	return json({
		message: 'Nuevo usuario creado'
	})
}


