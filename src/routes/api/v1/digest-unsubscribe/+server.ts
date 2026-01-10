import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/server/db'

// POST /api/v1/digest-unsubscribe
// Body: { token: string }
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json()
	const token = body.token?.trim()

	if (!token) {
		error(400, 'Token no proporcionado')
	}

	try {
		const result = await query(
			`UPDATE digest_subscribers
       SET active = false
       WHERE unsubscribe_token = $1 AND active = true
       RETURNING email`,
			[token]
		)

		if (result.rowCount === 0) {
			error(404, 'Suscripción no encontrada o ya cancelada')
		}

		return json({
			message: 'Te has dado de baja del boletín semanal',
			success: true
		})
	} catch (err) {
		console.error('Error unsubscribing from digest:', err)
		error(503, 'Error al cancelar suscripción')
	}
}
