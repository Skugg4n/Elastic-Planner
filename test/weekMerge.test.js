import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mergeWeek, weeksEqual, weekSignature, isEmptyWeek, diffWeeks, fixDuplicateIds, emptyWeek,
} from '../src/weekMerge.js';

const blk = (id, extra = {}) => ({ id, day: 0, start: 9, duration: 1, type: 'job', label: 'Jobb', status: 'planned', ...extra });
const week = (calendar, extra = {}) => ({ calendar, points: {}, dayStatuses: {}, ...extra });
const ids = (w) => w.calendar.map((b) => b.id).sort();

test('equality ignores order, blank fields and transient flags', () => {
  const a = week([blk('a', { invoiced: false, parallelId: null, description: '' }), blk('b')]);
  const b = week([blk('b'), blk('a', { _weekNum: 3 })]);
  assert.ok(weeksEqual(a, b));
  assert.ok(!weeksEqual(a, week([blk('a', { status: 'done' }), blk('b')])));
  assert.ok(isEmptyWeek({ calendar: [], points: { 0: [] } }));
  assert.ok(isEmptyWeek(undefined));
  assert.ok(weeksEqual({ calendar: [], logs: { 0: [] }, bank: [] }, emptyWeek()), 'legacy fields are ignored');
});

test('no remote change: local result stands', () => {
  const base = week([blk('a'), blk('b')]);
  const local = week([blk('a', { status: 'done' }), blk('b'), blk('c')]);
  assert.ok(weeksEqual(mergeWeek(base, local, base), local));
});

test('no local change: cloud result is taken', () => {
  const base = week([blk('a'), blk('b')]);
  const server = week([blk('a', { status: 'done' }), blk('emma')]);
  assert.ok(weeksEqual(mergeWeek(base, base, server), server));
});

test('both sides add blocks: both are kept (Emma adds while the app is open)', () => {
  const base = week([blk('a')]);
  const local = week([blk('a'), blk('mine')]);
  const server = week([blk('a'), blk('emma')]);
  assert.deepEqual(ids(mergeWeek(base, local, server)), ['a', 'emma', 'mine']);
});

test('edits to different blocks on two devices are both kept', () => {
  const base = week([blk('a'), blk('b')]);
  const local = week([blk('a', { status: 'done' }), blk('b')]);
  const server = week([blk('a'), blk('b', { invoiced: true })]);
  const m = mergeWeek(base, local, server);
  assert.equal(m.calendar.find((x) => x.id === 'a').status, 'done');
  assert.equal(m.calendar.find((x) => x.id === 'b').invoiced, true);
});

test('same block edited on both sides: this device wins', () => {
  const base = week([blk('a')]);
  const local = week([blk('a', { taskName: 'Skiss' })]);
  const server = week([blk('a', { taskName: 'Annat' })]);
  assert.equal(mergeWeek(base, local, server).calendar[0].taskName, 'Skiss');
});

test('deleted here stays deleted, even if the cloud still has it', () => {
  const base = week([blk('a'), blk('b')]);
  const local = week([blk('a')]);
  const server = week([blk('a'), blk('b', { status: 'done' })]);
  assert.deepEqual(ids(mergeWeek(base, local, server)), ['a']);
});

test('deleted elsewhere is removed here, unless it was edited here since', () => {
  const base = week([blk('a'), blk('b')]);
  const server = week([blk('a')]);
  assert.deepEqual(ids(mergeWeek(base, base, server)), ['a']);
  const localEdited = week([blk('a'), blk('b', { duration: 3 })]);
  assert.deepEqual(ids(mergeWeek(base, localEdited, server)), ['a', 'b']);
});

test('no base (new week on this device): union, local wins on clashes', () => {
  const local = week([blk('x', { label: 'Här' }), blk('mine')]);
  const server = week([blk('x', { label: 'Moln' }), blk('emma')]);
  const m = mergeWeek(null, local, server);
  assert.deepEqual(ids(m), ['emma', 'mine', 'x']);
  assert.equal(m.calendar.find((b) => b.id === 'x').label, 'Här');
});

test('no cloud document yet: local is written as is', () => {
  const local = week([blk('a')], { dayStatuses: { 0: 'half' } });
  assert.ok(weeksEqual(mergeWeek(null, local, null), local));
});

