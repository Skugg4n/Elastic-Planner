// Week arithmetic for Elastic Planner.
//
// A week is identified by a running index: 1 = the ISO week 2026-W01 (Monday
// 2025-12-29), 2 = 2026-W02, ... 53 = 2026-W53, 54 = 2027-W01 and so on.
// For all of 2026 the index equals the ISO week number, which is what the app
// stored before v1.29, so no stored data had to move. The index never repeats,
// so week 1 of 2027 can no longer collide with week 1 of 2026, and "previous
// week" / "next week" / ranges are plain integer arithmetic across new year.

const DAY_MS = 86400000;
const utcDays = (y, m, d) => Math.floor(Date.UTC(y, m, d) / DAY_MS);

// Monday of ISO week 2026-W01
const EPOCH_DAYS = utcDays(2025, 11, 29);

const pad2 = (n) => String(n).padStart(2, '0');

/** Week index for a date, using the date's local calendar day. */
export const weekIndexForDate = (date) => {
  const days = utcDays(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((days - EPOCH_DAYS) / 7) + 1;
};

export const currentWeekIndex = () => weekIndexForDate(new Date());

/** Local Date (midnight) for a day in a week. dayIndex 0 = Monday ... 6 = Sunday. */
export const dateForDay = (weekIndex, dayIndex = 0) => {
  const u = new Date((EPOCH_DAYS + (weekIndex - 1) * 7 + dayIndex) * DAY_MS);
  return new Date(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate());
};

/** ISO year and ISO week number for a week index. */
export const isoYearWeek = (weekIndex) => {
  // The ISO year of a week is the calendar year of its Thursday
  const thursday = dateForDay(weekIndex, 3);
  const year = thursday.getFullYear();
  const dayOfYear = utcDays(year, thursday.getMonth(), thursday.getDate()) - utcDays(year, 0, 1);
  return { year, week: Math.floor(dayOfYear / 7) + 1 };
};

/** Sortable key 'YYYY-Www' (also the value format of <input type="week">). */
export const weekKeyOf = (weekIndex) => {
  const { year, week } = isoYearWeek(weekIndex);
  return `${year}-W${pad2(week)}`;
};

/** Week index from an ISO year and week number. */
export const weekIndexFromIso = (year, week) => {
  // January 4th is always in ISO week 1
  const jan4 = new Date(year, 0, 4);
  return weekIndexForDate(jan4) + (week - 1);
};

/** Parse 'YYYY-Www' (or a bare week number, read as a week of the given default year). */
export const weekIndexFromKey = (key, defaultYear = new Date().getFullYear()) => {
  const text = String(key || '').trim();
  const full = text.match(/^(\d{4})-?W(\d{1,2})$/i);
  if (full) return weekIndexFromIso(Number(full[1]), Number(full[2]));
  const bare = text.match(/^(\d{1,2})$/);
  if (bare) return weekIndexFromIso(defaultYear, Number(bare[1]));
  return null;
};

/** ISO week number to show in the UI ("40"). */
export const weekNumberOf = (weekIndex) => isoYearWeek(weekIndex).week;

/** Label for the UI: "V.40", with the year added when it is not the current ISO year. */
export const weekLabel = (weekIndex, { prefix = 'V.', now = new Date() } = {}) => {
  const { year, week } = isoYearWeek(weekIndex);
  const thisYear = isoYearWeek(weekIndexForDate(now)).year;
  return year === thisYear ? `${prefix}${week}` : `${prefix}${week} ${year}`;
};

/** 'YYYY-MM-DD' for a day in a week (local calendar date). */
export const isoDateForDay = (weekIndex, dayIndex = 0) => {
  const d = dateForDay(weekIndex, dayIndex);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};
