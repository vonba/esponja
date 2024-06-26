/* eslint-disable @typescript-eslint/no-explicit-any */

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare namespace App {
	interface Locals {
		user: User
	}
}

interface AuthenticationResult {
	statusCode: NumericRange<400, 599>
	status: string
	user: User
	sessionId: string
}

interface Credentials {
	email: string
	password: string
}

interface UserProperties {
	id: number
	expires?: string // ISO-8601 datetime
	role: 'contributor' | 'editor' | 'admin'
	password?: string
	firstName?: string
	lastName?: string
	email?: string
	blocked: boolean
}

type User = UserProperties | undefined | null

interface VenueProperties {
	id: number;
  name: string;
	slug: string;
  addressline1?: string;
  addressline2?: string;
  postcode?: string;
  city?: string;
  state?: string;
  hidden: boolean;
}

type Venue = VenueProperties | undefined | null

interface EventProperties {
  id: number;
  userId?: number;
  venueId?: number;
  name: string;
	slug: string;
  startDate: string; // ISO 8601 date format
  startTime?: string; // ISO 8601 time format
  endDate?: string; // ISO 8601 date format
  endTime?: string; // ISO 8601 time format
  description?: string;
  ticketLink?: string;
  price?: number;
  priceMax?: number;
	imageKeyLarge?: string;
	imageKeySmall?: string;
	hidden?: boolean;
	published?: boolean;
	submitterName?: string;
	submitterEmail?: string;
	addressLine1?: string;
	addressLine2?: string;
	addressPostCode?: string;
	addressCity?: string;
	addressState?: string;
	addressCountry?: string;
}

type EEvent = EventProperties | undefined | null

interface LikedEvent {
  id: number;
  name: string;
  slug: string,
  imageKeyLarge?: string,
  imageKeySmall?: string,
  startDate: string,
  startTime?: string,
  endDate?: string,
  endTime?: string,
}

interface UserSession {
	id: string
	user: User
}

interface AdminPageData {
	user: User,
	users: UserProperties[];
	venues: [VenueProperties] | [];
	events: [EventProperties] | [];
}

interface HomePageData {
	venues: [VenueProperties] | [];
	events: [EventProperties] | [];
}

type SingleEventPageData = {
	user: User,
	event: {event: EventProperties, relatedEvents: [EventProperties] | []},
	venues: [VenueProperties] | []
}

type SuggestEventPageData = {
	venues: [VenueProperties] | []
}

type SingleVenuePageData = {
	user: User,
	venue: VenueProperties,
	events: EventProperties[],
}


