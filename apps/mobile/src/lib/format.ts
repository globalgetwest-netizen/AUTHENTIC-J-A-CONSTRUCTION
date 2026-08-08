/** Formatting helpers shared by the mobile screens (Ghana cedis + ISO dates). */

/** 1234.5 → "GH₵ 1,234.50". Handles Prisma Decimal strings too. */
export function formatMoney(value: unknown): string {
  const number =
    typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isFinite(number)) return '—';
  return `GH₵ ${number.toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** ISO string / Date → "12 Mar 2026". */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** ISO string / Date → "12 Mar 2026, 14:05". */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${formatDate(date)} · ${date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

/** "PROCESSED" → "Processed". */
export function label(value: string): string {
  if (!value) return value;
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}