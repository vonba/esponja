/* eslint-disable @typescript-eslint/no-explicit-any */
import { error } from '@sveltejs/kit'
import { stripHtml } from 'string-strip-html'
import { query } from '$lib/server/db'
import { toSlug } from '$lib/strings'
import { getDateSlug, DATE_SLUG_MAX_LENGTH } from '$lib/dateTime'

// Matches the slug column in the events table
const SLUG_MAX_LENGTH = 120

// Date fields are omitted rather than sent as empty strings, which Postgres
// cannot cast to date/time
const dateKeys = ['startDate', 'endDate', 'startTime', 'endTime']

// User-facing text fields that must never contain HTML
const textKeys = ['name', 'description', 'ticketLink']

// Shown to the user both by the pre-flight check and by the unique constraint,
// so the two paths are indistinguishable from the outside
export const DUPLICATE_SLUG_MESSAGE =
	'Ya existe un evento con ese nombre en esa fecha.'

// Copies form data into a plain object, skipping files and empty date fields
// (we only use FormData when file uploads are involved)
export function eventFromFormData(formData: FormData): any {
	const eventData: any = {}
	for (const [key, value] of formData as any) {
		if (!(value instanceof File)) {
			if (value || !dateKeys.includes(key)) {
				eventData[key] = value
			}
		}
	}
	return eventData
}

// Builds the slug for a new event by appending the start date to the name (or
// to the manually edited slug), e.g. "fiesta-de-la-luna-6-julio-2024". This is
// what keeps repeating events from colliding with each other.
export function buildEventSlug(input: string, startDate: string): string {
	const dateSlug = toSlug(getDateSlug(startDate) || '')
	if (!dateSlug) error(400, 'La fecha de inicio del evento no es válida')

	// Leave room for the date so the result still fits in the column
	const base = toSlug(input, SLUG_MAX_LENGTH - DATE_SLUG_MAX_LENGTH - 1)
	return base ? `${base}-${dateSlug}` : dateSlug
}

// Normalizes a slug submitted for an existing event, keeping whatever date
// suffix it already carries
export function normalizeEventSlug(input: string): string {
	const slug = toSlug(input)
	if (!slug) error(400, 'El URL del evento no es válido')
	return slug
}

// Throws a 409 if another event already uses this slug.
// excludeId lets an event keep its own slug while being updated.
export async function assertSlugIsAvailable(slug: string, excludeId?: number) {
	const { rows } = excludeId
		? await query('SELECT id FROM events WHERE slug = $1 AND id != $2', [slug, excludeId])
		: await query('SELECT id FROM events WHERE slug = $1', [slug])

	if (rows.length) error(409, DUPLICATE_SLUG_MESSAGE)
}

// The check above can lose a race with a concurrent request, so the unique
// constraint is the real guard. Recognise it so it maps to the same 409 rather
// than a generic database error.
export function isDuplicateSlugError(err: unknown): boolean {
	const dbError = err as { code?: string; constraint?: string; message?: string }
	if (dbError?.code !== '23505') return false
	// pg reports the constraint by name; the Neon driver only guarantees the message
	return dbError.constraint === 'events_slug_key' || !!dbError.message?.includes('events_slug_key')
}

// Removes any HTML from the user-supplied text fields
export function sanitizeEventText(eventData: any) {
	for (const key of textKeys) {
		if (typeof eventData[key] === 'string') {
			eventData[key] = stripHtml(eventData[key]).result
		}
	}
}

// upsert_event takes JSON, so values that arrived as the strings "null" or
// "undefined" need correcting before they are cast
export function toEventQueryBody(eventData: any): string {
	return JSON.stringify(eventData)
		.replace(/"null"/g, 'null')
		.replace(/"undefined"/g, 'null')
}

// Validates an event id arriving from the client as form data
export function parseEventId(input: any): number {
	const id = Number(input)
	if (!Number.isInteger(id) || id <= 0) error(400, 'Evento no especificado')
	return id
}