test('day statuses merge per day', () => {
  const base = week([], { dayStatuses: { 0: 'half' } });
  const local = week([], { dayStatuses: { 0: 'half', 2: 'off' } });
  const server = week([], { dayStatuses: { 4: 'off' } }); // cloud cleared Monday, set Friday
  assert.deepEqual(mergeWeek(base, local, server).dayStatuses, { 2: 'off', 4: 'off' });
  // clearing a status here survives a merge
  const localCleared = week([], { dayStatuses: {} });
  assert.deepEqual(mergeWeek(base, localCleared, base).dayStatuses, {});
});

test('points merge per item per day', () => {
  const p = (id) => ({ id, text: id, categoryId: 'life' });
  const base = week([], { points: { 1: [p('p1')] } });
  const local = week([], { points: { 1: [p('p1'), p('p2')] } });
  const server = week([], { points: { 1: [p('p1')], 3: [p('p3')] } });
  const m = mergeWeek(base, local, server);
  assert.deepEqual(m.points[1].map((x) => x.id), ['p1', 'p2']);
  assert.deepEqual(m.points[3].map((x) => x.id), ['p3']);
});

test('repeated ids do not make the merge lose blocks', () => {
  const base = week([blk('a'), blk('a', { start: 12 })]);
  const local = week([blk('a'), blk('a', { start: 12 }), blk('n')]);
  const m = mergeWeek(base, local, base);
  assert.equal(m.calendar.length, 3);
});

test('merge output is plain data without undefined', () => {
  const local = week([blk('a', { overflowFrom: undefined })]);
  const m = mergeWeek(null, local, week([]));
  assert.ok(!('overflowFrom' in m.calendar[0]));
  assert.equal(JSON.stringify(m), JSON.stringify(JSON.parse(JSON.stringify(m))));
});

test('merge does not mutate its inputs', () => {
  const base = week([blk('a')]);
  const local = week([blk('a', { status: 'done' })]);
  const server = week([blk('a'), blk('s')]);
  const before = [weekSignature(base), weekSignature(local), weekSignature(server)];
  const m = mergeWeek(base, local, server);
  m.calendar[0].label = 'changed';
  assert.deepEqual([weekSignature(base), weekSignature(local), weekSignature(server)], before);
});

test('diff summary', () => {
  const local = week([blk('a', { invoiced: true }), blk('b'), blk('onlyHere')]);
  const server = week([blk('a'), blk('b'), blk('onlyCloud'), blk('onlyCloud2')]);
  assert.deepEqual(diffWeeks(local, server), { changed: 1, onlyLocal: 1, onlyServer: 2, otherChanged: false, equal: false });
  assert.equal(diffWeeks(local, local).equal, true);
  assert.equal(diffWeeks(week([], { dayStatuses: { 1: 'off' } }), week([])).otherChanged, true);
});

test('fixDuplicateIds renames later occurrences only', () => {
  const cal = [blk('a'), blk('a-split'), blk('a-split', { start: 11 }), blk('a-split', { start: 12 })];
  const fixed = fixDuplicateIds(cal);
  assert.deepEqual(fixed.map((b) => b.id), ['a', 'a-split', 'a-split-2', 'a-split-3']);
  const clean = [blk('a'), blk('b')];
  assert.equal(fixDuplicateIds(clean), clean, 'untouched array is returned as is');
});

test('suggestions merge like blocks: approving here and a new suggestion from the cloud both hold', () => {
  const sug = (id) => ({ id, day: 1, start: 9, duration: 2, type: 'job', label: 'Jobb', projectName: 'Dalenum', source: 'observer' });
  const base = week([], { suggestions: [sug('s1'), sug('s2')] });
  // here: s1 approved (removed from suggestions, added to the calendar)
  const local = week([blk('from-s1')], { suggestions: [sug('s2')] });
  // cloud: the observer added s3 meanwhile
  const server = week([], { suggestions: [sug('s1'), sug('s2'), sug('s3')] });
  const m = mergeWeek(base, local, server);
  assert.deepEqual(m.suggestions.map((x) => x.id), ['s2', 's3']);
  assert.deepEqual(ids(m), ['from-s1']);
});

test('a week holding only suggestions is not empty, and old weeks without the field compare equal', () => {
  assert.ok(!isEmptyWeek({ calendar: [], suggestions: [{ id: 's' }] }));
  assert.ok(weeksEqual({ calendar: [blk('a')] }, { calendar: [blk('a')], suggestions: [] }));
  assert.ok(!weeksEqual({ calendar: [], suggestions: [{ id: 's' }] }, { calendar: [] }));
  assert.equal(diffWeeks(week([], { suggestions: [{ id: 's' }] }), week([])).otherChanged, true);
});
