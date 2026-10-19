/* eslint-disable @typescript-eslint/no-explicit-any */
import { DATABASE_URL } from '$env/static/private'
import { env } from '$env/dynamic/private'
import { neon } from '@neondatabase/serverless'
import { attachDatabasePool } from '@vercel/functions'
import pg from 'pg'
import type { QueryResult } from 'pg'
import { rootCertificates } from 'node:tls'
// "Supabase Root 2021 CA" from Supabase's dashboard (Database settings > SSL Configuration),
// valid until April 2031
import supabaseCaCert from './supabase-ca.crt?raw'

// Neon (production until October 2026) is reached through its serverless HTTP driver; any other
// Postgres (Supabase in production, the local database in development) through a regular pool
const isNeon = DATABASE_URL.includes('neon.tech')

const createPool = (connectionString: string) => {
	// A database on this machine needs no encryption. Anything else is reached over the internet,
	// so the connection is encrypted and the server's certificate is checked. Supabase signs its
	// certificates with its own authority, which is trusted on top of the usual public ones.
	// An `sslmode` in the URL would replace these settings, so leave it out.
	const { hostname } = new URL(connectionString)
	const isLocal = !hostname || ['localhost', '127.0.0.1', '[::1]'].includes(hostname)
	const ssl = isLocal ? false : { ca: [...rootCertificates, supabaseCaCert] }

	const pool = new pg.Pool({ connectionString, max: 10, ssl })

	// On Vercel, keeps a function alive until its idle connections are closed, so they aren't
	// left hanging when the function is paused between requests
	if (env.VERCEL) attachDatabasePool(pool)

	return pool
}

const sql  = isNeon ? neon(DATABASE_URL, { fullResults: true }) : null
const pool = isNeon ? null : createPool(DATABASE_URL)

export const query = async (text: string, params?: any[]): Promise<QueryResult> => {
	if (sql) {
		const result = await sql.query(text, params)
		return result as unknown as QueryResult
	}
	return pool!.query(text, params)
}
