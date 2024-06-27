import { error, type HttpError } from "@sveltejs/kit";

export const load = async ({params, fetch}) => {
	const slug = params.slug
	const returnValue = {
		event: null,
		eventsForVenue: null,
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
		const eventResponse = await fetch(`/api/v1/event/${slug}`, {
			method: 'GET'
		});
		if (!eventResponse.ok) {
			error(eventResponse.status)
		}
		returnValue.event = await eventResponse.json()
		
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