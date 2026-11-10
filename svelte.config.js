import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

const production = process.env.NODE_ENV === 'production'

const baseCsp = [
	'self',
	'https://www.gstatic.com/recaptcha/', // recaptcha
	'https://accounts.google.com/gsi/', // sign-in w/google
	'https://www.google.com/recaptcha/', // recapatcha
	'https://fonts.gstatic.com/', // recaptcha fonts
	'https://va.vercel-scripts.com/',
]

if (!production) baseCsp.push('ws://localhost:3000')

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		// Time limits for slow routes are set in the routes themselves (export const config), since
		// adapter-vercel reads them from there and has no per-file option here
		adapter: adapter(),
		prerender: {
      entries: [
        '/', 
        '/eventos', 
        '/hoy', 
        '/manana', 
        '/semana', 
        '/mes', 
				'/info',
      ]
    },
		csp: {
			// Hashes rather than nonces. Public pages are cached by the CDN and served to every
			// visitor, so a nonce would be the same for everyone until the cache clears, while a hash
			// only ever matches the exact script SvelteKit wrote into the page.
			mode: 'hash',
			directives: {
				'default-src': ['https://maps.googleapis.com', ...baseCsp],
				// XSS guard: no 'unsafe-inline' here. SvelteKit adds a hash for its own startup script and
				// everything else loads as a file from the hosts listed, so the browser refuses inline
				// event handlers (onmouseover="...") and javascript: URLs, which is what injected HTML
				// would rely on. 'unsafe-inline' came from the sveltekit-auth-example template this app
				// started from (it has since dropped it too); nothing here needs it.
				'script-src': ['https://maps.googleapis.com', ...baseCsp],
				'img-src': ['data:', 'blob:', "'self'", 'https://*.amazonaws.com','https://maps.googleapis.com', 'https://maps.gstatic.com', ...baseCsp],
        'style-src': ["'self'", 'https://fonts.googleapis.com/', 'https://maps.googleapis.com', "'unsafe-inline'"], // Allow Google Fonts and inline styles
				'object-src': ['none'],
				'base-uri': ['self']
			}
		},
		files: {
			// serviceWorker: 'src/service-worker.ts'
		}
	}
}

export default config
