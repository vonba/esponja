import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig({
	ssr: {
		noExternal: ['@googlemaps/js-api-loader'],
	},
	plugins: [sveltekit()],
	server: {
		host: 'localhost',
		port: 3000,
		open: 'http://localhost:3000'
	},
	css: {
		preprocessorOptions: {
			scss: {
				silenceDeprecations: ['legacy-js-api']
			}
		}
	}
})
