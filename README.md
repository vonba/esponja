# ESPONJA

**Updated for SvelteKit 2.5.7**

## Prerequisites

- PostgreSQL 14.10 or higher
- Node.js 18.19.1 or higher
- SMTP account
- Google developer account (for Maps)

## Setting up the project

Here are the steps:

1. Get the project and setup the database

```bash
# Clone the repo to your current directory
git clone https://github.com/vonba/esponja.git

# Install the dependencies
cd /esponja
yarn install

# Create PostgreSQL database (only works if you installed PostgreSQL)
yarn db_create
```

2. Create a google API key for Maps

3. Get your SMTP details

4. Add environment variables to your hosting (see env.)

## Run locally

```bash
# Start the server and open the app in a new browser tab
yarn dev
```
