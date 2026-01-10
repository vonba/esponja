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
		adapter: adapter({
			functions: {
				'src/routes/api/v1/event/+server.ts': {
					maxDuration: 30
				},
				'src/routes/api/cron/weekly-digest/+server.ts': {
					maxDuration: 60
				}
			}
		}),		
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
			mode: 'auto',
			directives: {
				'default-src': ['https://maps.googleapis.com', ...baseCsp],
				'script-src': ['unsafe-inline', 'https://maps.googleapis.com', ...baseCsp],
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
