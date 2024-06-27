import { error, type HttpError } from "@sveltejs/kit";

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
			error(venueResponse.status)
		}
		const { venue, events } = await venueResponse.json()
		returnValue.venue = venue
		returnValue.events = events

	} catch (err) {
		const errorObj = err as HttpError;
		if (errorObj.status) {
			throw error(errorObj.status, errorObj.body?.message || 'Error fetching event');
		} else {
			throw error(503, 'Error de base de datos');
		}
	}

	return returnValue;
}