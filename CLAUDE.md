# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ESPONJA is an open events platform built with SvelteKit 2.5.7, PostgreSQL, and deployed to Vercel. It allows users to browse, submit, and manage events with venue information, user authentication, and role-based access control.

## Prerequisites

- PostgreSQL 14.10 or higher
- Node.js 20 or higher
- SMTP account for email functionality
- Google Developer account for Maps API
- AWS S3 for image storage

## Development Commands

### Setup
```bash
# Install dependencies
yarn install

# Create PostgreSQL database (requires PostgreSQL installed locally)
yarn db_create
```

### Development
```bash
# Start dev server (opens at http://localhost:3000)
yarn dev

# Type checking
yarn check

# Type checking with watch mode
yarn check:watch
```

### Build and Preview
```bash
# Build for production
yarn build

# Preview production build
yarn preview

# Start production server (requires build first)
yarn start
```

### Code Quality
```bash
# Run linting (Prettier + ESLint)
yarn lint

# Format code
yarn format
```

## Architecture

### Database Layer

The application uses PostgreSQL with a connection pool configured in `src/lib/server/db.ts`. Key database entities:

- **users**: User accounts with role-based permissions (contributor/editor/admin)
- **venues**: Event locations with address information
- **events**: Event data with date/time, descriptions, pricing, and images
- **sessions**: User session management with UUIDs

The database schema uses:
- `pgcrypto` extension for password hashing
- `uuid-ossp` extension for session ID generation
- Custom ENUM type for roles

Database initialization script: `db_create.sql`

### Authentication & Authorization

Authentication is handled through SvelteKit hooks:

- `src/hooks.server.ts`: Attaches user data to `event.locals.user` on every request based on session cookie
- Sessions are validated against the database using `get_session()` function
- Invalid sessions automatically delete the session cookie
- `get_session()` ignores blocked users, so blocking someone ends their sessions at once
- User roles: `contributor`, `editor`, `admin` (defined in `src/app.d.ts`)
- There is no public sign-up: admins create users through `POST /api/v1/user`. Everyone can edit their own account; only admins edit other users, roles and access.

### XSS and CSRF guards

Code that defends against XSS or CSRF carries a comment starting `XSS guard:` or `CSRF guard:`, so `grep -rn "XSS guard\|CSRF guard" src svelte.config.js` lists every one. In short:

- Never render user input with `{@html}`. Event descriptions go through `descriptionParts()` and user-supplied links through `safeHttpUrl()` (both in `src/lib/strings.ts`). HTML emails escape every value with `escapeHtml()`.
- The CSP has no `'unsafe-inline'` in `script-src`, so inline event handlers and `javascript:` URLs don't run.
- `hooks.server.ts` rejects POST/PUT/PATCH/DELETE requests whose `Origin` is another site, and JSON endpoints read their body with `readJsonBody()` (`src/lib/server/http.ts`), which requires `Content-Type: application/json`.

### Route Structure

```
src/routes/
├── +layout.server.ts          # Loads user from locals
├── +layout.svelte             # Root layout
├── +page.ts                   # Home page
├── [slug]/                    # Dynamic venue pages
├── admin/                     # Admin dashboard (requires auth)
├── auth/                      # Authentication endpoints
│   ├── [slug]/+server.ts      # Login/logout
│   ├── forgot/+server.ts      # Password reset request
│   └── reset/                 # Password reset pages
├── api/v1/                    # API endpoints
│   ├── event/                 # Event CRUD operations
│   ├── user/                  # User management
│   └── venue/                 # Venue management
├── evento/[slug]/             # Single event pages
├── foro/                      # Venue pages
└── tu-evento/                 # Event submission pages
```

### Server-Side Code Organization

```
src/lib/server/
├── db.ts           # PostgreSQL connection pool
├── queries.ts      # Reusable SQL query fragments (e.g., eventColumns)
└── mail.ts         # Email sending with nodemailer
```

### Shared Libraries

```
src/lib/
├── components/     # Reusable Svelte components
├── dateTime.ts     # Date/time utilities using date-fns
├── file.ts         # File handling utilities
├── likedEvents.ts  # Client-side liked events tracking
├── roles.ts        # Role constants and checks
├── s3-config.js    # AWS S3 configuration
└── strings.ts      # String manipulation utilities
```

### Image Handling

Images are stored in AWS S3 with two sizes:
- `imageKeyLarge`: Full-size event images
- `imageKeySmall`: Thumbnail versions

Image processing uses the `jimp` library. S3 configuration is in `src/lib/s3-config.js`.

### Content Security Policy

CSP is configured in `svelte.config.js` with specific allowances for:
- Google Maps API
- Google ReCAPTCHA
- Google Sign-In
- AWS S3 bucket
- Vercel Analytics

In development, WebSocket connections to `ws://localhost:3000` are allowed.

`script-src` has no `'unsafe-inline'`, and `mode: 'hash'` makes SvelteKit add a hash for its own startup script (hashes suit CDN-cached pages better than nonces). Any third-party snippet that needs an inline `<script>` or an `on...=` attribute will be blocked, so load scripts as files from an allowed host.

### Prerendering

Static routes are prerendered for better performance:
- `/` (home)
- `/eventos` (events listing)
- `/hoy`, `/manana`, `/semana`, `/mes` (date-filtered views)
- `/info` (information page)

### Environment Variables

Required environment variables (see `sample.env`):

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT token signing
- `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`, `S3_REGION`: AWS S3 credentials
- `PUBLIC_S3_BUCKET`, `PUBLIC_S3_REGION`: Public S3 configuration
- `PUBLIC_GOOGLE_API_KEY`: Google Maps API key
- `MAIL_FROM`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`: SMTP configuration
- `PUBLIC_DOMAIN`, `DOMAIN`: Application URLs
- `CRON_SECRET`: Bearer token Vercel Cron sends to `/api/cron/weekly-digest`; while it is empty the route refuses every request

### Styling

- Uses SCSS with Sass preprocessor
- Global styles in `src/styles/`
- Component-scoped styles in `.svelte` files
- Legacy JS API deprecation warnings suppressed in `vite.config.ts`

### Type Definitions

Key TypeScript interfaces in `src/app.d.ts`:

- `User`: User with role, authentication status
- `Venue`: Event venue with address
- `EEvent`: Event with dates, pricing, images
- `App.Locals`: SvelteKit locals with user data

### Deployment

Configured for Vercel deployment:
- Adapter: `@sveltejs/adapter-vercel`
- Extended timeout (30s) for event API endpoint
- Configuration: `vercel.json`

### Google Maps Integration

Google Maps is loaded via `@googlemaps/js-api-loader` with SSR support (configured in `vite.config.ts` with `noExternal`).

## Common Patterns

### Database Queries

Always use the `query()` function from `src/lib/server/db.ts`:

```typescript
import { query } from '$lib/server/db'

const { rows } = await query('SELECT * FROM events WHERE id = $1', [eventId])
```

### Accessing User in Routes

```typescript
// In +page.server.ts or +server.ts
export const load = ({ locals }) => {
  const { user } = locals // Set by hooks.server.ts
  return { user }
}
```

### Role-Based Access

Check user roles using constants from `src/lib/roles.ts`. User role is available in `locals.user.role`.

### SQL Column Mappings

Use `eventColumns` from `src/lib/server/queries.ts` for consistent event data retrieval with proper column aliasing (snake_case to camelCase).
