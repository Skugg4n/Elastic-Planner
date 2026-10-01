import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createWeekSync } from '../src/weekSync.js';
import { weeksEqual } from '../src/weekMerge.js';

const clone = (v) => JSON.parse(JSON.stringify(v));
const tick = () => new Promise((r) => setImmediate(r));
// Let timers (the debounced flush uses setTimeout) and promise chains run to rest
const settle = async (n = 6) => {
  for (let i = 0; i < n; i++) { await new Promise((r) => setTimeout(r, 3)); await tick(); }
};

const blk = (id, extra = {}) => ({ id, day: 0, start: 9, duration: 1, type: 'job', label: 'Jobb', status: 'planned', ...extra });
const week = (calendar, extra = {}) => ({ calendar, points: {}, dayStatuses: {}, ...extra });
const ids = (w) => (w ? w.calendar.map((b) => b.id).sort() : null);

// A pretend cloud shared by several devices
function makeCloud(initial = {}) {
  const docs = new Map(Object.entries(clone(initial)));
  const listeners = new Set();
  const cloud = {
    docs,
    backups: [],
    writes: 0,
    get: (id) => (docs.has(String(id)) ? clone(docs.get(String(id))) : null),
    // A write from "somewhere else" (Emma, another app)
    externalWrite(id, data) {
      docs.set(String(id), clone(data));
      listeners.forEach((l) => l.online && l.cb({ changes: [{ id: String(id), data: clone(data), pending: false }], initial: false }));
    },
    adapter() {
      const me = { online: true, cb: null, beforeCommit: null };
      const adapter = {
        subscribe(cb) {
          me.cb = cb;
          listeners.add(me);
          setImmediate(() => {
            if (!me.online) return;
            cb({ changes: [...docs.entries()].map(([id, data]) => ({ id, data: clone(data), pending: false })), initial: true });
          });
          return () => listeners.delete(me);
        },
        async transact(id, updater) {
          await tick();
          if (!me.online) throw new Error('offline');
          for (;;) {
            const before = JSON.stringify(docs.get(String(id)) ?? null);
            const out = updater(cloud.get(id));
            if (me.beforeCommit) { const hook = me.beforeCommit; me.beforeCommit = null; hook(); }
            if (JSON.stringify(docs.get(String(id)) ?? null) !== before) continue; // someone wrote in between: retry
            if (out !== undefined) {
              cloud.writes++;
              docs.set(String(id), clone(out));
              listeners.forEach((l) => l.online && l.cb({ changes: [{ id: String(id), data: clone(out), pending: false }], initial: false }));
            }
            return;
          }
        },
        async backup(payload) {
          if (!me.online) throw new Error('offline');
          cloud.backups.push(clone(payload));
        },
        setOnline(v) {
          me.online = v;
          if (v && me.cb) me.cb({ changes: [...docs.entries()].map(([id, data]) => ({ id, data: clone(data), pending: false })), initial: !me.gotInitial });
        },
        hookBeforeCommit(fn) { me.beforeCommit = fn; },
      };
      return adapter;
    },
  };
  return cloud;
}

function makeStorage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k), _map: m };
}

// Devices are stopped after each test so their retry timers do not keep the run alive
const devices = [];
afterEach(() => { devices.splice(0).forEach((d) => d.sync.stop()); });

