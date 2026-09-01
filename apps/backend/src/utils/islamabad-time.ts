/**
 * Islamabad (Asia/Karachi, UTC+5) Timezone Utility
 * Canonical timezone for Quran LMS academy.
 */

export const ISLAMABAD_TIMEZONE = 'Asia/Karachi';
export const PKT_OFFSET_HOURS = 5;
export const PKT_OFFSET_MS = PKT_OFFSET_HOURS * 60 * 60 * 1000;

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export type DayName = (typeof DAY_NAMES)[number];

export const SHORT_DAY_TO_FULL: Record<string, DayName> = {
  Sun: 'Sunday',
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sunday: 'Sunday',
  Monday: 'Monday',
  Tuesday: 'Tuesday',
  Wednesday: 'Wednesday',
  Thursday: 'Thursday',
  Friday: 'Friday',
  Saturday: 'Saturday',
};

/**
 * Returns current timestamp shifted for PKT wall-clock calculations if needed,
 * or standard Date object.
 */
export function getNowPKT(): Date {
  return new Date();
}

/**
 * Gets date parts formatted specifically in Islamabad (Asia/Karachi) timezone.
 */
export function getPKTDateParts(date: Date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: ISLAMABAD_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
    weekday: 'long',
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) {
    map[p.type] = p.value;
  }

  const hours = parseInt(map.hour || '0', 10) % 24;
  const minutes = parseInt(map.minute || '0', 10);
  const seconds = parseInt(map.second || '0', 10);
  const year = parseInt(map.year || '1970', 10);
  const month = parseInt(map.month || '1', 10);
  const day = parseInt(map.day || '1', 10);
  const weekday = (map.weekday || 'Monday') as DayName;

  return {
    year,
    month,
    day,
    hours,
    minutes,
    seconds,
    dayOfWeek: weekday,
  };
}

/**
 * Returns current day of week in Islamabad timezone ('Monday' .. 'Sunday').
 */
export function getDayOfWeekPKT(date: Date = new Date()): DayName {
  return getPKTDateParts(date).dayOfWeek;
}

/**
 * Returns hours and minutes in Islamabad timezone.
 */
export function getPKTHourAndMinute(date: Date = new Date()): { hours: number; minutes: number } {
  const parts = getPKTDateParts(date);
  return { hours: parts.hours, minutes: parts.minutes };
}

/**
 * Formats a Date to HH:MM in Islamabad timezone.
 */
export function formatPKTTime(date: Date): string {
  const { hours, minutes } = getPKTHourAndMinute(date);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Formats a Date to ISO string with +05:00 offset representation.
 */
export function formatPKTISO(date: Date = new Date()): string {
  const { year, month, day, hours, minutes, seconds } = getPKTDateParts(date);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:${pad(seconds)}+05:00`;
}

/**
 * Converts a dayOfWeek ('Monday'..'Sunday') and time ('HH:MM') in PKT
 * for the current/target week into an exact UTC Date object stored in MongoDB.
 */
export function parsePKTDayAndTimeToDate(
  dayOfWeek: string,
  timeStr: string,
  targetWeekRefDate: Date = new Date(),
): Date {
  const fullDay = SHORT_DAY_TO_FULL[dayOfWeek] || 'Monday';
  const [hStr, mStr] = (timeStr || '09:00').split(':');
  const targetHour = parseInt(hStr, 10) || 0;
  const targetMinute = parseInt(mStr, 10) || 0;

  // Find target week's Monday in PKT
  const refParts = getPKTDateParts(targetWeekRefDate);
  const dayIndexMap: Record<DayName, number> = {
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
    Saturday: 5,
    Sunday: 6,
  };

  const currentDayIdx = dayIndexMap[refParts.dayOfWeek] ?? 0;
  const targetDayIdx = dayIndexMap[fullDay as DayName] ?? 0;
  const dayDiff = targetDayIdx - currentDayIdx;

  // Construct UTC equivalent of (refDate in PKT + dayDiff days + targetHour:targetMinute PKT)
  // Since PKT is UTC+5, target UTC time is (Target PKT Hour - 5) UTC
  const d = new Date(targetWeekRefDate);
  // Using Date.UTC to avoid local server timezone interference
  const baseUtcYear = refParts.year;
  const baseUtcMonth = refParts.month - 1; // 0-indexed
  const baseUtcDay = refParts.day + dayDiff;

  const utcDate = new Date(Date.UTC(baseUtcYear, baseUtcMonth, baseUtcDay, targetHour - PKT_OFFSET_HOURS, targetMinute, 0, 0));
  return utcDate;
}

/**
 * Converts HH:MM string to total minutes from midnight.
 */
export function timeStringToMinutes(time: string): number {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
}

/**
 * Converts total minutes from midnight to HH:MM.
 */
export function minutesToTimeString(minutes: number): string {
  const norm = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
