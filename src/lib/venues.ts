// Until the event form gets an "online event" option, the venue named "En Línea" stands in
// for online events. It has no real address, so pages leave out its address and map. The
// name is matched ignoring case and accents, since it has been typed both ways.
export const isOnlineVenue = (venue?: VenueProperties | null): boolean =>
	!!venue?.name &&
	venue.name
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '') // Strip accents, e.g. "Línea" -> "Linea"
		.trim()
		.toLowerCase() === 'en linea'
