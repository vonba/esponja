/* eslint-disable @typescript-eslint/no-explicit-any */
import { DATABASE_URL } from '$env/static/private'
import { neon } from '@neondatabase/serverless'
import pg from 'pg'
import type { QueryResult } from 'pg'

// Check if we are on Neon (in production)
const isNeon = DATABASE_URL.includes('neon.tech')

// Neon serverless HTTP driver for production; pg.Pool for local dev
const sql  = isNeon ? neon(DATABASE_URL, { fullResults: true }) : null
const pool = isNeon ? null : new pg.Pool({ connectionString: DATABASE_URL, max: 10 })

export const query = async (text: string, params?: any[]): Promise<QueryResult> => {
	if (sql) {
		const result = await sql.query(text, params)
		return result as unknown as QueryResult
	}
	return pool!.query(text, params)
}
