import type { Secret } from 'jsonwebtoken'
import type { RequestHandler } from './$types'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '$env/static/private'
import { query } from '$lib/server/db'
import { readJsonBody } from '$lib/server/http'
import { sendPasswordResetEmail } from '$lib/server/mail'

export const POST: RequestHandler = async event => {
	const body = await readJsonBody(event.request)
	const sql = `SELECT id as "userId" FROM users WHERE email = $1 LIMIT 1;`
	const { rows } = await query(sql, [body.email])

	if (rows.length > 0) {
		const { userId } = rows[0]
		// Create JWT with userId expiring in 30 mins
		const secret = JWT_SECRET
		const token = jwt.sign({ subject: userId }, <Secret>secret, {
			expiresIn: '30m'
		})
		await sendPasswordResetEmail(body.email, token)
	}

	return new Response(undefined, { status: 204 })
}
