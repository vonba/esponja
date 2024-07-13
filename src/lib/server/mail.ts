import { createTransport } from 'nodemailer';
// import SMTPTransport = require('nodemailer/lib/smtp-transport');
import { MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, MAIL_FROM, MAIL_NOTIFICATIONS_TO } from '$env/static/private'
import { PUBLIC_DOMAIN } from '$env/static/public';
import { getImageURL } from '$lib/file';

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
      <body style="margin: 0; color: #007E68; font-family: 'Open Sans', 'Arial', sans-serif; background-color: #FFFDF7; text-align: center;">
        <div style="text-align: center; margin-top: 40px; margin-bottom: 40px;">
          <img src="${PUBLIC_DOMAIN}/esponja-blob-green.png" alt="Esponja" height="40" />
        </div>
        <div style="display: inline-block; text-align: left; max-width: 40em; margin: 1em 0.5em; padding: 1em; border: 1px solid #007E68; border-radius: 5px; padding: 1em;">
          ${text}
        </div>
      </body>
  </html>
	`;
}

function getStyledButton(text: string, link: string): string {
  return `
  <p style="text-align: center;">
    <a href="${link}" style="text-decoration: none; color: #007E68; padding: 0.5em 1em; border-radius: 5px; display: inline-block; margin: 1em; border: 1px solid #007E68;">
      ${text}
    </a>
  <p>
	`;
}

function getStyledHeader(text: string): string {
  return `
  <h2 style="color: #000; text-align: center; margin: 0 0 1em 0;">
    ${text}
    <div style="text-align: center">
      <span style="display: inline-block; height: 0; border-bottom: 2px solid #FFA900; margin-top: 1em;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
    </div>
  </h2>
	`;
}

function getStyledLink(text: string, link: string): string {
  return `<a href="${link}" style="color: #007E68;">${text}</a>`;
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
        <h2>¡Hola ${submitterName}!</h2>
        <p>
					Tu evento ${eventName} ya está publicado en
          ${getStyledLink('este URL', `${PUBLIC_DOMAIN}/evento/${eventSlug}`)}
				</p>
        <p>
          <br />
          <img src="${getImageURL(eventImageKeySmall)}" alt="Imagen del evento" height="400" />
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
          ${eventName}
				</p>
        <p>
          <br />
          <img src="${eventImageKeySmall ? getImageURL(eventImageKeySmall) : ''}" alt="Imagen del evento" height="400" />
          <br /><br />
        </p>
        <p>
          Creado por: ${submitterName} (${getStyledLink(submitterEmail, `mailto:${submitterEmail}`)})
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