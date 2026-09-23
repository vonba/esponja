import { redirect } from '@sveltejs/kit';

// Prerendering turns this into a plain redirect at the CDN, so visitors arriving at
// esponja.mx are sent on to /eventos without waiting for a function to start
export const prerender = true

export function load() {
	redirect(302, '/eventos');
}