// A pretend device: holds state like the React app does
function makeDevice(cloud, { weeks = {}, storage = makeStorage(), delayedApply = false, reconciled = false } = {}) {
  if (reconciled) storage.setItem('sync', JSON.stringify({ v: 1, reconciled: true, dirty: {} }));
  const adapter = cloud.adapter();
  const dev = { weeks: clone(weeks), statuses: [], conflicts: null, readyCount: 0, adapter, storage, held: [] };
  dev.sync = createWeekSync({
    adapter,
    getWeeks: () => dev.weeks,
    applyWeeks: (patch) => {
      const run = () => { dev.weeks = { ...dev.weeks, ...patch }; dev.sync.notifyLocalChange(dev.weeks); };
      if (delayedApply) dev.held.push(run); else run();
    },
    storage,
    storageKey: 'sync',
    onStatus: (s) => dev.statuses.push(s),
    onReady: () => { dev.readyCount++; },
    onLegacyConflicts: (c) => { dev.conflicts = c; },
    debounceMs: 0,
  });
  dev.edit = (id, fn) => {
    dev.weeks = { ...dev.weeks, [id]: fn(clone(dev.weeks[id] ?? week([]))) };
    dev.sync.notifyLocalChange(dev.weeks);
  };
  dev.releaseApplies = () => { dev.held.splice(0).forEach((run) => run()); };
  dev.sync.start();
  devices.push(dev);
  return dev;
}

test('a fresh device receives every week from the cloud', async () => {
  const cloud = makeCloud({ 39: week([blk('a')]), 40: week([blk('b')]) });
  const dev = makeDevice(cloud);
  await settle();
  assert.deepEqual(Object.keys(dev.weeks).sort(), ['39', '40']);
  assert.equal(dev.readyCount, 1);
  assert.equal(dev.conflicts, null);
  assert.equal(cloud.writes, 0, 'loading writes nothing');
});

test('looking at weeks never writes; only real edits do', async () => {
  const cloud = makeCloud({ 39: week([blk('a')]), 40: week([blk('b')]) });
  const dev = makeDevice(cloud);
  await settle();
  // the host re-creates week objects without changing content (navigation, re-render)
  dev.weeks = { 39: clone(dev.weeks[39]), 40: clone(dev.weeks[40]) };
  dev.sync.notifyLocalChange(dev.weeks);
  await settle();
  assert.equal(cloud.writes, 0);
  dev.edit(40, (w) => ({ ...w, calendar: [...w.calendar, blk('new')] }));
  await settle();
  assert.equal(cloud.writes, 1);
  assert.deepEqual(ids(cloud.get(40)), ['b', 'new']);
  assert.deepEqual(ids(cloud.get(39)), ['a'], 'other weeks untouched');
  assert.equal(dev.sync.hasUnsaved(), false);
});

test('an edit on one device shows up on the other without reload', async () => {
  const cloud = makeCloud({ 40: week([blk('a')]) });
  const mac = makeDevice(cloud);
  const phone = makeDevice(cloud);
  await settle();
  mac.edit(40, (w) => ({ ...w, calendar: w.calendar.map((b) => ({ ...b, status: 'done' })) }));
  await settle();
  assert.equal(phone.weeks[40].calendar[0].status, 'done');
  assert.equal(phone.sync.hasUnsaved(), false);
});

test('Emma adds a block while the app has an unsaved edit: both survive', async () => {
  const cloud = makeCloud({ 40: week([blk('a')]) });
  const dev = makeDevice(cloud);
  await settle();
  dev.adapter.setOnline(false);
  dev.edit(40, (w) => ({ ...w, calendar: [...w.calendar, blk('mine')] }));
  await settle();
  cloud.externalWrite(40, week([blk('a'), blk('emma')])); // device is offline and does not hear this
  dev.adapter.setOnline(true);
  dev.sync.retry();
  await settle(12);
  assert.deepEqual(ids(cloud.get(40)), ['a', 'emma', 'mine']);
  assert.deepEqual(ids(dev.weeks[40]), ['a', 'emma', 'mine']);
  assert.equal(dev.sync.hasUnsaved(), false);
});

