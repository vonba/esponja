import { getDateString } from "$lib/dateTime"
import type { RequestHandler } from "@sveltejs/kit"
import { publicCacheHeaders } from "$lib/server/cache"

export const GET: RequestHandler = async event => {

	const { fetch } = event
  const currentDate = getDateString()
  let events = []

  // Fetch events
  const eventResponse = await fetch('/api/v1/event', {
    method: 'GET'
  });
  if (!eventResponse.ok) {
    throw new Error('Failed to fetch events');
  }
  events = await eventResponse.json();
  const urlElements = events.map((event: EventProperties) => 
    `<url>
      <loc>https://esponja.mx/evento/${event.slug}</loc>
      <lastmod>${currentDate}</lastmod>
      <changefreq>monthly</changefreq>
      <priority>1.0</priority>
    </url>`)
    .join(' ');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8" ?>
    <urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9"
      xmlns:xhtml="https://www.w3.org/1999/xhtml"
      xmlns:mobile="https://www.google.com/schemas/sitemap-mobile/1.0"
      xmlns:news="https://www.google.com/schemas/sitemap-news/0.9"
      xmlns:image="https://www.google.com/schemas/sitemap-image/1.1"
      xmlns:video="https://www.google.com/schemas/sitemap-video/1.1"
    >
      <url>
        <loc>https://esponja.mx/</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
      </url>
      <url>
        <loc>https://esponja.mx/info</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>1.0</priority>
      </url>
      <url>
        <loc>https://esponja.mx/tu-evento</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>1.0</priority>
      </url>
      ${urlElements}
    </urlset>`
    .trim(), {
      headers: { 'Content-Type': 'application/xml', ...publicCacheHeaders() }
    })
  }