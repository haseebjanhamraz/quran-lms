/**
 * Islamabad (Asia/Karachi, UTC+5) Timezone Utility for Frontend
 * Canonical timezone for Quran LMS academy.
 */

export const ACADEMY_TIMEZONE = 'Asia/Karachi';
export const PKT_LABEL = 'PKT (Islamabad)';

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export type DayOfWeekName = (typeof DAYS_OF_WEEK)[number];

export const SHORT_DAY_TO_FULL: Record<string, DayOfWeekName> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
  Monday: 'Monday',
  Tuesday: 'Tuesday',
  Wednesday: 'Wednesday',
  Thursday: 'Thursday',
  Friday: 'Friday',
  Saturday: 'Saturday',
  Sunday: 'Sunday',
};

/**
 * Returns current day name in Islamabad timezone ('Monday'..'Sunday').
 */
export function getCurrentDayOfWeekPKT(date: Date = new Date()): DayOfWeekName {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: ACADEMY_TIMEZONE,
    weekday: 'long',
  });
  return (formatter.format(date) || 'Monday') as DayOfWeekName;
}

/**
 * Returns hours and minutes of a date in Islamabad timezone.
 */
export function getPKTHourAndMinute(date: Date = new Date()): { hours: number; minutes: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: ACADEMY_TIMEZONE,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  let hours = 0;
  let minutes = 0;
  for (const p of parts) {
    if (p.type === 'hour') hours = parseInt(p.value, 10) % 24;
    if (p.type === 'minute') minutes = parseInt(p.value, 10);
  }
  return { hours, minutes };
}

/**
 * Formats an ISO date string or Date object into Islamabad 12-hour time (e.g. "04:30 PM").
 */
export function formatPKTTime(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  return date.toLocaleTimeString('en-US', {
    timeZone: ACADEMY_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Formats an ISO date string or Date into full date in PKT (e.g. "Wed, Sep 2, 2026").
 */
export function formatPKTDate(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-US', {
    timeZone: ACADEMY_TIMEZONE,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats time range in 12-hour format with PKT suffix.
 * e.g. "09:00 - 09:30" -> "09:00 AM – 09:30 AM PKT"
 */
export function formatSlotRangePKT(slotString: string): string {
  try {
    const [startStr, endStr] = slotString.split(' - ');
    const formatSingle = (timeStr: string) => {
      const [hStr, mStr] = timeStr.trim().split(':');
      let h = parseInt(hStr, 10);
      const m = parseInt(mStr || '0', 10);
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 || 12;
      const formattedM = m < 10 ? `0${m}` : `${m}`;
      return `${displayH}:${formattedM} ${period}`;
    };

    if (endStr) {
      return `${formatSingle(startStr)} – ${formatSingle(endStr)} PKT`;
    }
    return `${formatSingle(startStr)} PKT`;
  } catch (_) {
    return `${slotString} PKT`;
  }
}

/**
 * Calculates end time string from startTime ("HH:MM") and duration in minutes.
 */
export function calculateEndTimePKT(startTime: string, durationMinutes: number = 30): string {
  if (!startTime) return '';
  const [hStr, mStr] = startTime.split(':').map(Number);
  const total = (isNaN(hStr) ? 0 : hStr) * 60 + (isNaN(mStr) ? 0 : mStr) + durationMinutes;
  const endH = Math.floor(total / 60) % 24;
  const endM = total % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}