test('two devices edit the same week at the same time: nothing is overwritten', async () => {
  const cloud = makeCloud({ 40: week([blk('a'), blk('b')]) });
  const mac = makeDevice(cloud);
  const phone = makeDevice(cloud);
  await settle();
  mac.edit(40, (w) => ({ ...w, calendar: w.calendar.map((b) => (b.id === 'a' ? { ...b, status: 'done' } : b)) }));
  phone.edit(40, (w) => ({ ...w, calendar: [...w.calendar.map((b) => (b.id === 'b' ? { ...b, taskName: 'AAR' } : b)), blk('timer')] }));
  await settle(12);
  const c = cloud.get(40);
  assert.deepEqual(ids(c), ['a', 'b', 'timer']);
  assert.equal(c.calendar.find((b) => b.id === 'a').status, 'done');
  assert.equal(c.calendar.find((b) => b.id === 'b').taskName, 'AAR');
  assert.ok(weeksEqual(mac.weeks[40], c));
  assert.ok(weeksEqual(phone.weeks[40], c));
});

test('a write that collides inside the transaction is retried on the fresh cloud version', async () => {
  const cloud = makeCloud({ 40: week([blk('a')]) });
  const dev = makeDevice(cloud);
  await settle();
  dev.adapter.hookBeforeCommit(() => cloud.docs.set('40', week([blk('a'), blk('raced')])));
  dev.edit(40, (w) => ({ ...w, calendar: [...w.calendar, blk('mine')] }));
  await settle(12);
  assert.deepEqual(ids(cloud.get(40)), ['a', 'mine', 'raced']);
  assert.deepEqual(ids(dev.weeks[40]), ['a', 'mine', 'raced']);
});

test('offline edits survive a restart and are merged, not blindly written', async () => {
  const cloud = makeCloud({ 40: week([blk('a'), blk('b')]) });
  const storage = makeStorage();
  const dev = makeDevice(cloud, { storage });
  await settle();
  dev.adapter.setOnline(false);
  dev.edit(40, (w) => ({ ...w, calendar: [...w.calendar.filter((b) => b.id !== 'b'), blk('offline')] })); // delete b, add one
  await settle();
  assert.ok(dev.statuses.includes('offline'));
  assert.equal(dev.sync.hasUnsaved(), true);
  dev.sync.stop();
  // meanwhile the cloud changes
  cloud.externalWrite(40, week([blk('a', { status: 'done' }), blk('b'), blk('emma')]));
  // restart: same storage, same cached weeks
  const again = makeDevice(cloud, { storage, weeks: dev.weeks });
  await settle(12);
  const c = cloud.get(40);
  assert.deepEqual(ids(c), ['a', 'emma', 'offline'], 'b stays deleted, emma and offline both kept');
  assert.equal(c.calendar.find((b) => b.id === 'a').status, 'done');
  assert.equal(again.sync.hasUnsaved(), false);
  assert.equal(again.conflicts, null);
});

test('edits made while a write is under way are not lost', async () => {
  const cloud = makeCloud({ 40: week([blk('a')]) });
  const dev = makeDevice(cloud);
  await settle();
  dev.edit(40, (w) => ({ ...w, calendar: [...w.calendar, blk('first')] }));
  const flushing = dev.sync.flushNow();
  dev.edit(40, (w) => ({ ...w, calendar: [...w.calendar, blk('second')] })); // while the transaction is pending
  await flushing;
  await settle(12);
  assert.deepEqual(ids(cloud.get(40)), ['a', 'first', 'second']);
  assert.deepEqual(ids(dev.weeks[40]), ['a', 'first', 'second']);
  assert.equal(dev.sync.hasUnsaved(), false);
});

test('cloud changes merged during a write reach a version that was edited meanwhile', async () => {
  const cloud = makeCloud({ 40: week([blk('a')]) });
  const dev = makeDevice(cloud);
  await settle();
  dev.adapter.hookBeforeCommit(() => cloud.docs.set('40', week([blk('a'), blk('emma')])));
  dev.edit(40, (w) => ({ ...w, calendar: [...w.calendar, blk('first')] }));
  const flushing = dev.sync.flushNow();
  dev.edit(40, (w) => ({ ...w, calendar: [...w.calendar, blk('second')] }));
  await flushing;
  await settle(12);
  assert.deepEqual(ids(cloud.get(40)), ['a', 'emma', 'first', 'second']);
  assert.deepEqual(ids(dev.weeks[40]), ['a', 'emma', 'first', 'second']);
});

