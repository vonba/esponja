import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/server/db'
import { readJsonBody } from '$lib/server/http'

// POST /auth/login and POST /auth/logout. There is no public sign-up: admins create accounts
// through POST /api/v1/user.
export const POST: RequestHandler = async event => {
	const { cookies } = event
	const { slug } = event.params

	if (slug === 'logout') {
		if (event.locals.user) {
			// else they are logged out / session ended
			try {
				await query(`CALL delete_session($1);`, [event.locals.user.id])
			} catch (err) {
				console.log(err)
				error(503, 'Error en la base de datos')
			}
		}
		cookies.delete('session', { path: '/' })
		return json({ message: 'Logout successful.' })
	}

	if (slug !== 'login') error(404, 'Invalido')

	const body = await readJsonBody(event.request)

	let result
	try {
		result = await query(`SELECT authenticate($1) AS "authenticationResult";`, [JSON.stringify(body)])
	} catch (err) {
		console.log(err)
		error(503, 'Error en la base de datos')
	}

	const { authenticationResult }: { authenticationResult: AuthenticationResult } = result.rows[0]

	if (!authenticationResult.user) error(authenticationResult.statusCode, authenticationResult.status)

	// Ensures hooks.server.ts:handle() will not delete session cookie
	event.locals.user = authenticationResult.user
	cookies.set('session', authenticationResult.sessionId, {
		httpOnly: true,
		// CSRF guard: with SameSite=Lax the browser leaves this cookie off any request another
		// site starts, other than following a plain link. No `secure` option on purpose:
		// SvelteKit then marks the cookie Secure everywhere except on http://localhost.
		sameSite: 'lax',
		path: '/'
	})
	return json({ message: authenticationResult.status, user: authenticationResult.user })
}
