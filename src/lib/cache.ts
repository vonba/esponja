import { secondsUntilMidnightInMexicoCity } from '$lib/dateTime'

// Every public response carries this tag so a single call can clear all of them
// (see clearPublicCache in $lib/server/cache)
export const PUBLIC_DATA_TAG = 'public-data'

// Cache headers for responses that are the same for every visitor. The CDN keeps them until
// midnight in Mexico City, when the upcoming events change, or until clearPublicCache() runs
// after an edit. `max-age=0` makes browsers always ask the CDN, so a cleared cache reaches
// them on their next request.
// Never use these on a response that depends on the logged-in user: the CDN cannot tell
// visitors apart and would hand that response to everyone.
export const publicCacheHeaders = (): Record<string, string> => ({
	'Cache-Control': `public, max-age=0, s-maxage=${secondsUntilMidnightInMexicoCity()}, stale-while-revalidate=86400`,
	'Vercel-Cache-Tag': PUBLIC_DATA_TAG,
})
