export function formatDate(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`); // Force local time
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
  return new Intl.DateTimeFormat('es-MX', options).format(date);
}

export function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  const options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: 'numeric', hour12: true };
  return new Intl.DateTimeFormat('es-MX', options).format(date);
}

export function getDateFiltersFromTimeWindow(eventTimeWindow: string): {startDate: string | null, endDate: string | null} {
  let startDate, endDate;
  const today = new Date();
  if ('hoy' === eventTimeWindow) {
    startDate = today.toISOString().split('T')[0];
    endDate = startDate;
  } else if ('manana' === eventTimeWindow) {
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    startDate = tomorrow.toISOString().split('T')[0];
    endDate = startDate;
  } else if ('semana' === eventTimeWindow) {
    const dayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
    const startOfWeek = new Date(today);
    const endOfWeek = new Date(today);

    // Adjust start and end dates to the beginning and end of the week
    startOfWeek.setDate(today.getDate() - dayOfWeek); // Move to Sunday (beginning of the week)
    endOfWeek.setDate(today.getDate() + (6 - dayOfWeek)); // Move to Saturday (end of the week)

    startDate = startOfWeek.toISOString().split('T')[0];
    endDate = endOfWeek.toISOString().split('T')[0];
  } else if ('mes' === eventTimeWindow) {
    const currentMonth = new Date();
    startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0];
    endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0];
  } else {
    startDate = null;
    endDate = null;
  }
  return { startDate, endDate };
}

