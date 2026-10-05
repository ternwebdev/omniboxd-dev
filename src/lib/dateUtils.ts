import { BirthDateVisibility } from '../types';

/**
 * Utility functions for date and time formatting, avoiding UTC midnight offset bugs
 * (e.g. UTC-3 in Uruguay causing pure dates 'YYYY-MM-DD' to subtract 1 day).
 */

export interface FormattedTripDate {
  date: string;
  time: string | null;
}

/**
 * Formats a trip_date string.
 * Handles:
 * 1. Date-only strings ('YYYY-MM-DD'): Parsed via local date components to avoid timezone rollback.
 * 2. Full timestamps with time (ISO / timestamptz): Formats both date and time in 24h format.
 */
export function formatTripDate(val?: string | null): FormattedTripDate | null {
  if (!val) return null;
  const s = String(val).trim();
  if (!s) return null;

  // Case 1: Pure date 'YYYY-MM-DD'
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    const localDate = new Date(y, m - 1, d);
    return {
      date: localDate.toLocaleDateString('es-UY', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      time: null
    };
  }

  // Case 2: Legacy date stored as UTC midnight 'YYYY-MM-DDTHH:00:00+00:00' or '...Z'
  if (/T00:00:00(\.0+)?(\+00:00|Z)$/.test(s)) {
    const datePart = s.split('T')[0];
    const [y, m, d] = datePart.split('-').map(Number);
    const localDate = new Date(y, m - 1, d);
    return {
      date: localDate.toLocaleDateString('es-UY', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      time: null
    };
  }

  // Case 3: Timestamp with actual time
  let dt: Date;
  if (s.includes(' ') && !s.includes('T') && !s.includes('Z') && !s.includes('+')) {
    dt = new Date(s.replace(' ', 'T'));
  } else {
    dt = new Date(s);
  }

  if (isNaN(dt.getTime())) {
    return { date: s, time: null };
  }

  return {
    date: dt.toLocaleDateString('es-UY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }),
    time: dt.toLocaleTimeString('es-UY', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  };
}

/**
 * Formats standard created_at timestamps.
 */
export function formatPublicationDate(val?: string | null): { date: string; time: string } {
  if (!val) return { date: '', time: '' };
  const d = new Date(val);
  if (isNaN(d.getTime())) {
    return { date: String(val), time: '' };
  }

  return {
    date: d.toLocaleDateString('es-UY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }),
    time: d.toLocaleTimeString('es-UY', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  };
}

/**
 * Converts a date ("YYYY-MM-DD") or datetime-local string ("YYYY-MM-DDTHH:mm") into
 * a payload string:
 * - If pure date ("YYYY-MM-DD"), preserves the exact "YYYY-MM-DD" string.
 * - If datetime, converts to ISO string with local timezone offset, ensuring PostgreSQL casts it accurately
 *   both as DATE and as TIMESTAMPTZ without shifting the calendar day.
 */
export function formatDateTimeForPayload(dateOrDateTime?: string | null): string | null {
  if (!dateOrDateTime) return null;
  const s = dateOrDateTime.trim();
  if (!s) return null;

  // Pure date 'YYYY-MM-DD'
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return s;
  }

  const d = new Date(s);
  if (isNaN(d.getTime())) return s;

  const pad = (n: number) => String(n).padStart(2, '0');
  const offset = -d.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const abs = Math.abs(offset);
  const oh = pad(Math.floor(abs / 60));
  const om = pad(abs % 60);
  const secs = d.getSeconds() === 0 ? '05' : pad(d.getSeconds());

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${secs}${sign}${oh}:${om}`;
}

/**
 * Returns today's date in 'YYYY-MM-DD' format for html input max attribute.
 */
export function getCurrentDateMax(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * Returns today's date and time in 'YYYY-MM-DDTHH:mm' format for html datetime-local input max attribute.
 */
export function getCurrentDateTimeMax(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/**
 * Validates whether a provided date ('YYYY-MM-DD') or datetime ('YYYY-MM-DDTHH:mm' or ISO)
 * is strictly in the future compared to the current client timestamp.
 */
export function isFutureDateOrTime(val?: string | null): boolean {
  if (!val) return false;
  const s = val.trim();
  if (!s) return false;

  const now = new Date();

  // If pure date 'YYYY-MM-DD', compare end of day against now
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    const selectedDate = new Date(y, m - 1, d);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return selectedDate.getTime() > today.getTime();
  }

  const dt = new Date(s);
  if (isNaN(dt.getTime())) return false;
  // Margin of 1 minute to avoid race condition with input time ticking
  return dt.getTime() > (now.getTime() + 60000);
}

/**
 * Formats a birth date according to the user's visibility preference.
 * - 'none': returns null (hidden)
 * - 'year': returns e.g. "1998"
 * - 'month_year': returns e.g. "Octubre de 1998"
 * - 'full': returns e.g. "14 de octubre de 1998"
 */
export function formatBirthDate(
  val?: string | null,
  visibility?: BirthDateVisibility | null
): string | null {
  if (!val || visibility === 'none') return null;
  const s = String(val).trim();
  if (!s) return null;

  const datePart = s.split('T')[0];
  const parts = datePart.split('-');
  if (parts.length < 3) return null;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  const monthNames = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const monthName = monthNames[month] || '';

  const effVisibility = visibility || 'full';

  if (effVisibility === 'year') {
    return `${year}`;
  }
  if (effVisibility === 'month_year') {
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${year}`;
  }
  return `${day} de ${monthName} de ${year}`;
}

/**
 * Formats time in strict 24-hour format (HH:mm)
 */
export function formatTime24h(dateVal?: string | number | Date | null): string {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('es-UY', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Formats relative notification timestamp:
 * - < 1 minute: "hace un momento"
 * - < 60 minutes: "hace X min"
 * - < 24 hours: "hace X h" (or strict 24h time "HH:mm")
 * - 24 to 47 hours: "hace 1 día"
 * - 48 to 71 hours: "hace 2 días"
 * - >= 72 hours: "hace X días"
 */
export function formatNotificationTime(created_at?: string | null): string {
  if (!created_at) return '';
  const d = new Date(created_at);
  if (isNaN(d.getTime())) return '';

  const now = Date.now();
  const diffMs = Math.max(0, now - d.getTime());
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffMinutes < 1) {
    return 'hace un momento';
  }
  if (diffMinutes < 60) {
    return `hace ${diffMinutes} min`;
  }
  if (diffHours < 24) {
    // Within the same 24 hours: show 24h clock time + hours ago
    const time24 = d.toLocaleTimeString('es-UY', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return `${time24} (${diffHours}h)`;
  }
  if (diffDays === 1) {
    return 'hace 1 día';
  }
  return `hace ${diffDays} días`;
}

