const dateTimeFormat = new Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeStyle: 'short' })

/** "15/11/26, 20:05" */
export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso))
}
