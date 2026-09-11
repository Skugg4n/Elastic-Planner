import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

const LS_KEY = "elastic-planner-weeks";
let currentUid = null;

/**
 * Set the current user ID for all Firestore operations.
 */
export function setUser(uid) {
  currentUid = uid;
}

/**
 * Get Firestore doc reference for a user's subcollection.
 */
function userDoc(collection, docId) {
  if (!currentUid) return null;
  return doc(db, "planner", currentUid, collection, docId);
}

// ── Week data ──

/**
 * Pick the persisted parts of a week object. Only fields present in the
 * source are returned, so an old Firestore doc without dayStatuses does not
 * overwrite a local value with an empty object.
 */
function pickWeekFields(data) {
  if (!data || typeof data !== "object") return null;
  const out = {};
  if (Array.isArray(data.calendar)) out.calendar = data.calendar;
  if (data.points && typeof data.points === "object") out.points = data.points;
  if (data.dayStatuses && typeof data.dayStatuses === "object") out.dayStatuses = data.dayStatuses;
  return Object.keys(out).length > 0 ? out : null;
}

/**
 * Load a week. Returns { calendar, points?, dayStatuses? } or null when
 * nothing is stored for that week.
 */
export async function loadWeek(weekId) {
  const id = String(weekId);

  // Try Firestore first
  if (currentUid) {
    try {
      const snap = await getDoc(userDoc("weeks", id));
      if (snap.exists()) {
        return pickWeekFields(snap.data());
      }
    } catch (err) {
      console.warn("Firestore read failed, falling back to localStorage:", err);
    }
  }

  // Fallback: localStorage
  return loadWeekFromLocalStorage(id);
}

/**
 * Save a whole week object ({ calendar, points, dayStatuses }).
 * Accepts a bare calendar array for backwards compatibility.
 */
