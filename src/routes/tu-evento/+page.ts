import { error } from "@sveltejs/kit";

export const load = async ({params, fetch}) => {
	const returnValue = {
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
		
	} catch (err) {
		error(503, 'Error de base de datos')
	}

	return returnValue;
}