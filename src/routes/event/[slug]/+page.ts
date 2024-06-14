import { error } from "@sveltejs/kit";

export const load = async ({params, fetch}) => {
	const eventId = params.slug
	const returnValue = {
		event: null,
		venues: null,
	};
	try {
		// Fetch venues
		const venueResponse = await fetch('/api/v1/venue', {
			method: 'GET'
		});
		if (!venueResponse.ok) {
			throw new Error('Failed to fetch venues');
		}
		returnValue.venues = await venueResponse.json();

		// Fetch single event
		const eventResponse = await fetch(`/api/v1/event/${eventId}`, {
			method: 'GET'
		});
		if (!eventResponse.ok) {
			throw new Error('Failed to fetch single event');
		}
		returnValue.event = await eventResponse.json()
	} catch (err) {
		error(503, 'Database error')
	}

	return returnValue;
}