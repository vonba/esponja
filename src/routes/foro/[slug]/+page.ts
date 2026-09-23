import { publicCacheHeaders } from '$lib/cache'
import { getVenue } from '$lib/publicData'

export const load = async ({ params, fetch, setHeaders }) => {
	setHeaders(publicCacheHeaders())
	const { venue, events } = await getVenue(fetch, params.slug)
	return { venue, events }
}
