import { writable, type Writable } from 'svelte/store'

// While server determines whether the user is logged in by examining RequestEvent.locals.user, the
// loginSession is updated so all parts of the SPA client-side see the user and role.
export const loginSession = <Writable<User>>writable(undefined)

// The events view (/eventos, /hoy, /manana, /semana) the user last looked at, so the
// "Eventos" button on /foros can take them back to it.
export const lastEventsPath = writable('/eventos')
