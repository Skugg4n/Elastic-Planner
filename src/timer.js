// Running time ("start / switch / stop").
//
// One timer at a time lives in Firestore at planner/{uid}/state/timer, so the app,
// Raycast and anything else see the same thing. Stopping it writes an ordinary "done"
// block into the week's calendar on the 30-minute grid.
//
// The rules here MUST match nexus firebase/functions/planner-timer.js (the backend that
// Raycast talks to). Change one, change the other, and run both test files.

const TIME_ZONE = 'Europe/Stockholm';
const DAY_MS = 86400000;
const EPOCH_DAYS = Math.floor(Date.UTC(2025, 11, 29) / DAY_MS); // Monday of 2026-W01, as in weeks.js

export const MIN_MINUTES = 5;        // shorter than this is a mis-click: nothing is written
export const FORGOTTEN_HOURS = 12;   // longer than this was almost certainly left running
export const UNASSIGNED_PROJECT = 'Okonterat';

const clockFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

/** Stockholm wall clock for an instant: whole days since 1970 and decimal hour of the day. */
export const stockholmClock = (date) => {
  const parts = clockFormat.formatToParts(date);
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  return {
    days: Math.floor(Date.UTC(get('year'), get('month') - 1, get('day')) / DAY_MS),
    hour: get('hour') + get('minute') / 60,
  };
};

/** Week index and day (0 = Monday) for a Stockholm day count. */
const weekAndDay = (days) => {
  const sinceEpoch = days - EPOCH_DAYS;
  return { weekIndex: Math.floor(sinceEpoch / 7) + 1, day: ((sinceEpoch % 7) + 7) % 7 };
};

/**
 * Turn a tracked interval into calendar segments on the 30-minute grid.
 * [] for intervals under MIN_MINUTES. Past midnight: one segment per day
 * (and the next week after a Sunday).
 */
export const segmentsForInterval = (start, end) => {
  if (!(end > start) || (end - start) / 60000 < MIN_MINUTES) return [];
  const s = stockholmClock(start);
  const e = stockholmClock(end);
  const snap = (v) => Math.round(v * 2) / 2;
  let from = snap(s.days * 24 + s.hour);
  let to = snap(e.days * 24 + e.hour);
  if (to - from < 0.5) to = from + 0.5;
  const out = [];
  while (from < to) {
    const dayNumber = Math.floor(from / 24);
    const until = Math.min(to, (dayNumber + 1) * 24);
    out.push({ ...weekAndDay(dayNumber), start: from - dayNumber * 24, duration: until - from });
    from = until;
  }
  return out;
};

const sameText = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
const newBlockId = () => `block-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Add the tracked segments to the given calendars (Map weekIndex -> calendar array, mutated).
 * Picking the same thing up again right after stopping continues the same block.
 */
export const applySegments = (calendars, segments, timer, endedAt) => {
  const written = [];
  segments.forEach((seg) => {
    const calendar = calendars.get(seg.weekIndex);
    const previous = calendar.find((b) =>
      b.trackedBy === 'timer' && b.day === seg.day && b.type === timer.type &&
      sameText(b.projectName, timer.projectName) && sameText(b.taskName, timer.taskName) &&
      Math.abs(b.start + b.duration - seg.start) < 0.01);
    if (previous) {
      previous.duration += seg.duration;
      previous.trackedTo = endedAt.toISOString();
      written.push({ ...seg, blockId: previous.id, extended: true });
      return;
    }
    const block = {
      id: newBlockId(),
      day: seg.day,
      start: seg.start,
      duration: seg.duration,
      type: timer.type,
      label: timer.label || timer.type,
      status: 'done',
      projectName: timer.projectName || '',
      taskName: timer.taskName || '',
      description: '',
      parallelId: null,
      invoiced: false,
      trackedBy: 'timer',
      trackedFrom: timer.startedAt,
      trackedTo: endedAt.toISOString(),
    };
    if (timer.unassigned) block.unassigned = true;
    calendar.push(block);
    written.push({ ...seg, blockId: block.id, extended: false });
  });
  return written;
};

/** The timer document for a new timer. Nothing chosen = the catch-all project. */
export const newTimerDoc = (what, now, source = 'app') => {
  const unassigned = !!what.unassigned || !String(what.projectName || '').trim();
  return {
    running: true,
    startedAt: now.toISOString(),
    type: what.type || 'job',
    label: what.label || '',
    projectName: unassigned ? UNASSIGNED_PROJECT : String(what.projectName).trim(),
    taskName: unassigned ? '' : String(what.taskName || '').trim(),
    unassigned,
    source,
  };
};

export const isForgotten = (timer, now = new Date()) =>
  !!timer && !!timer.running && (now - new Date(timer.startedAt)) / 3600000 > FORGOTTEN_HOURS;

export const elapsedMinutes = (startedAt, now = new Date()) =>
  Math.max(0, Math.floor((now.getTime() - new Date(startedAt).getTime()) / 60000));

/** 72 -> "1:12" */
export const formatClock = (minutes) => `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;

/** 1.5 -> "1,5 h" */
export const formatHours = (hours) => `${String(Math.round(hours * 10) / 10).replace('.', ',')} h`;

export const comboTitle = (c) => (c.taskName ? `${c.projectName} / ${c.taskName}` : c.projectName);

/** "Dalenum / Socme" typed by hand -> project and task. */
export const parseNewEntry = (text) => {
  const [project, ...rest] = String(text || '').split('/');
  return { projectName: project.trim(), taskName: rest.join('/').trim() };
};

/**
 * What has been worked on lately, newest first, read from the weeks already in the app.
 * Catch-all time (Okonterat) is left out: it is offered separately.
 */
export const recentCombos = (weeksData, currentWeek, { weeks = 8, limit = 12 } = {}) => {
  const combos = new Map();
  for (let idx = currentWeek + 1; idx > currentWeek - weeks && idx >= 1; idx--) {
    const calendar = weeksData[idx]?.calendar || [];
    calendar.forEach((b) => {
      if (b.status === 'inactive' || b.unassigned) return;
      const projectName = String(b.projectName || '').trim();
      if (!projectName || sameText(projectName, UNASSIGNED_PROJECT)) return;
      const taskName = String(b.taskName || '').trim();
      const key = `${b.type}|${projectName.toLowerCase()}|${taskName.toLowerCase()}`;
      const when = idx * 7 + (b.day || 0) + (b.start || 0) / 24;
      const entry = combos.get(key) || { key, type: b.type, projectName, taskName, lastUsed: -Infinity, hours: 0 };
      entry.hours += b.duration || 0;
      if (when > entry.lastUsed) { entry.lastUsed = when; entry.projectName = projectName; entry.taskName = taskName; }
      combos.set(key, entry);
    });
  }
  return [...combos.values()].sort((a, b) => b.lastUsed - a.lastUsed).slice(0, limit);
};
