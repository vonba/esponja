import { error } from '@sveltejs/kit'

// Reads a JSON request body for the API and auth endpoints.
// CSRF guard: the body is only accepted when it is labelled application/json. A page on another
// site can only send that content type after a CORS preflight, which this app never grants.
// Without the check, a cross-site fetch() with no content type at all gets past SvelteKit's own
// origin check (which only covers form submissions) and would still be parsed as JSON here.
// The Origin check in hooks.server.ts is the main guard; this is the second layer.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readJsonBody(request: Request): Promise<any> {
	const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase()
	if (contentType !== 'application/json') error(415, 'Se esperaba JSON (Content-Type: application/json)')

	try {
		return await request.json()
	} catch {
		error(400, 'JSON inválido')
	}
}
