import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/server/db'
import { sendWeeklyDigest } from '$lib/server/mail'
import { eventColumns } from '$lib/server/queries'
import { getCurrentDateInMexicoCity } from '$lib/dateTime'
import { CRON_SECRET } from '$env/static/private'

// GET /api/cron/weekly-digest
// Called by Vercel Cron every Wednesday at 8 PM Mexico City time
// Local test: curl -X GET 'http://localhost:3000/api/cron/weekly-digest' -H 'Authorization: Bearer LD0AARZi1SVDd3ar25HiZ+gE0QW3c7j8m1Gr/J2N7dY='
export const GET: RequestHandler = async ({ request }) => {
	// Verify this is called by Vercel Cron
	const authHeader = request.headers.get('authorization')

	if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
		console.error('Unauthorized cron request')
		error(401, 'Unauthorized')
	}

	try {
		// Calculate date range: Today (Wednesday) through next Wednesday (inclusive)
		// Query uses start_date < endDate, so endDate should be day after last included day

		// Get current date in Mexico City timezone
		const startDate = getCurrentDateInMexicoCity()

		// End date: 8 days from today (to include up to and including next Wednesday with < operator)
		const today = new Date(startDate + 'T00:00:00')
		const oneWeekFromToday = new Date(today)
		oneWeekFromToday.setDate(today.getDate() + 8)

		const endDate = oneWeekFromToday.toISOString().split('T')[0]

		// Fetch published, non-hidden events for the week
		const eventsResult = await query(
			`
      SELECT ${eventColumns}
      FROM events
      WHERE published = true
        AND hidden = false
        AND (
          (start_date >= $1 AND start_date < $2)
          OR (end_date IS NOT NULL AND end_date >= $1 AND start_date < $2)
        )
      ORDER BY start_date ASC, start_time ASC
    `,
			[startDate, endDate]
		)

		const events = eventsResult.rows.map((row) => ({
			...row,
			startDate: row.startDate instanceof Date ? row.startDate.toISOString().split('T')[0] : row.startDate,
			endDate: row.endDate instanceof Date ? row.endDate.toISOString().split('T')[0] : row.endDate
		}))

		// If no events found, skip sending emails
		if (events.length === 0) {
			console.log('No events found for this week - skipping digest')
			return json({
				message: 'No events found - digest not sent',
				eventCount: 0,
				dateRange: { startDate, endDate }
			})
		}

		// Fetch venues
		const venuesResult = await query(
			`SELECT id, name, slug FROM venues WHERE hidden = false`
		)
		const venues = venuesResult.rows

		// Fetch active subscribers
		const subscribersResult = await query(
			`SELECT email, unsubscribe_token FROM digest_subscribers WHERE active = true`
		)

		if (subscribersResult.rowCount === 0) {
			console.log('No active subscribers')
			return json({ message: 'No active subscribers', eventCount: events.length })
		}

		// Send emails (batch processing to avoid overwhelming SMTP)
		const batchSize = 50
		let sentCount = 0
		let failedCount = 0

		for (let i = 0; i < subscribersResult.rows.length; i += batchSize) {
			const batch = subscribersResult.rows.slice(i, i + batchSize)

			await Promise.allSettled(
				batch.map(async (subscriber) => {
					try {
						await sendWeeklyDigest(
							subscriber.email,
							events,
							venues,
							subscriber.unsubscribe_token,
							startDate,
							endDate
						)
						sentCount++
					} catch (err) {
						console.error(`Failed to send digest to ${subscriber.email}:`, err)
						failedCount++
					}
				})
			)

			// Small delay between batches to avoid rate limiting
			if (i + batchSize < subscribersResult.rows.length) {
				await new Promise((resolve) => setTimeout(resolve, 1000))
			}
		}

		console.log(`Weekly digest sent: ${sentCount} successful, ${failedCount} failed`)

		return json({
			success: true,
			eventCount: events.length,
			subscriberCount: subscribersResult.rowCount,
			sentCount,
			failedCount,
			dateRange: { startDate, endDate }
		})
	} catch (err) {
		console.error('Error in weekly digest cron:', err)
		error(503, 'Error processing weekly digest')
	}
}
