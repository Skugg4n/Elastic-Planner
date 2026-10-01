// Comparing and merging week objects ({ calendar, points, dayStatuses }).
//
// Two devices (or the app and Emma) can change the same week. Instead of the
// last writer replacing the whole week, changes are merged per block with a
// three-way merge: `base` is the version both sides last agreed on, `local`
// is this device's version and `server` is what the cloud has now.

export const emptyWeek = () => ({ calendar: [], points: {}, dayStatuses: {} });

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// Values that mean "nothing": missing, null, '' and false are treated alike, so
// { invoiced: false } equals a block without the field.
const isBlank = (v) => v === undefined || v === null || v === '' || v === false;

const canonValue = (v) => {
  if (Array.isArray(v)) return v.map(canonValue);
  if (isPlainObject(v)) {
    const out = {};
    Object.keys(v).sort().forEach((k) => {
      if (k.startsWith('_')) return; // transient UI flags
      const c = canonValue(v[k]);
      if (!isBlank(c)) out[k] = c;
    });
    return out;
  }
  return v;
};

/** Signature of a single block/point: equal signatures mean equal content. */
export const itemSignature = (item) => JSON.stringify(canonValue(item));

const canonPoints = (points) => {
  const out = {};
  Object.keys(points || {}).sort().forEach((day) => {
    const items = Array.isArray(points[day]) ? points[day] : [];
    if (items.length > 0) out[day] = items.map(canonValue);
  });
  return out;
};

const byId = (a, b) => String(a.id ?? '').localeCompare(String(b.id ?? ''));

/** Canonical form of a week: only persisted fields, stable ordering. */
export const canonicalWeek = (week) => {
  const w = week || {};
  return {
    calendar: (Array.isArray(w.calendar) ? w.calendar : []).map(canonValue).sort(byId),
    points: canonPoints(w.points),
    dayStatuses: canonValue(isPlainObject(w.dayStatuses) ? w.dayStatuses : {}),
  };
};

export const weekSignature = (week) => JSON.stringify(canonicalWeek(week));

export const weeksEqual = (a, b) => weekSignature(a) === weekSignature(b);

export const isEmptyWeek = (week) => weekSignature(week) === weekSignature(emptyWeek());

/** Plain persistable copy of a week (no undefined, no functions, only the three fields). */
export const persistableWeek = (week) => {
  const w = week || {};
  return JSON.parse(JSON.stringify({
    calendar: Array.isArray(w.calendar) ? w.calendar : [],
    points: isPlainObject(w.points) ? w.points : {},
    dayStatuses: isPlainObject(w.dayStatuses) ? w.dayStatuses : {},
  }));
};

// Key items by id. A repeated id (an old bug could create those) gets a
// suffix per occurrence so no item is silently dropped by the merge.
const keyed = (items) => {
  const map = new Map();
  const seen = new Map();
  (items || []).forEach((item, i) => {
    const raw = item && item.id != null ? String(item.id) : `__noid_${itemSignature(item)}_${i}`;
    const n = (seen.get(raw) || 0) + 1;
    seen.set(raw, n);
    map.set(n === 1 ? raw : `${raw}#${n}`, item);
  });
  return map;
};

/** Three-way merge of a list of items with ids. Returns a new array. */
export const mergeItems = (baseItems, localItems, serverItems) => {
  const base = keyed(baseItems);
  const local = keyed(localItems);
  const server = keyed(serverItems);
  const result = [];

  // Local order first...
  local.forEach((l, key) => {
    const b = base.get(key);
    const s = server.get(key);
    if (s !== undefined) {
      const localChanged = b === undefined || itemSignature(l) !== itemSignature(b);
      result.push(localChanged ? l : s);
    } else if (b === undefined) {
      result.push(l); // added here, not yet in the cloud
    } else if (itemSignature(l) !== itemSignature(b)) {
      result.push(l); // removed in the cloud but edited here since: keep the edit
    }
    // else: removed in the cloud and untouched here: drop
  });

  // ...then items that only the cloud has
  server.forEach((s, key) => {
    if (local.has(key)) return;
    if (!base.has(key)) result.push(s); // added elsewhere
    // else: was known here and has been removed here: stays removed
  });

  return result;
};

const mergePoints = (base, local, server) => {
  const out = {};
  const days = new Set([...Object.keys(local || {}), ...Object.keys(server || {})]);
  [...days].sort().forEach((day) => {
    const arr = (o) => (o && Array.isArray(o[day]) ? o[day] : []);
    const merged = mergeItems(arr(base), arr(local), arr(server));
    if (merged.length > 0) out[day] = merged;
  });
  return out;
};

const mergeDayStatuses = (base, local, server) => {
  const b = base || {};
  const l = local || {};
  const s = server || {};
  const out = {};
  new Set([...Object.keys(l), ...Object.keys(s), ...Object.keys(b)]).forEach((k) => {
    const value = l[k] !== b[k] ? l[k] : s[k];
    if (!isBlank(value)) out[k] = value;
  });
  return out;
};

/**
 * Three-way merge of a week.
 * - `base`: last version this device and the cloud agreed on (null = week was new/empty)
 * - `local`: this device's current version
 * - `server`: the cloud's current version (null = no document yet)
 * Local edits win over cloud edits to the same block; everything else from both sides is kept.
 */
export const mergeWeek = (base, local, server) => {
  const b = base || emptyWeek();
  const l = local || emptyWeek();
  if (!server) return persistableWeek(l);
  return persistableWeek({
    calendar: mergeItems(b.calendar, l.calendar, server.calendar),
    points: mergePoints(b.points, l.points, server.points),
    dayStatuses: mergeDayStatuses(b.dayStatuses, l.dayStatuses, server.dayStatuses),
  });
};

/** Human-oriented difference summary between this device's week and the cloud's. */
export const diffWeeks = (local, server) => {
  const l = keyed((local || {}).calendar);
  const s = keyed((server || {}).calendar);
  let changed = 0;
  let onlyLocal = 0;
  let onlyServer = 0;
  l.forEach((item, key) => {
    if (!s.has(key)) onlyLocal++;
    else if (itemSignature(item) !== itemSignature(s.get(key))) changed++;
  });
  s.forEach((_, key) => { if (!l.has(key)) onlyServer++; });
  const cl = canonicalWeek(local);
  const cs = canonicalWeek(server);
  const otherChanged = JSON.stringify([cl.points, cl.dayStatuses]) !== JSON.stringify([cs.points, cs.dayStatuses]);
  return { changed, onlyLocal, onlyServer, otherChanged, equal: changed + onlyLocal + onlyServer === 0 && !otherChanged };
};

/**
 * Give repeated block ids unique ids (first occurrence keeps its id).
 * Returns the same array when nothing needed fixing.
 */
export const fixDuplicateIds = (calendar) => {
  if (!Array.isArray(calendar)) return calendar;
  const seen = new Set();
  let changed = false;
  const out = calendar.map((block) => {
    const id = block && block.id != null ? String(block.id) : null;
    if (id === null || !seen.has(id)) {
      if (id !== null) seen.add(id);
      return block;
    }
    let n = 2;
    while (seen.has(`${id}-${n}`)) n++;
    const fresh = `${id}-${n}`;
    seen.add(fresh);
    changed = true;
    return { ...block, id: fresh };
  });
  return changed ? out : calendar;
};
