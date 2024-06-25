/* eslint-disable @typescript-eslint/no-explicit-any */

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare namespace App {
	interface Locals {
		user: User
	}

	// interface Platform {}

	interface PrivateEnv {
		// $env/static/private
		DATABASE_URL: string
		DOMAIN: string
		JWT_SECRET: string
		SENDGRID_KEY: string
		SENDGRID_SENDER: string
	}

	interface PublicEnv {
		// $env/static/public
		PUBLIC_GOOGLE_CLIENT_ID: string
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
	hidden: boolean
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
  userId: number;
  venueId: number;
  name: string;
	slug: string;
  startDate: string; // ISO 8601 date format
  startTime?: string; // ISO 8601 time format
  endDate?: string; // ISO 8601 date format
  endTime?: string; // ISO 8601 time format
  description?: string;
  ticketLink?: string;
  priceCents?: number;
	imageKeyLarge?: string;
	imageKeySmall?: string;
	hidden?: boolean;
	published?: boolean;
	submitterName?: string;
	submitterEmail?: string;
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
	event: {event: EEvent, relatedEvents: [EventProperties] | []},
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


