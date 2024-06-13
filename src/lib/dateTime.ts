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
  let startDate, endDate
  if ('today' === eventTimeWindow) {
    startDate = new Date().toISOString().split('T')[0];
    endDate = startDate;
  } else if ('tomorrow' === eventTimeWindow) {
    let tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    startDate = tomorrow.toISOString().split('T')[0];
    endDate = startDate;
  } else if ('week' === eventTimeWindow) {
    let currentDate = new Date();
    let firstDayOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 1));
    startDate = firstDayOfWeek.toISOString().split('T')[0];
    let lastDayOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 7));
    endDate = lastDayOfWeek.toISOString().split('T')[0];
  } else if ('month' === eventTimeWindow) {
    let currentMonth = new Date();
    startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0];
    endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0];
  } else {
    startDate = null
    endDate = null
  }
  return { startDate, endDate }
}
