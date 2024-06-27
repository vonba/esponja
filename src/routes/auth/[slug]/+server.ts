import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/server/db'
import { PRODUCTION } from '$env/static/private'

export const POST: RequestHandler = async event => {
	const { cookies } = event
	const { slug } = event.params

	let result
	let sql

	try {
		switch (slug) {
			case 'logout':
				if (event.locals.user) {
					// else they are logged out / session ended
					sql = `CALL delete_session($1);`
					result = await query(sql, [event.locals.user.id])
				}
				cookies.delete('session', { path: '/' })
				return json({ message: 'Logout successful.' })

			case 'login':
				sql = `SELECT authenticate($1) AS "authenticationResult";`
				break
			case 'register':
				sql = `SELECT register($1) AS "authenticationResult";`
				break
			default:
				error(404, 'Invalido')
		}

		// Only /auth/login and /auth/register at this point
		const body = await event.request.json()

		// While client checks for these to be non-null, register() in the database does not
		if (slug == 'register' && (!body.email || !body.password || !body.firstName || !body.lastName))
			error(400, 'Faltan datos requeridos del usuario')

		result = await query(sql, [JSON.stringify(body)])
	} catch (err) {
		console.log(err)
		error(503, 'Error en la base de datos')
	}

	const { authenticationResult }: { authenticationResult: AuthenticationResult } = result.rows[0]

	if (!authenticationResult.user)
		// includes when a user tries to register an existing email account with wrong password
		error(authenticationResult.statusCode, authenticationResult.status)

	// Ensures hooks.server.ts:handle() will not delete session cookie
	if (slug !== 'register') {
		event.locals.user = authenticationResult.user
		cookies.set('session', authenticationResult.sessionId, {
			httpOnly: true,
			sameSite: 'lax',
			secure: PRODUCTION === 'true',
			path: '/'
		})
	}
	return json({ message: authenticationResult.status, user: authenticationResult.user })
}