// Returns e.g. "sábado, 6 de julio 2024"
export function formatDate(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`); // Force local time
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
  return new Intl.DateTimeFormat('es-MX', options).format(date);
}

// Returns e.g. "6 de julio"
export function formatDateShort(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`); // Force local time
  const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
  return new Intl.DateTimeFormat('es-MX', options).format(date);
}

// Returns e.g. "1 PM"
export function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  const options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: 'numeric', hour12: true };
  return new Intl.DateTimeFormat('es-MX', options).format(date);
}

// Returns e.g. "6-julio-2024", for appending to event slugs.
// Returns null if the date is missing or not a valid YYYY-MM-DD string.
export function getDateSlug(dateString: string): string | null {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return null;

  const date = new Date(`${dateString}T00:00:00`); // Force local time
  if (isNaN(date.getTime())) return null;

  // Built and read back in local time, so the day never shifts
  const month = new Intl.DateTimeFormat('es-MX', { month: 'long' }).format(date);
  return `${date.getDate()}-${month}-${date.getFullYear()}`;
}

// Longest possible result of getDateSlug, e.g. "30-septiembre-2024"
export const DATE_SLUG_MAX_LENGTH = 18;

// Returns the current date in Mexico City as a YYYY-MM-DD string. Esponja's "today" is
// always Mexico City's, whether this runs on the server (in UTC) or in a visitor's browser.
export function getCurrentDateInMexicoCity(): string {
  const mexicoCityDateString = new Date().toLocaleString('en-US', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  const [month, day, year] = mexicoCityDateString.split('/')
  return `${year}-${month}-${day}`
}

// Returns the YYYY-MM-DD date the given number of days after (or before) a YYYY-MM-DD date.
// Works in UTC throughout so the local time zone can never shift the day.
function addDays(dateString: string, days: number): string {
  const date = new Date(`${dateString}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().split('T')[0]
}

// Returns the number of seconds until the date changes in Mexico City, for anything
// that should expire when "today" does
export function secondsUntilMidnightInMexicoCity(): number {
  const [hours, minutes, seconds] = new Date()
    .toLocaleTimeString('en-GB', { timeZone: 'America/Mexico_City', hourCycle: 'h23' })
    .split(':')
    .map(Number)
  return 24 * 60 * 60 - (hours * 60 * 60 + minutes * 60 + seconds)
}

// Returns { startDate, endDate } corresponding to time window
// Possible values of time window: hoy | manana | semana | mes
export function getDateFiltersFromTimeWindow(eventTimeWindow: string): {startDate: string | null, endDate: string | null} {
  const today = getCurrentDateInMexicoCity()
  if ('hoy' === eventTimeWindow) {
    return { startDate: today, endDate: today }
  } else if ('manana' === eventTimeWindow) {
    const tomorrow = addDays(today, 1)
    return { startDate: tomorrow, endDate: tomorrow }
  } else if ('semana' === eventTimeWindow) {
    // Sunday to Saturday of the current week
    const dayOfWeek = new Date(`${today}T00:00:00Z`).getUTCDay() // 0 (Sun) to 6 (Sat)
    return { startDate: addDays(today, -dayOfWeek), endDate: addDays(today, 6 - dayOfWeek) }
  }
  return { startDate: null, endDate: null }
}
