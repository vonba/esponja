import { json, type Handle, type RequestEvent } from '@sveltejs/kit'
import { query } from '$lib/server/db'

// Requests that can change something on the server
const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

// CSRF guard: is this a request that another website made the visitor's browser send?
// Browsers put an Origin header on every POST, PUT, PATCH and DELETE a page sends, so one that
// doesn't match this site came from somewhere else ("null" included, which is what sandboxed
// frames and some redirects send). A request without any Origin header did not come from another
// site's page (curl, a server, SvelteKit's own server-side fetch), so it can't be riding on a
// visitor's session cookie.
// SvelteKit has a similar check built in, but it only looks at form submissions: a cross-site
// fetch() with a JSON body or no content type at all gets past it.
function isCrossSiteWrite(event: RequestEvent) {
	if (!STATE_CHANGING_METHODS.includes(event.request.method)) return false
	const origin = event.request.headers.get('origin')
	return origin !== null && origin !== event.url.origin
}

// Attach authorization to each server request (role may have changed)
async function attachUserToRequestEvent(sessionId: string, event: RequestEvent) {
	const sql = `SELECT * FROM get_session($1);`
	const { rows } = await query(sql, [sessionId])
	if (rows?.length > 0) {
		event.locals.user = <User>rows[0].get_session
	}
}

// Invoked for each endpoint called and initially for SSR router
export const handle: Handle = async ({ event, resolve }) => {
	// CSRF guard: turned away before the session is even looked up
	if (isCrossSiteWrite(event)) {
		return json({ message: 'Solicitud rechazada: viene de otro sitio' }, { status: 403 })
	}

	const { cookies } = event
	const sessionId = cookies.get('session')

	// before endpoint or page is called
	if (sessionId) {
		await attachUserToRequestEvent(sessionId, event)
	}

	// Only clear a session cookie that was sent but is no longer valid. Deleting it
	// unconditionally adds a Set-Cookie header to every response, and the CDN refuses
	// to cache any response that sets a cookie.
	if (sessionId && !event.locals.user) cookies.delete('session', { path: '/' })

	const response = await resolve(event)

	// after endpoint or page is called

	return response
}
