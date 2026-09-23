import { publicCacheHeaders } from '$lib/cache'
import { getEvent, getEventPreview, getVenues } from '$lib/publicData'

export const load = async ({ params, url, fetch, setHeaders }) => {
	// Logged-in users can preview an unpublished event at /evento/[slug]?preview (the admin
	// panel links there). What that page shows depends on who is looking, so it is never cached.
	const isPreview = url.searchParams.has('preview')
	setHeaders(isPreview ? { 'Cache-Control': 'private, no-store' } : publicCacheHeaders())

	const [venues, event] = await Promise.all([
		getVenues(fetch),
		isPreview ? getEventPreview(fetch, params.slug) : getEvent(fetch, params.slug),
	])
	return { venues, event }
}
