import type { PageServerLoad } from './$types'


export const load: PageServerLoad = async ({ locals, fetch }): Promise<HomePageData> => {
	let returnValue: HomePageData = {
		venues: [],
		events: [],
	}

	// Fetch venues
	const venueResponse = await fetch('/api/v1/venue', {
		method: 'GET'
	});
	if (!venueResponse.ok) {
		throw new Error('Failed to fetch venues');
	}
	returnValue.venues = await venueResponse.json();

	// Fetch events
	const eventResponse = await fetch('/api/v1/event', {
		method: 'GET'
	});
	if (!eventResponse.ok) {
		throw new Error('Failed to fetch events');
	}
	returnValue.events = await eventResponse.json();

	return returnValue
}
