import { dangerouslyDeleteByTag } from '@vercel/functions'
import { PUBLIC_DATA_TAG } from '$lib/cache'

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
