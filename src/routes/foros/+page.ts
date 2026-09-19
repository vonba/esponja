import { error } from '@sveltejs/kit'

export const load = async ({ fetch }) => {
	// Only returns venues that aren't hidden
	const venueResponse = await fetch('/api/v1/venue')
	if (!venueResponse.ok) {
		error(503, 'Error en API de foros')
	}
	const venues: VenueProperties[] = await venueResponse.json()

	return { venues }
}
