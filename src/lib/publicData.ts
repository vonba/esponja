/* eslint-disable @typescript-eslint/no-explicit-any */
import { browser } from '$app/environment'
import { error } from '@sveltejs/kit'
import { getCurrentDateInMexicoCity } from '$lib/dateTime'

// Data for the public pages, loaded the way an anonymous visitor sees it. Because it never
// depends on who is logged in, the pages built from it are the same for everyone and the
// CDN can cache them (see publicCacheHeaders in $lib/cache).

type Fetch = typeof fetch

// How long the browser reuses data it has already loaded, so moving between pages is
// instant. After that it asks the CDN again, which is quick and always up to date.
const REUSE_FOR_MS = 5 * 60 * 1000

// Requests made recently in this browser tab, by URL. Never used on the server, where
// module state is shared by every visitor.
const recent = new Map<string, { time: number; data: Promise<any> }>()

// Forgets everything loaded so far, e.g. when leaving the admin panel after editing
export const forgetPublicData = () => recent.clear()

const toData = (res: Response) => {
	if (res.status === 404) error(404, 'No encontrado')
	if (!res.ok) error(503, 'Error de base de datos')
	return res.json()
}

const getPublic = (fetch: Fetch, url: string): Promise<any> => {
	const hit = browser && recent.get(url)
	if (hit && Date.now() - hit.time < REUSE_FOR_MS) return hit.data

	// Leaving out credentials drops the session cookie, also when SvelteKit makes this request
	// on the server while rendering a page
	const data = fetch(url, { credentials: 'omit' }).then(toData)

	if (browser) {
		recent.set(url, { time: Date.now(), data })
		data.catch(() => recent.delete(url)) // Don't hold on to failures
	}
	return data
}

export const getVenues = (fetch: Fetch): Promise<VenueProperties[]> =>
	getPublic(fetch, '/api/v1/venue')

export const getUpcomingEvents = (fetch: Fetch): Promise<EventProperties[]> =>
	getPublic(fetch, `/api/v1/event?today=${getCurrentDateInMexicoCity()}`)

export const getEvent = (fetch: Fetch, slug: string): Promise<SingleEventPageData['event']> =>
	getPublic(fetch, `/api/v1/event/${slug}`)

export const getVenue = (fetch: Fetch, slug: string): Promise<{ venue: VenueProperties, events: EventProperties[] }> =>
	getPublic(fetch, `/api/v1/venue/${slug}`)

// Lets a logged-in user see an event that is not published yet. Unlike everything above it
// sends the session cookie, and the API never caches ?preview requests.
export const getEventPreview = (fetch: Fetch, slug: string): Promise<SingleEventPageData['event']> =>
	fetch(`/api/v1/event/${slug}?preview`).then(toData)
