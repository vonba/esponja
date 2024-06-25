export const eventColumns = `id, venue_id AS "venueId", user_id AS "userId",
		name, slug, start_date AS "startDate", start_time AS "startTime", end_date AS "endDate",
		end_time AS "endTime", description, ticket_link AS "ticketLink", price_cents AS "priceCents", 
		image_key_large as "imageKeyLarge", image_key_small as "imageKeySmall", hidden, published,
		submitter_name AS "submitterName", submitter_email AS "submitterEmail"`;