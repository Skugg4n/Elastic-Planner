import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  segmentsForInterval, applySegments, newTimerDoc, isForgotten, elapsedMinutes,
  formatClock, formatHours, comboTitle, parseNewEntry, recentCombos,
} from '../src/timer.js';

const at = (iso) => new Date(iso); // +02:00 (summer) / +01:00 (winter) = Stockholm wall clock

// The first cases are the same as in nexus firebase/functions/planner-timer.test.js:
// the app and the backend must cut time into blocks identically.
test('an ordinary session snaps to the half-hour grid', () => {
  assert.deepEqual(segmentsForInterval(at('2026-10-01T13:07:00+02:00'), at('2026-10-01T14:22:00+02:00')),
    [{ weekIndex: 40, day: 3, start: 13, duration: 1.5 }]);
  assert.deepEqual(segmentsForInterval(at('2026-10-01T09:20:00+02:00'), at('2026-10-01T10:40:00+02:00')),
    [{ weekIndex: 40, day: 3, start: 9.5, duration: 1 }]);
});

test('a mis-click writes nothing, a short session becomes half an hour', () => {
  assert.deepEqual(segmentsForInterval(at('2026-10-01T13:00:00+02:00'), at('2026-10-01T13:03:00+02:00')), []);
  assert.deepEqual(segmentsForInterval(at('2026-10-01T13:00:00+02:00'), at('2026-10-01T13:09:00+02:00')),
    [{ weekIndex: 40, day: 3, start: 13, duration: 0.5 }]);
});

test('past midnight and past Sunday', () => {
  assert.deepEqual(segmentsForInterval(at('2026-10-01T22:10:00+02:00'), at('2026-10-02T01:40:00+02:00')), [
    { weekIndex: 40, day: 3, start: 22, duration: 2 },
    { weekIndex: 40, day: 4, start: 0, duration: 1.5 },
  ]);
  assert.deepEqual(segmentsForInterval(at('2027-01-03T22:00:00+01:00'), at('2027-01-04T01:00:00+01:00')), [
    { weekIndex: 53, day: 6, start: 22, duration: 2 },
    { weekIndex: 54, day: 0, start: 0, duration: 1 },
  ]);
});

test('applySegments adds a done block, and continues it when the same thing is resumed', () => {
  const timer = { type: 'creative', label: 'Bok', projectName: 'Tivoli 4', taskName: 'Skiss', startedAt: '2026-10-01T07:00:00.000Z' };
  const calendars = new Map([[40, []]]);
  applySegments(calendars, [{ weekIndex: 40, day: 3, start: 9, duration: 1.5 }], timer, at('2026-10-01T10:30:00+02:00'));
  const [block] = calendars.get(40);
  assert.deepEqual([block.label, block.projectName, block.taskName, block.status, block.trackedBy, block.start, block.duration],
    ['Bok', 'Tivoli 4', 'Skiss', 'done', 'timer', 9, 1.5]);
  const again = applySegments(calendars, [{ weekIndex: 40, day: 3, start: 10.5, duration: 1 }], { ...timer, projectName: 'tivoli 4' }, at('2026-10-01T11:30:00+02:00'));
  assert.equal(again[0].extended, true);
  assert.equal(calendars.get(40).length, 1);
  assert.equal(calendars.get(40)[0].duration, 2.5);
  // something else in between is its own block
  applySegments(calendars, [{ weekIndex: 40, day: 3, start: 11.5, duration: 0.5 }], { ...timer, projectName: 'Dalenum' }, at('2026-10-01T12:00:00+02:00'));
  assert.equal(calendars.get(40).length, 2);
});

test('nothing chosen goes to the catch-all project', () => {
  const doc = newTimerDoc({}, at('2026-10-01T09:00:00+02:00'));
  assert.deepEqual([doc.projectName, doc.unassigned, doc.type, doc.running, doc.source], ['Okonterat', true, 'job', true, 'app']);
  const chosen = newTimerDoc({ type: 'creative', projectName: ' Tivoli 4 ', taskName: ' Skiss ' }, at('2026-10-01T09:00:00+02:00'));
  assert.deepEqual([chosen.projectName, chosen.taskName, chosen.unassigned], ['Tivoli 4', 'Skiss', false]);
  const calendars = new Map([[40, []]]);
  applySegments(calendars, [{ weekIndex: 40, day: 3, start: 9, duration: 1 }], doc, at('2026-10-01T10:00:00+02:00'));
  assert.equal(calendars.get(40)[0].unassigned, true);
});

test('forgotten timers and display helpers', () => {
  const timer = { running: true, startedAt: '2026-10-01T16:00:00+02:00' };
  assert.equal(isForgotten(timer, at('2026-10-01T20:00:00+02:00')), false);
  assert.equal(isForgotten(timer, at('2026-10-02T09:00:00+02:00')), true);
  assert.equal(isForgotten({ running: false }, at('2026-10-02T09:00:00+02:00')), false);
  assert.equal(elapsedMinutes('2026-10-01T09:00:00+02:00', at('2026-10-01T10:12:40+02:00')), 72);
  assert.equal(formatClock(72), '1:12');
  assert.equal(formatClock(5), '0:05');
  assert.equal(formatHours(1.5), '1,5 h');
  assert.equal(comboTitle({ projectName: 'Dalenum', taskName: 'Socme' }), 'Dalenum / Socme');
  assert.equal(comboTitle({ projectName: 'Dalenum', taskName: '' }), 'Dalenum');
  assert.deepEqual(parseNewEntry('Dalenum / Socme'), { projectName: 'Dalenum', taskName: 'Socme' });
});

test('recent combos: newest first, no catch-all, no inactive, one row per project and task', () => {
  const b = (day, start, type, projectName, taskName, extra = {}) => ({ id: `${day}-${start}`, day, start, duration: 1, type, projectName, taskName, status: 'done', ...extra });
  const weeks = {
    39: { calendar: [b(4, 9, 'job', 'Dalenum', 'Socme'), b(1, 9, 'creative', 'Tivoli 4', 'Skiss')] },
    40: { calendar: [
      b(0, 9, 'job', 'Misc', 'Misc'), b(2, 13, 'creative', 'Tivoli 4', 'skiss'),
      b(3, 9, 'job', 'Okonterat', '', { unassigned: true }), b(3, 11, 'job', 'Gammalt', '', { status: 'inactive' }),
      b(3, 12, 'job', '', ''),
    ] },
    20: { calendar: [b(0, 9, 'job', 'Urgammalt', '')] },
  };
  const combos = recentCombos(weeks, 40);
  assert.deepEqual(combos.map((c) => `${c.projectName}/${c.taskName}`), ['Tivoli 4/skiss', 'Misc/Misc', 'Dalenum/Socme']);
  assert.equal(combos[0].hours, 2);
});