test('a cloud change is safe even if the host has not rendered it yet when the next write runs', async () => {
  const cloud = makeCloud({ 40: week([blk('a')]) });
  const dev = makeDevice(cloud, { delayedApply: true });
  await settle();
  dev.releaseApplies();
  dev.adapter.setOnline(false);
  dev.edit(40, (w) => ({ ...w, calendar: [...w.calendar, blk('mine')] }));
  await settle();
  dev.adapter.setOnline(true);
  cloud.externalWrite(40, week([blk('a'), blk('emma')])); // merged, but the host has not applied it yet
  await dev.sync.flushNow();
  dev.releaseApplies();
  await settle(12);
  dev.releaseApplies();
  await settle(6);
  assert.deepEqual(ids(cloud.get(40)), ['a', 'emma', 'mine'], 'emma must not be read as deleted here');
  assert.deepEqual(ids(dev.weeks[40]), ['a', 'emma', 'mine']);
});

test('weeks that only exist on this device are uploaded; empty ones are not', async () => {
  const cloud = makeCloud({ 39: week([blk('a')]) });
  const dev = makeDevice(cloud, { reconciled: true, weeks: { 41: week([blk('local')]), 42: week([]) } });
  await settle(12);
  assert.deepEqual(ids(cloud.get(41)), ['local']);
  assert.equal(cloud.get(42), null);
  assert.deepEqual(ids(dev.weeks[39]), ['a']);
});

test('an edit made before the cloud has answered is merged in', async () => {
  const cloud = makeCloud({ 40: week([blk('a'), blk('emma')]) });
  const dev = makeDevice(cloud, { reconciled: true, weeks: { 40: week([blk('a')]) } });
  dev.edit(40, (w) => ({ ...w, calendar: [...w.calendar, blk('quick')] })); // before the first snapshot
  await settle(12);
  assert.deepEqual(ids(cloud.get(40)), ['a', 'emma', 'quick']);
  assert.deepEqual(ids(dev.weeks[40]), ['a', 'emma', 'quick']);
});

test('once reconciled, the cloud wins for weeks without tracked local changes (stale cache)', async () => {
  const cloud = makeCloud({ 40: week([blk('a', { status: 'done' }), blk('new')]) });
  const dev = makeDevice(cloud, { reconciled: true, weeks: { 40: week([blk('a'), blk('longGone')]) } });
  await settle(12);
  assert.ok(weeksEqual(dev.weeks[40], cloud.get(40)));
  assert.equal(cloud.writes, 0, 'a stale cache must never be written to the cloud');
  assert.equal(dev.conflicts, null);
});

test('first run with differences: nothing changes until the user chooses', async () => {
  const cloud = makeCloud({ 33: week([blk('a')]), 34: week([blk('same')]) });
  const dev = makeDevice(cloud, { weeks: { 33: week([blk('a', { invoiced: true }), blk('onlyHere')]), 34: week([blk('same')]) } });
  await settle(12);
  assert.equal(dev.conflicts.length, 1);
  assert.equal(dev.conflicts[0].id, '33');
  assert.deepEqual(dev.conflicts[0].diff, { changed: 1, onlyLocal: 1, onlyServer: 0, otherChanged: false, equal: false });
  assert.equal(cloud.writes, 0);
  assert.deepEqual(ids(dev.weeks[33]), ['a', 'onlyHere']);
});

