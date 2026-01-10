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

export function getDateString(date?: Date): string {
  // Create a new Date object (this will hold the current date and time)
  const theDate = date ? date : new Date();

  // Extract the year, month, and day from the Date object
  const year = theDate.getFullYear(); // Get the current year (YYYY)
  let monthNumber = theDate.getMonth() + 1; // Get the current month (0-11, add 1 to make it 1-12)
  let monthString = `${monthNumber}`
  let dayNumber = theDate.getDate(); // Get the current day of the month (1-31)
  let dayString = `${dayNumber}`

  // Pad month and day with leading zeros if they are single digit
  if (monthNumber < 10) {
    monthString = `0${monthNumber}`;
  }
  if (dayNumber < 10) {
    dayString = `0${dayNumber}`;
  }

  // Combine year, month, and day into the desired format
  return `${year}-${monthString}-${dayString}`;
}

// Returns current date in Mexico City timezone as YYYY-MM-DD string
// Use this instead of new Date() to avoid UTC timezone issues
export function getCurrentDateInMexicoCity(): string {
  const nowUTC = new Date()
  const mexicoCityDateString = nowUTC.toLocaleString('en-US', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  const [month, day, year] = mexicoCityDateString.split('/')
  const todayInMexicoCity = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  return todayInMexicoCity.toISOString().split('T')[0]
}

// Returns { startDate, endDate } corresponding to time window
// Possible values of time window: hoy | manana | semana | mes
export function getDateFiltersFromTimeWindow(eventTimeWindow: string): {startDate: string | null, endDate: string | null} {
  let startDate, endDate
  const today = new Date()
  if ('hoy' === eventTimeWindow) {
    startDate = getDateString(today)
    endDate = startDate;
  } else if ('manana' === eventTimeWindow) {
    const tomorrow = new Date()
    tomorrow.setDate(today.getDate() + 1)
    startDate = getDateString(tomorrow)
    endDate = startDate;
  } else if ('semana' === eventTimeWindow) {
    const dayOfWeek = today.getDay() // 0 (Sun) to 6 (Sat)
    const startOfWeek = new Date(today)
    const endOfWeek = new Date(today)

    // Adjust start and end dates to the beginning and end of the week
    startOfWeek.setDate(today.getDate() - dayOfWeek) // Move to Sunday (beginning of the week)
    endOfWeek.setDate(today.getDate() + (6 - dayOfWeek)) // Move to Saturday (end of the week)

    startDate = getDateString(startOfWeek)
    endDate = getDateString(endOfWeek)
  } else {
    startDate = null
    endDate = null
  }
  return { startDate, endDate }
}
