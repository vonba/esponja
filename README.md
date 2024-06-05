# ESPONJA

**Updated for SvelteKit 2.5.7**

## Prerequisites

- PostgreSQL 14.10 or higher
- Node.js 18.19.1 or higher
- Google API client
- Twilio SendGrid account for sending emails

## Setting up the project

Here are the steps:

1. Get the project and setup the database

```bash
# Clone the repo to your current directory
git clone https://github.com/nstuyvesant/sveltekit-auth-example.git

# Install the dependencies
cd /sveltekit-auth-example
yarn install

# Create PostgreSQL database (only works if you installed PostgreSQL)
psql -d postgres -f db_create.sql
```

2. Create a **Google API client ID** per [these instructions](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid). Make sure you include `http://localhost:3000`, `http://localhost` in the Authorized JavaScript origins and `http://localhost:3000/auth/google/callback` in the Authorized redirect URIs for your Client ID for Web application. ** Do not access the site using http://127.0.0.1:3000 ** - use `http://localhost:3000` or it will not work.

3. [Create a free Twilio SendGrid account](https://signup.sendgrid.com) and generate an API Key following [this documentation](https://docs.sendgrid.com/ui/account-and-settings/api-keys) and add a sender as documented [here](https://docs.sendgrid.com/ui/sending-email/senders).

4. Create an **.env** file at the top level of the project with the following values (substituting your own id and PostgreSQL username and password):

```bash
DATABASE_URL=postgres://user:password@localhost:5432/auth
DOMAIN=http://localhost:3000
JWT_SECRET=replace_with_your_own
SENDGRID_KEY=replace_with_your_own
SENDGRID_SENDER=replace_with_your_own
PUBLIC_GOOGLE_CLIENT_ID=replace_with_your_own
```

## Run locally

```bash
# Start the server and open the app in a new browser tab
yarn dev -- --open
```

## Valid logins

The db_create.sql script adds three users to the database with obvious roles:

- admin@example.com password admin123
- editor@example.com password teacher123
- contributor@example.com password student123
