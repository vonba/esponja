import { publicCacheHeaders } from '$lib/cache'
import { getVenues } from '$lib/publicData'

export const load = async ({ fetch, setHeaders }) => {
	setHeaders(publicCacheHeaders())
	return { venues: await getVenues(fetch) }
}