test('first run, keep this device: its versions win, cloud-only blocks are kept, cloud is backed up', async () => {
  const cloud = makeCloud({ 33: week([blk('a'), blk('cloudOnly')], { dayStatuses: { 4: 'off' } }) });
  const dev = makeDevice(cloud, { weeks: { 33: week([blk('a', { invoiced: true }), blk('hereOnly')], { dayStatuses: { 1: 'half' } }) } });
  await settle(12);
  await dev.sync.resolveLegacy('local');
  await settle(12);
  const c = cloud.get(33);
  assert.deepEqual(ids(c), ['a', 'cloudOnly', 'hereOnly']);
  assert.equal(c.calendar.find((b) => b.id === 'a').invoiced, true);
  assert.deepEqual(c.dayStatuses, { 1: 'half', 4: 'off' });
  assert.ok(weeksEqual(dev.weeks[33], c), 'the device ends up with the same merged week');
  assert.equal(cloud.backups.length, 1);
  assert.deepEqual(ids(cloud.backups[0].weeks[33]), ['a', 'cloudOnly']);
  assert.equal(dev.sync.hasUnsaved(), false);
});

test('first run, use the cloud: device is replaced after a local backup', async () => {
  const cloud = makeCloud({ 33: week([blk('a'), blk('cloudOnly')]) });
  const storage = makeStorage();
  const dev = makeDevice(cloud, { storage, weeks: { 33: week([blk('a', { invoiced: true })]) } });
  await settle(12);
  await dev.sync.resolveLegacy('cloud');
  await settle(12);
  assert.deepEqual(ids(dev.weeks[33]), ['a', 'cloudOnly']);
  assert.equal(cloud.writes, 0);
  const backup = JSON.parse(storage.getItem('sync:local-backup'));
  assert.equal(backup.weeks[33].calendar[0].invoiced, true);
  // the question is asked once per device
  dev.sync.stop();
  const again = makeDevice(cloud, { storage, weeks: dev.weeks });
  await settle(12);
  assert.equal(again.conflicts, null);
});

test('first run with identical data asks nothing and writes nothing', async () => {
  const cloud = makeCloud({ 33: week([blk('a', { invoiced: false })]) });
  const dev = makeDevice(cloud, { weeks: { 33: week([blk('a')]) } });
  await settle(12);
  assert.equal(dev.conflicts, null);
  assert.equal(cloud.writes, 0);
  assert.equal(JSON.parse(dev.storage.getItem('sync')).reconciled, true);
});

test('keeping the device copy fails safely when the backup cannot be written', async () => {
  const cloud = makeCloud({ 33: week([blk('a'), blk('cloudOnly')]) });
  const dev = makeDevice(cloud, { weeks: { 33: week([blk('a')]) } });
  await settle(12);
  dev.adapter.setOnline(false);
  await assert.rejects(dev.sync.resolveLegacy('local'));
  assert.deepEqual(ids(cloud.get(33)), ['a', 'cloudOnly'], 'cloud untouched');
});

test('a flush with nothing to write does not block later writes (app sent to background)', async () => {
  const cloud = makeCloud({ 40: week([blk('a')]) });
  const dev = makeDevice(cloud);
  await settle();
  await dev.sync.flushNow(); // e.g. the tab was hidden: nothing dirty
  await dev.sync.flushNow();
  dev.edit(40, (w) => ({ ...w, calendar: [...w.calendar, blk('later')] }));
  await settle(12);
  assert.deepEqual(ids(cloud.get(40)), ['a', 'later']);
  assert.equal(dev.sync.hasUnsaved(), false);
});

test('a first-run choice still gets written after the tab was in the background', async () => {
  const cloud = makeCloud({ 33: week([blk('a'), blk('cloudOnly')]) });
  const dev = makeDevice(cloud, { weeks: { 33: week([blk('a', { invoiced: true })]) } });
  await settle(12);
  await dev.sync.flushNow(); // hidden tab while the question is open
  await dev.sync.resolveLegacy('local');
  await settle(12);
  assert.deepEqual(ids(cloud.get(33)), ['a', 'cloudOnly']);
  assert.equal(cloud.get(33).calendar.find((b) => b.id === 'a').invoiced, true);
  assert.equal(dev.sync.hasUnsaved(), false);
});
