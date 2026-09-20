import { error } from '@sveltejs/kit'
import { getCurrentDateInMexicoCity } from '$lib/dateTime'

export const load = async ({ fetch }) => {
	// Upcoming events come from the same cached listing the events pages use, so splitting
	// the venues into "with events" and "without" costs no extra database query
	const [venueResponse, eventResponse] = await Promise.all([
		fetch('/api/v1/venue'), // Only returns venues that aren't hidden
		fetch(`/api/v1/event?today=${getCurrentDateInMexicoCity()}`)
	])

	if (!venueResponse.ok) {
		error(503, 'Error en API de foros')
	}
	if (!eventResponse.ok) {
		error(503, 'Error en API de eventos')
	}

	const venues: VenueProperties[] = await venueResponse.json()
	const events: EventProperties[] = await eventResponse.json()

	return { venues, events }
}
