import { error } from "@sveltejs/kit";

export const load = async ({params, fetch}) => {
	const venueId = params.slug
	const returnValue = {
		venue: null,
		events: [],
	};
	try {
		// Fetch single venue
		const venueResponse = await fetch(`/api/v1/venue/${venueId}`, {
			method: 'GET'
		});
		if (!venueResponse.ok) {
			throw new Error('Failed to fetch single venue');
		}
		const { venue, events } = await venueResponse.json()
		returnValue.venue = venue
		returnValue.events = events

	} catch (err) {
		error(503, 'Database error')
	}

	return returnValue;
}