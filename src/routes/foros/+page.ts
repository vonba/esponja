import { publicCacheHeaders } from '$lib/cache'
import { getUpcomingEvents, getVenues } from '$lib/publicData'

export const load = async ({ fetch, setHeaders }) => {
	setHeaders(publicCacheHeaders())

	// Upcoming events come from the same listing the events pages use, so splitting the
	// venues into "with events" and "without" costs no extra request
	const [venues, events] = await Promise.all([getVenues(fetch), getUpcomingEvents(fetch)])
	return { venues, events }
}
