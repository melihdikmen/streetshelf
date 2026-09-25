import i18n from '../i18n';

/**
 * Formats a rounded distance the way the cards show it.
 *
 * @param meters Distance in metres, already rounded by the backend.
 * @returns "250 m" under a kilometre, "1.2 km" above.
 */
export function formatDistance(meters: number | null): string {
  if (meters === null) return '';
  if (meters < 1000) return i18n.t('common.distanceMeters', { count: meters });
  return i18n.t('common.distanceKm', { count: Number((meters / 1000).toFixed(1)) });
}

/**
 * Formats a Turkish lira amount without decimals.
 *
 * @param amount Whole or fractional lira.
 */
export function formatMoney(amount: number): string {
  return `₺${Math.round(amount).toLocaleString('tr-TR')}`;
}

/**
 * Formats a `YYYY-MM-DD` date as a short day-month label in the current locale.
 *
 * @param iso Date string from the API.
 */
export function formatShortDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Label for a reserved listing: "Rezerve · 28 Eyl'e kadar" while the handover
 * runs, plain "Rezerve" once the end date has passed (return pending).
 *
 * @param until Last day of the live handover, `YYYY-MM-DD`, if known.
 */
export function formatReserved(until: string | undefined): string {
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  if (!until || until < todayIso) return i18n.t('item.reserved');
  return i18n.t('item.reservedUntil', { date: formatShortDate(until) });
}

/**
 * Formats a timestamp as a clock time for chat bubbles.
 *
 * @param iso ISO timestamp.
 */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(i18n.language === 'tr' ? 'tr-TR' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Number of calendar days between two `YYYY-MM-DD` dates, inclusive.
 */
export function inclusiveDays(start: string, end: string): number {
  const a = new Date(`${start}T00:00:00`).getTime();
  const b = new Date(`${end}T00:00:00`).getTime();
  return Math.max(1, Math.round((b - a) / 86_400_000) + 1);
}