export async function saveWeek(weekId, weekData) {
  const id = String(weekId);
  const data = Array.isArray(weekData) ? { calendar: weekData } : weekData;
  const payload = {
    calendar: data.calendar || [],
    points: data.points || {},
    dayStatuses: data.dayStatuses || {},
  };

  // Always save to localStorage (cache)
  saveWeekToLocalStorage(id, payload);

  // Save to Firestore if logged in
  if (currentUid) {
    try {
      await setDoc(userDoc("weeks", id), {
        ...payload,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Firestore write failed:", err);
    }
  }
}

// ── Settings (categories, preferences) ──

export async function loadSettings() {
  if (currentUid) {
    try {
      const snap = await getDoc(userDoc("settings", "config"));
      if (snap.exists()) {
        return snap.data();
      }
    } catch (err) {
      console.warn("Failed to load settings from Firestore:", err);
    }
  }
  return null;
}

export async function saveSettings(settings) {
  // Save to localStorage
  try {
    localStorage.setItem("elastic-planner-settings", JSON.stringify(settings));
  } catch (e) { /* ignore */ }

  if (currentUid) {
    try {
      await setDoc(userDoc("settings", "config"), {
        ...settings,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to save settings to Firestore:", err);
    }
  }
}

// ── Bank items (Lådan) ──

export async function loadBank() {
  if (currentUid) {
    try {
      const snap = await getDoc(userDoc("bank", "items"));
      if (snap.exists()) {
        return snap.data().items || [];
      }
    } catch (err) {
      console.warn("Failed to load bank from Firestore:", err);
    }
  }
  return null;
}

export async function saveBank(items) {
  try {
    localStorage.setItem("elastic-planner-bank", JSON.stringify(items));
  } catch (e) { /* ignore */ }

  if (currentUid) {
    try {
      await setDoc(userDoc("bank", "items"), {
        items,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to save bank to Firestore:", err);
    }
  }
}

// ── Templates ──

export async function loadTemplates() {
  if (currentUid) {
    try {
      const snap = await getDoc(userDoc("templates", "all"));
      if (snap.exists()) {
        return snap.data();
      }
    } catch (err) {
      console.warn("Failed to load templates from Firestore:", err);
    }
  }
  return null;
}

export async function saveTemplates(data) {
  // data = { templates: {...}, defaultTemplate: {...} | null }
  // Save individual parts to localStorage (App.jsx reads them separately)
  try {
    if (data.templates) {
      localStorage.setItem("elastic-planner-templates", JSON.stringify(data.templates));
    }
    if (data.defaultTemplate !== undefined) {
      if (data.defaultTemplate) {
        localStorage.setItem("elastic-planner-default-template", JSON.stringify(data.defaultTemplate));
      } else {
        localStorage.removeItem("elastic-planner-default-template");
      }
    }
  } catch (e) { /* ignore */ }

  if (currentUid) {
    try {
      await setDoc(userDoc("templates", "all"), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to save templates to Firestore:", err);
    }
  }
}

// ── Migration: localStorage → Firestore ──

export async function migrateFromLocalStorage() {
  if (!currentUid) return { migrated: false };

  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return { migrated: false, reason: "no data" };

  try {
    // Weeks data comes from the main LS_KEY
    const parsed = JSON.parse(raw);
    const weeksData = parsed.weeksData || parsed;
    let weekCount = 0;

    for (const [weekId, weekData] of Object.entries(weeksData)) {
      const calendar = weekData.calendar || weekData;
      if (Array.isArray(calendar) && calendar.length > 0) {
        await setDoc(userDoc("weeks", String(weekId)), {
          calendar,
          points: weekData.points || {},
          dayStatuses: weekData.dayStatuses || {},
          updatedAt: serverTimestamp(),
        });
        weekCount++;
      }
    }

    // Read other data from their separate localStorage keys
    const categoriesRaw = localStorage.getItem("elastic-planner-categories");
    const projectHistoryRaw = localStorage.getItem("elastic-planner-project-history");
    const bankRaw = localStorage.getItem("elastic-planner-bank");
    const templatesRaw = localStorage.getItem("elastic-planner-templates");
    const defaultTemplateRaw = localStorage.getItem("elastic-planner-default-template");

    const categories = categoriesRaw ? JSON.parse(categoriesRaw) : null;
    const projectHistory = projectHistoryRaw ? JSON.parse(projectHistoryRaw) : null;
    const bankItems = bankRaw ? JSON.parse(bankRaw) : null;
    const templates = templatesRaw ? JSON.parse(templatesRaw) : null;
    const defaultTemplate = defaultTemplateRaw ? JSON.parse(defaultTemplateRaw) : null;

    // Migrate categories + project history into settings/config
    const settingsPayload = { updatedAt: serverTimestamp() };
    if (categories) settingsPayload.categories = categories;
    if (projectHistory) settingsPayload.projectHistory = projectHistory;
    if (Object.keys(settingsPayload).length > 1) {
      await setDoc(userDoc("settings", "config"), settingsPayload);
    }

    // Migrate bank items
    if (bankItems && bankItems.length > 0) {
      await setDoc(userDoc("bank", "items"), {
        items: bankItems,
        updatedAt: serverTimestamp(),
      });
    }

    // Migrate templates
    if (templates || defaultTemplate) {
      await setDoc(userDoc("templates", "all"), {
        defaultTemplate: defaultTemplate || null,
        templates: templates || {},
        updatedAt: serverTimestamp(),
      });
    }

    return { migrated: true, weekCount };
  } catch (err) {
    console.error("Migration failed:", err);
    return { migrated: false, error: err.message };
  }
}

/**
 * Check if Firestore already has data for this user.
 */
export async function hasFirestoreData() {
  if (!currentUid) return false;
  try {
    const snap = await getDoc(userDoc("settings", "config"));
    return snap.exists();
  } catch (err) {
    return false;
  }
}

// ── localStorage helpers ──

function loadWeekFromLocalStorage(weekId) {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const weeksData = data.weeksData || data;
    const week = weeksData[weekId];
    if (!week) return null;
    if (Array.isArray(week)) return { calendar: week };
    return pickWeekFields(week);
  } catch (e) {
    return null;
  }
}

function saveWeekToLocalStorage(weekId, weekData) {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const data = raw ? JSON.parse(raw) : {};
    const weeksData = data.weeksData || data;
    const existing = weeksData[weekId] && !Array.isArray(weeksData[weekId]) ? weeksData[weekId] : {};
    // Merge so fields we don't know about survive
    weeksData[weekId] = { ...existing, ...weekData };
    if (data.weeksData) {
      data.weeksData = weeksData;
      localStorage.setItem(LS_KEY, JSON.stringify(data));
    } else {
      localStorage.setItem(LS_KEY, JSON.stringify(weeksData));
    }
  } catch (e) {
    console.error("localStorage write failed:", e);
  }
}
