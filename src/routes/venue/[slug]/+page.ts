import { error } from "@sveltejs/kit";

export const load = async ({params, fetch}) => {
	const venueId = params.slug
	const returnValue = {
		venue: null,
		events: null,
	};
	try {

		// Fetch events
		// TODO: filter by venue
		// const eventsResponse = await fetch('/api/v1/event', {
		// 	method: 'GET'
		// });
		// if (!eventsResponse.ok) {
		// 	throw new Error('Failed to fetch events');
		// }
		// returnValue.events = await eventsResponse.json();

		// Fetch single venue
		const venueResponse = await fetch(`/api/v1/venue/${venueId}`, {
			method: 'GET'
		});
		if (!venueResponse.ok) {
			throw new Error('Failed to fetch single venue');
		}
		returnValue.venue = await venueResponse.json()

	} catch (err) {
		error(503, 'Database error')
	}

	return returnValue;
}