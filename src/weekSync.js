// Keeps this device's weeks and the cloud's weeks in agreement.
//
// - Listens to the cloud in real time, so changes from another device or from
//   Emma show up without a reload.
// - Writes only weeks that were actually changed here, in a transaction that
//   merges per block (see weekMerge.js) instead of replacing the whole week.
// - Tracks which weeks have unsaved local changes ("dirty"), together with the
//   version they started from, and keeps that across restarts so offline work
//   is merged in later rather than lost or blindly overwriting the cloud.
//
// The module knows nothing about React or Firestore; both are passed in.

import {
  mergeWeek, weekSignature, persistableWeek, isEmptyWeek, diffWeeks, emptyWeek,
} from './weekMerge.js';

const EMPTY_SIG = weekSignature(emptyWeek());
const RETRY_DELAYS = [3000, 10000, 30000, 60000];

export function createWeekSync({
  adapter,
  getWeeks,
  applyWeeks,
  storage = null,
  storageKey = 'elastic-planner-sync',
  onStatus = () => {},
  onReady = () => {},
  onLegacyConflicts = () => {},
  debounceMs = 700,
  setTimer = (fn, ms) => setTimeout(fn, ms),
  clearTimer = (t) => clearTimeout(t),
}) {
  const base = new Map();      // id -> last version agreed with the cloud
  const baseSig = new Map();   // id -> signature of that version
  const dirty = new Set();     // ids with local changes not yet in the cloud
  const overlay = new Map();   // id -> week handed to the host but not yet seen back from it
  const provisional = new Set(); // ids edited before the cloud answered (base is a guess)
  let pendingLegacy = null;    // Map(id -> cloud week) awaiting the user's choice
  let reconciled = false;      // this device has been through the first-run comparison
  let ready = false;
  let stopped = false;
  let unsubscribe = null;
  let flushTimer = null;
  let flushing = null;         // promise of the running flush
  let flushAgain = false;
  let retryCount = 0;
  let lastSeen = {};

  const sigOf = (week) => (week === undefined || week === null ? EMPTY_SIG : weekSignature(week));
  const baseSigOf = (id) => (baseSig.has(id) ? baseSig.get(id) : EMPTY_SIG);
  const localOf = (id) => (overlay.has(id) ? overlay.get(id) : getWeeks()[id]);

  const setBase = (id, week) => {
    if (week === null || week === undefined) {
      base.delete(id);
      baseSig.delete(id);
    } else {
      const copy = persistableWeek(week);
      base.set(id, copy);
      baseSig.set(id, weekSignature(copy));
    }
  };

  const persist = () => {
    if (!storage) return;
    try {
      const dirtyOut = {};
      dirty.forEach((id) => { dirtyOut[id] = base.has(id) ? base.get(id) : null; });
      storage.setItem(storageKey, JSON.stringify({ v: 1, reconciled, dirty: dirtyOut }));
    } catch (e) {
      // Storage full or unavailable: the changes are still in memory and will be flushed
    }
  };

  const restore = () => {
    if (!storage) return;
    try {
      const raw = storage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw);
      reconciled = !!saved.reconciled;
      Object.entries(saved.dirty || {}).forEach(([id, b]) => {
        dirty.add(id);
        setBase(id, b);
      });
    } catch (e) { /* ignore a corrupt entry */ }
  };

  const apply = (patch) => {
    const ids = Object.keys(patch);
    if (ids.length === 0) return;
    ids.forEach((id) => overlay.set(id, patch[id]));
    applyWeeks(patch);
  };

  const scheduleFlush = (ms = debounceMs) => {
    if (stopped) return;
    if (flushTimer) clearTimer(flushTimer);
    flushTimer = setTimer(() => { flushTimer = null; flush(); }, ms);
  };

  // --- Local changes ---

  const notifyLocalChange = (weeks) => {
    if (stopped) return;
    let changed = false;
    Object.keys(weeks).forEach((id) => {
      const cur = weeks[id];
      const prev = lastSeen[id];
      if (cur === prev) return;
      overlay.delete(id); // the host now holds this week; its state is the truth again
      if (pendingLegacy && pendingLegacy.has(id)) return;
      const curSig = sigOf(cur);
      if (!ready && !dirty.has(id) && !base.has(id)) {
        // Edited before the cloud answered: the version before the edit is our best base
        if (curSig === sigOf(prev)) return;
        setBase(id, prev === undefined ? null : prev);
        provisional.add(id);
      }
      if (curSig !== baseSigOf(id)) {
        if (!dirty.has(id)) { dirty.add(id); changed = true; }
        scheduleFlush();
      } else if (dirty.has(id)) {
        dirty.delete(id);
        changed = true;
      }
    });
    lastSeen = weeks;
    if (changed) persist();
  };

  // --- Cloud changes ---

  const mergeIn = (id, server, patch) => {
    const local = localOf(id);
    if (dirty.has(id)) {
      const merged = mergeWeek(base.has(id) ? base.get(id) : null, local, server);
      setBase(id, server);
      const mergedSig = weekSignature(merged);
      if (mergedSig !== sigOf(local)) patch[id] = merged;
      if (mergedSig === baseSigOf(id)) dirty.delete(id);
    } else {
      setBase(id, server);
      if (local === undefined || sigOf(local) !== baseSigOf(id)) patch[id] = base.get(id);
    }
  };

  const handleInitial = (changes) => {
    const patch = {};
    const legacy = new Map();
    const serverIds = new Set();
    changes.forEach(({ id, data }) => {
      if (!data) return;
      serverIds.add(id);
      const server = persistableWeek(data);
      const local = localOf(id);
      const trackedDirty = dirty.has(id) && !(provisional.has(id) && !reconciled);
      if (trackedDirty || reconciled || local === undefined || sigOf(local) === weekSignature(server)) {
        mergeIn(id, server, patch);
      } else {
        // An edit made in the first moments of a first run cannot be told apart from the
        // old cached differences either, so it goes to the same question.
        dirty.delete(id);
        setBase(id, null);
        // First run of this sync on this device: the cached copy differs from the cloud
        // and nothing says which one is newer. Leave both alone and ask.
        legacy.set(id, server);
      }
    });
    // Weeks that exist only here and hold something: they belong in the cloud
    Object.keys(getWeeks()).forEach((id) => {
      if (serverIds.has(id) || dirty.has(id)) return;
      if (!isEmptyWeek(localOf(id))) dirty.add(id);
    });
    ready = true;
    provisional.clear();
    if (legacy.size > 0) pendingLegacy = legacy;
    else reconciled = true;
    apply(patch);
    persist();
    onReady();
    if (pendingLegacy) {
      onLegacyConflicts([...pendingLegacy.entries()].map(([id, server]) => ({ id, diff: diffWeeks(localOf(id), server) })));
    }
    if (dirty.size > 0) scheduleFlush(0);
    else onStatus('synced');
  };

  const handleChanges = ({ changes, initial }) => {
    if (stopped) return;
    if (initial && !ready) { handleInitial(changes); return; }
    const patch = {};
    changes.forEach(({ id, data, pending }) => {
      if (pending || !data) return; // our own unconfirmed write, or a removed document
      const server = persistableWeek(data);
      if (pendingLegacy && pendingLegacy.has(id)) { pendingLegacy.set(id, server); return; }
      mergeIn(id, server, patch);
    });
    apply(patch);
    persist();
    if (dirty.size > 0) scheduleFlush();
  };

  // --- Writing ---

  const flushOne = async (id) => {
    const local0 = localOf(id);
    const sig0 = sigOf(local0);
    const b = base.has(id) ? base.get(id) : null;
    let merged = null;
    await adapter.transact(id, (server) => {
      merged = mergeWeek(b, local0, server ? persistableWeek(server) : null);
      // Nothing to write when the cloud already holds the merged result
      return server && weekSignature(merged) === weekSignature(persistableWeek(server)) ? undefined : merged;
    });
    setBase(id, merged);
    const mergedSig = baseSigOf(id);
    const cur = localOf(id);
    if (sigOf(cur) === sig0) {
      dirty.delete(id);
      if (mergedSig !== sig0) apply({ [id]: base.get(id) });
    } else if (mergedSig !== sig0) {
      // Edited here while the write was under way, and the write merged in cloud changes:
      // bring those into the current version without losing the newer edits.
      apply({ [id]: mergeWeek(local0, cur, merged) });
    }
  };

  const runFlush = async () => {
    let failed = false;
    const ids = [...dirty].filter((id) => !(pendingLegacy && pendingLegacy.has(id)));
    if (ids.length > 0) onStatus('syncing');
    for (const id of ids) {
      if (stopped) break;
      try {
        await flushOne(id);
      } catch (err) {
        failed = true;
        break; // most likely offline: no point hammering the rest
      }
    }
    persist();
    return { failed, wrote: ids.length > 0 };
  };

  const afterFlush = ({ failed, wrote }) => {
    if (stopped) return;
    if (failed) {
      onStatus('offline');
      scheduleFlush(RETRY_DELAYS[Math.min(retryCount, RETRY_DELAYS.length - 1)]);
      retryCount++;
      return;
    }
    retryCount = 0;
    const remaining = [...dirty].some((id) => !(pendingLegacy && pendingLegacy.has(id)));
    if (flushAgain || remaining) {
      flushAgain = false;
      scheduleFlush(remaining ? debounceMs : 0);
    } else if (wrote) {
      onStatus('synced');
    }
  };

  const flush = () => {
    if (stopped || !ready) return Promise.resolve();
    if (flushing) { flushAgain = true; return flushing; }
    // `.then` always runs after this function has returned, so the marker is cleared
    // even when there was nothing to write and runFlush finished at once.
    const run = runFlush().then((result) => {
      flushing = null;
      afterFlush(result);
    });
    flushing = run;
    return run;
  };

  // --- First-run choice ---

  const resolveLegacy = async (choice) => {
    if (!pendingLegacy) return;
    const conflicts = pendingLegacy;
    const stamp = new Date().toISOString();
    if (choice === 'local') {
      // This device's version wins where the two differ, and blocks that only the cloud
      // has are kept too (a union: nothing is thrown away). The cloud's weeks are saved
      // aside first all the same.
      const weeks = {};
      conflicts.forEach((server, id) => { weeks[id] = server; });
      await adapter.backup({ reason: 'pre-sync-v2: cloud weeks replaced by a device copy', createdAt: stamp, weeks });
      pendingLegacy = null;
      conflicts.forEach((server, id) => { setBase(id, null); dirty.add(id); });
      reconciled = true;
      persist();
      scheduleFlush(0);
    } else {
      // Use the cloud's version. This device's differing weeks are saved aside first.
      const patch = {};
      const localBackup = {};
      conflicts.forEach((server, id) => { localBackup[id] = localOf(id); });
      if (storage) {
        try {
          storage.setItem(`${storageKey}:local-backup`, JSON.stringify({ createdAt: stamp, weeks: localBackup }));
        } catch (e) { /* storage full: the cloud copy is still the chosen truth */ }
      }
      pendingLegacy = null;
      conflicts.forEach((server, id) => { setBase(id, server); patch[id] = base.get(id); });
      reconciled = true;
      apply(patch);
      persist();
      if (dirty.size > 0) scheduleFlush(0);
      else onStatus('synced');
    }
  };

  return {
    start() {
      restore();
      lastSeen = getWeeks();
      unsubscribe = adapter.subscribe(handleChanges, () => onStatus('offline'));
    },
    stop() {
      stopped = true;
      if (flushTimer) clearTimer(flushTimer);
      if (unsubscribe) unsubscribe();
    },
    notifyLocalChange,
    /** Write pending changes now (used when the page is being hidden or closed). */
    flushNow() {
      if (flushTimer) { clearTimer(flushTimer); flushTimer = null; }
      return flush();
    },
    /** Try again right away, e.g. when the browser reports being online again. */
    retry() {
      retryCount = 0;
      if (dirty.size > 0) scheduleFlush(0);
    },
    resolveLegacy,
    isReady: () => ready,
    hasUnsaved: () => dirty.size > 0,
    dirtyIds: () => [...dirty],
  };
}
