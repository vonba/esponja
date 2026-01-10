import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/server/db'

// POST /api/v1/digest-subscribe
// Body: { email: string }
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json()
	const email = body.email?.toLowerCase().trim()

	// Validate email format
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
	if (!email || !emailRegex.test(email)) {
		error(400, 'Dirección de correo electrónico inválida')
	}

	try {
		// Check if email already exists
		const existing = await query(
			`SELECT id, active FROM digest_subscribers WHERE email = $1`,
			[email]
		)

		if (existing.rowCount && existing.rows[0].active) {
			// Already subscribed
			return json({
				message: 'Ya estás suscrito al boletín semanal',
				alreadySubscribed: true
			})
		} else if (existing.rowCount && !existing.rows[0].active) {
			// Reactivate subscription
			await query(
				`UPDATE digest_subscribers SET active = true, subscribed_at = CURRENT_TIMESTAMP WHERE email = $1`,
				[email]
			)
			return json({
				message: '¡Tu suscripción ha sido reactivada!',
				reactivated: true
			})
		} else {
			// New subscription
			await query(
				`INSERT INTO digest_subscribers (email, active) VALUES ($1, true)`,
				[email]
			)
			return json({
				message: '¡Gracias por suscribirte! Recibirás el boletín cada lunes.',
				success: true
			})
		}
	} catch (err) {
		console.error('Error subscribing to digest:', err)
		error(503, 'Error al suscribirse. Por favor intenta de nuevo.')
	}
}
