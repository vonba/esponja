import { error } from '@sveltejs/kit'
import { publicCacheHeaders } from '$lib/cache'
import { getUpcomingEvents, getVenues } from '$lib/publicData'

// The events views: /eventos shows everything, the others filter it by date
const timeWindows = ['eventos', 'hoy', 'manana', 'semana', 'mes']

export const load = async ({ params, fetch, setHeaders }) => {
	// This route catches any single path segment, so turn away unknown ones before they
	// cost a database query (bots probe for things like /wp-login.php)
	if (!timeWindows.includes(params.slug)) error(404, 'No encontrado')

	setHeaders(publicCacheHeaders())
	const [venues, events] = await Promise.all([getVenues(fetch), getUpcomingEvents(fetch)])
	return { venues, events }
}
