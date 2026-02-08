/**
 * Format a date for French display with explicit Europe/Paris timezone.
 * Always uses Europe/Paris to avoid Vercel serverless UTC issues.
 */
export function formatDateTimeFR(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
