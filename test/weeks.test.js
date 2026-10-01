import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  weekIndexForDate, dateForDay, isoYearWeek, weekKeyOf, weekIndexFromIso,
  weekIndexFromKey, weekLabel, isoDateForDay,
} from '../src/weeks.js';

// The ISO week function the app used before v1.29 (kept here as the reference)
const legacyISOWeek = (date) => {
  const target = new Date(date.valueOf());
  const dayNum = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNum + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  return 1 + Math.ceil((firstThursday - target) / 604800000);
};

test('index equals the old ISO week number for every ISO-2026 day', () => {
  // ISO year 2026 runs Monday 2025-12-29 .. Sunday 2027-01-03
  for (let d = new Date(2025, 11, 29); d <= new Date(2027, 0, 3); d.setDate(d.getDate() + 1)) {
    assert.equal(weekIndexForDate(d), legacyISOWeek(d), d.toDateString());
  }
});

test('known dates', () => {
  assert.equal(weekIndexForDate(new Date(2026, 0, 1)), 1);
  assert.equal(weekIndexForDate(new Date(2026, 8, 21)), 39); // Monday 21 Sep 2026
  assert.equal(weekIndexForDate(new Date(2026, 9, 1)), 40);
  assert.equal(weekIndexForDate(new Date(2026, 11, 31)), 53);
  assert.equal(weekIndexForDate(new Date(2027, 0, 3)), 53); // Sunday, still 2026-W53
  assert.equal(weekIndexForDate(new Date(2027, 0, 4)), 54); // Monday, 2027-W01
  assert.equal(weekIndexForDate(new Date(2025, 11, 28)), 0); // Sunday before the epoch
});

test('late-evening and early-morning times stay on their own local day', () => {
  assert.equal(weekIndexForDate(new Date(2026, 8, 20, 23, 59)), 38); // Sunday night
  assert.equal(weekIndexForDate(new Date(2026, 8, 21, 0, 1)), 39);   // Monday just after midnight
});

test('weeks never repeat across new year', () => {
  assert.deepEqual(isoYearWeek(1), { year: 2026, week: 1 });
  assert.deepEqual(isoYearWeek(53), { year: 2026, week: 53 });
  assert.deepEqual(isoYearWeek(54), { year: 2027, week: 1 });
  assert.deepEqual(isoYearWeek(105), { year: 2027, week: 52 });
  assert.deepEqual(isoYearWeek(106), { year: 2028, week: 1 });
  assert.equal(weekKeyOf(39), '2026-W39');
  assert.equal(weekKeyOf(54), '2027-W01');
  assert.ok(weekKeyOf(53) < weekKeyOf(54), 'keys sort chronologically');
});

test('dates for days', () => {
  assert.equal(isoDateForDay(1, 0), '2025-12-29');
  assert.equal(isoDateForDay(40, 3), '2026-10-01');
  assert.equal(isoDateForDay(54, 0), '2027-01-04');
  assert.equal(isoDateForDay(53, 6), '2027-01-03');
  // across the DST switch (25 Oct 2026) days are still whole days
  assert.equal(isoDateForDay(43, 6), '2026-10-25');
  assert.equal(isoDateForDay(44, 0), '2026-10-26');
  assert.equal(dateForDay(44, 0).getDay(), 1);
});

test('round trips between index, ISO year/week and key', () => {
  for (let idx = -60; idx <= 400; idx++) {
    const { year, week } = isoYearWeek(idx);
    assert.equal(weekIndexFromIso(year, week), idx);
    assert.equal(weekIndexFromKey(weekKeyOf(idx)), idx);
    assert.equal(weekIndexForDate(dateForDay(idx, 0)), idx);
    assert.equal(weekIndexForDate(dateForDay(idx, 6)), idx);
    assert.equal(dateForDay(idx, 0).getDay(), 1, 'weeks start on Monday');
  }
});

test('parsing keys', () => {
  assert.equal(weekIndexFromKey('2026-W39'), 39);
  assert.equal(weekIndexFromKey('2027-W01'), 54);
  assert.equal(weekIndexFromKey('12', 2026), 12);
  assert.equal(weekIndexFromKey('1', 2027), 54);
  assert.equal(weekIndexFromKey('nonsense'), null);
});

test('labels add the year only when it is not the current one', () => {
  const now = new Date(2026, 9, 1);
  assert.equal(weekLabel(40, { now }), 'V.40');
  assert.equal(weekLabel(54, { now }), 'V.1 2027');
  assert.equal(weekLabel(53, { now: new Date(2027, 1, 1) }), 'V.53 2026');
  assert.equal(weekLabel(40, { now, prefix: 'v.' }), 'v.40');
});
