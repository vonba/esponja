import { createTransport } from 'nodemailer';
// import SMTPTransport = require('nodemailer/lib/smtp-transport');
import { MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, MAIL_FROM, MAIL_NOTIFICATIONS_TO } from '$env/static/private'
import { PUBLIC_DOMAIN } from '$env/static/public';
import { getImageURL } from '$lib/file';
import { escapeHtml } from '$lib/strings';

// XSS guard: these emails are HTML built as strings, and event names, descriptions and the
// submitter's name and email are typed in by the public. Every such value goes through
// escapeHtml() before it lands in the HTML; the getStyled* helpers below escape their own
// text and link, so pass them plain text.

const transport = createTransport({
  host: MAIL_HOST,
  port: parseInt(MAIL_PORT),
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS,
  },
});

function getFormattedEmail(text: string): string {
  return `
  <!DOCTYPE html>
  <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Esponja</title>
      </head>
      <body style="margin: 0; color: #007E68; font-family: 'Open Sans', 'Arial', sans-serif; background-color: #FFF; text-align: center;">
      <div style="display: inline-block; text-align: left; max-width: 40em; margin: 1em 0.5em; padding: 1em; border: 1px solid #007E68; border-radius: 5px; padding: 1em;">
        <div style="text-align: center; margin-top: 40px; margin-bottom: 40px;">
          <img src="https://esponja.mx/esponja-blob-green.png" alt="Esponja" height="40" />
        </div>
          ${text}
        </div>
      </body>
  </html>
	`;
}

function getStyledButton(text: string, link: string): string {
  return `
  <p style="text-align: center;">
    <a href="${escapeHtml(link)}" style="text-decoration: none; color: #007E68; padding: 0.5em 1em; border-radius: 5px; display: inline-block; margin: 1em; border: 1px solid #007E68;">
      ${escapeHtml(text)}
    </a>
  <p>
	`;
}

function getStyledHeader(text: string): string {
  return `
  <h2 style="color: #007E68; text-align: center; margin: 0 0 1em 0;">
    ${escapeHtml(text)}
    <div style="text-align: center">
      <span style="display: inline-block; height: 0; border-bottom: 2px solid #FFA900; margin-top: 1em;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
    </div>
  </h2>
	`;
}

function getStyledLink(text: string, link: string): string {
  return `<a href="${escapeHtml(link)}" style="color: #007E68;">${escapeHtml(text)}</a>`;
}

async function sendMail(data: {to: string, from: string, subject: string, html: string}) {
  console.log(`Sending mail to ${data.to} with subject ${data.subject}`)
  // await transport.sendMail(data).catch((reason: string) => console.log('error', `Error sending email: ${reason}`));
  await new Promise((resolve, reject) => {
    transport.sendMail(data, (err, info) => {
        if (err) {
            console.error(err);
            reject(err);
        } else {
            console.log(info);
            resolve(info);
        }
    });
  });
}

export async function sendModerationSuccessfulNotification(
  submitterName: string,
  submitterEmail: string,
  eventName: string,
  eventSlug: string,
  eventImageKeySmall: string,
): Promise<void> {
  await sendMail({
    to: submitterEmail,
    from: MAIL_FROM,
    subject: `Tu evento: ${eventName}`,
    html: getFormattedEmail(`
        <h2>¡Hola ${escapeHtml(submitterName)}!</h2>
        <p>
					Tu evento ${escapeHtml(eventName)} ya está publicado en
          ${getStyledLink('este URL', `${PUBLIC_DOMAIN}/evento/${eventSlug}`)}
				</p>
        <p>
          <br />
          <img src="${escapeHtml(getImageURL(eventImageKeySmall))}" alt="Imagen del evento" height="400" />
          <br /><br />
        </p>
				<p>
          ¡Gracias por tu ayuda!
				</p>
    `),
  });
}

export async function sendModerationNotification(
  eventName: string,
  submitterName: string,
  submitterEmail: string,
  eventImageKeySmall: string | null,
): Promise<void> {
  await sendMail({
    to: MAIL_NOTIFICATIONS_TO,
    from: MAIL_FROM,
    subject: `Evento en espera: ${eventName}`,
    html: getFormattedEmail(`
        <h2>¡Hola!</h2>
        <p>
					El siguiente evento se acaba de crear:<br />
          ${escapeHtml(eventName)}
				</p>
        <p>
          <br />
          <img src="${eventImageKeySmall ? escapeHtml(getImageURL(eventImageKeySmall)) : ''}" alt="Imagen del evento" height="400" />
          <br /><br />
        </p>
        <p>
          Creado por: ${escapeHtml(submitterName)} (${getStyledLink(submitterEmail, `mailto:${submitterEmail}`)})
        </p>
				<p>
          ${getStyledButton('Ir a admin', `${PUBLIC_DOMAIN}/admin`)}
				</p>
    `),
  });
}

export async function sendPasswordResetEmail(
  userEmail: string,
  token: string,
): Promise<void> {
  await sendMail({
    to: userEmail,
    from: MAIL_FROM,
    subject: 'Cambiar contraseña – Esponja',
    html: getFormattedEmail(`
        <h2>¡Hola!</h2>
        <p>
					<strong>Quieres cambiar tu contraseña?</strong><br />
          Utiliza la siguiente liga.
				</p>
				<p>
          ${getStyledButton('Cambiar mi contraseña', `${PUBLIC_DOMAIN}/auth/reset/${token}`)}
				</p>
				<p>
					Si no has pedido el cambio puedes descartar este mensaje.
				</p>
    `),
  });
}

