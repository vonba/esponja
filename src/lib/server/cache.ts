import { dangerouslyDeleteByTag } from '@vercel/functions'
import { secondsUntilMidnightInMexicoCity } from '$lib/dateTime'

// Every public response carries this tag so a single call can clear all of them
const PUBLIC_DATA_TAG = 'public-data'

// Cache headers for responses that are the same for every anonymous visitor. The CDN keeps
// them until midnight in Mexico City, when the upcoming events change, or until
// clearPublicCache() runs after an edit. `max-age=0` makes browsers always ask the CDN, so
// a cleared cache reaches them on their next request.
// Never use these on a response that depends on the logged-in user: the CDN cannot tell
// visitors apart and would hand that response to everyone.
export const publicCacheHeaders = (): Record<string, string> => ({
	'Cache-Control': `public, max-age=0, s-maxage=${secondsUntilMidnightInMexicoCity()}, stale-while-revalidate=86400`,
	'Vercel-Cache-Tag': PUBLIC_DATA_TAG,
})

// Call after any change to public events or venues. We delete rather than invalidate:
// invalidating still serves the old copy to the next visitor, who is usually the person
// checking their own edit. The "danger" is many visitors reaching the database at once,
// which is not a concern at our traffic. Outside Vercel (e.g. local dev) this does nothing.
export const clearPublicCache = async () => {
	try {
		await dangerouslyDeleteByTag(PUBLIC_DATA_TAG)
	} catch (err) {
		// The edit itself succeeded; at worst the old copy is shown until midnight
		console.error('Error clearing CDN cache', err)
	}
}
