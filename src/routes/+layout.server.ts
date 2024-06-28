import type { LayoutServerLoad } from './$types'
import type { Config } from '@sveltejs/adapter-vercel'

export const config: Config = {
	runtime: 'edge',
}

export const load: LayoutServerLoad = ({ locals }) => {
	const { user } = locals // locals.user set by hooks.server.ts/handle(), undefined if not logged in
	return {
		user
	}
}