export async function sendWeeklyDigest(
  recipientEmail: string,
  events: any[],
  venues: any[],
  unsubscribeToken: string,
  startDate: string,
  endDate: string,
): Promise<void> {
  // Build events HTML
  let eventsHtml = ''

  if (events.length === 0) {
    eventsHtml = '<p style="text-align: center; font-style: italic;">No hay eventos programados para esta semana.</p>'
  } else {
    for (const event of events) {
      const imageUrl = event.imageKeySmall ? getImageURL(event.imageKeySmall) : ''
      const eventUrl = `${PUBLIC_DOMAIN}/evento/${event.slug}`

      // Find venue
      const venue = venues.find(v => v.id === event.venueId)
      let venueHtml = ''
      if (venue) {
        const venueUrl = `${PUBLIC_DOMAIN}/foro/${venue.slug}`
        venueHtml = `${getStyledLink(venue.name, venueUrl)} • `
      }

      // Format start date with weekday (e.g., "sábado, 10 de enero")
      const startDateObj = new Date(`${event.startDate}T00:00:00`)
      const startDateFormatter = new Intl.DateTimeFormat('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      })
      const startDateStr = startDateFormatter.format(startDateObj)

      // Format start time
      let startTimeStr = ''
      if (event.startTime) {
        const [hours, minutes] = event.startTime.split(':').map(Number)
        const date = new Date()
        date.setHours(hours, minutes)
        const options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: 'numeric', hour12: true }
        startTimeStr = new Intl.DateTimeFormat('es-MX', options).format(date)
      }

      // Check if multi-day event
      const isMultiDay = event.endDate && event.endDate !== event.startDate
      let dateTimeStr = `${startDateStr}${startTimeStr ? ` • ${startTimeStr}` : ''}`

      if (isMultiDay) {
        // Format end date with weekday
        const endDateObj = new Date(`${event.endDate}T00:00:00`)
        const endDateFormatter = new Intl.DateTimeFormat('es-MX', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        })
        const endDateStr = endDateFormatter.format(endDateObj)

        // Show end date with end time if specified
        let endTimeStr = ''
        if (event.endTime) {
          const [hours, minutes] = event.endTime.split(':').map(Number)
          const date = new Date()
          date.setHours(hours, minutes)
          const options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: 'numeric', hour12: true }
          endTimeStr = new Intl.DateTimeFormat('es-MX', options).format(date)
        }
        dateTimeStr += ` – ${endDateStr}${endTimeStr ? ` • ${endTimeStr}` : ''}`
      }

      // Format price (free events can be null or 0)
      let priceStr = ''
      if (event.price === null || event.price === undefined || event.price === 0) {
        priceStr = ' • Entrada libre'
      } else if (event.priceMax && event.priceMax !== event.price) {
        priceStr = ` • $${event.price} – $${event.priceMax}`
      } else {
        priceStr = ` • $${event.price}`
      }

      // Truncate description to ~150 characters
      let description = event.description || ''
      if (description.length > 150) {
        description = description.substring(0, 150) + '...'
      }

      eventsHtml += `
        <div style="margin-bottom: 2em; padding-bottom: 2em; border-bottom: 1px solid #007E68; text-align: center;">
          ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(event.name)}" style="width: 100%; max-width: 400px; height: auto; border-radius: 5px; margin-bottom: 1em;" />` : ''}
          <h3 style="color: #007E68; margin: 0.5em 0;">
            <a href="${escapeHtml(eventUrl)}" style="color: #007E68; text-decoration: none;">${escapeHtml(event.name)}</a>
          </h3>
          <p style="margin: 0.5em 0; color: #FFA900;">
            ${venueHtml}${dateTimeStr}${priceStr}
          </p>
          ${description ? `<p style="margin: 0.5em 0;">${escapeHtml(description)}</p>` : ''}
          <p style="margin: 0.5em 0;">
            ${getStyledLink('Ver más', eventUrl)}
          </p>
        </div>
      `
    }
  }

  const unsubscribeUrl = `${PUBLIC_DOMAIN}/digest/unsubscribe?token=${unsubscribeToken}`

  // Format dates in Spanish (e.g., "10 de enero")
  const startDateObj = new Date(`${startDate}T00:00:00`)
  const endDateObj = new Date(`${endDate}T00:00:00`)

  const dateFormatter = new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long'
  })

  const formattedStartDate = dateFormatter.format(startDateObj)
  const formattedEndDate = dateFormatter.format(endDateObj)

  await sendMail({
    to: recipientEmail,
    from: MAIL_FROM,
    subject: 'Música alternativa esta semana en esponja.mx',
    html: getFormattedEmail(`
      ${getStyledHeader('Esta semana en Esponja')}
      <p style="text-align: center; margin-bottom: 2em;">
        Eventos de música alternativa del <strong>${formattedStartDate}</strong> al <strong>${formattedEndDate}</strong>
      </p>
      ${eventsHtml}
      <p style="text-align: center; margin-top: 2em; font-size: 0.9em; color: #666;">
        ${getStyledLink('Ver todos los eventos', `${PUBLIC_DOMAIN}/eventos`)}
      </p>
      <p style="text-align: center; margin-top: 2em; font-size: 0.8em; color: #999;">
        ${getStyledLink('Darme de baja', unsubscribeUrl)}
      </p>
    `),
  });
}