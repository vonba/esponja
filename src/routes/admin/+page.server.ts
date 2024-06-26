import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, fetch }): Promise<AdminPageData> => {
	const { user } = locals
	
	// Check role
	const authorized = ['admin', 'contributor', 'editor']
	if (!user || !authorized.includes(user.role)) {
		redirect(302, '/login?referrer=/admin')
	}

	let returnValue: AdminPageData = {
		user,
		users: [],
		venues: [],
		events: [],
	}

	// Fetch venues
	const venueResponse = await fetch('/api/v1/venue?showHidden=true', {
		method: 'GET'
	});
	if (!venueResponse.ok) {
		throw new Error('Failed to fetch venues');
	}
	returnValue.venues = await venueResponse.json();

	// Fetch events
	const eventResponse = await fetch('/api/v1/event?showUnpublished=true&showHidden=true', {
		method: 'GET'
	});
	if (!eventResponse.ok) {
		throw new Error('Failed to fetch events');
	}
	returnValue.events = await eventResponse.json();

	if ('admin' === user.role) {
		// Fetch users from the API
		const userResponse = await fetch('/api/v1/user?showBlocked=true', {
			method: 'GET'
		});
		if (!userResponse.ok) {
			throw new Error('Failed to fetch users');
		}
		const users = await userResponse.json();
		returnValue.users = users.filter((u: User) => u?.id !== user.id)
	}

	return returnValue
}
