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

export async function loadWeek(weekId) {
  const id = String(weekId);

  // Try Firestore first
  if (currentUid) {
    try {
      const snap = await getDoc(userDoc("weeks", id));
      if (snap.exists()) {
        return snap.data().calendar || [];
      }
    } catch (err) {
      console.warn("Firestore read failed, falling back to localStorage:", err);
    }
  }

  // Fallback: localStorage
  return loadWeekFromLocalStorage(id);
}

export async function saveWeek(weekId, calendar) {
  const id = String(weekId);

  // Always save to localStorage (cache)
  saveWeekToLocalStorage(id, calendar);

  // Save to Firestore if logged in
  if (currentUid) {
    try {
      await setDoc(userDoc("weeks", id), {
        calendar,
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

export async function saveTemplates(templates) {
  try {
    localStorage.setItem("elastic-planner-templates", JSON.stringify(templates));
  } catch (e) { /* ignore */ }

  if (currentUid) {
    try {
      await setDoc(userDoc("templates", "all"), {
        ...templates,
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
    if (!raw) return [];
    const data = JSON.parse(raw);
    const weeksData = data.weeksData || data;
    const week = weeksData[weekId];
    if (!week) return [];
    return week.calendar || week || [];
  } catch (e) {
    return [];
  }
}

function saveWeekToLocalStorage(weekId, calendar) {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const data = raw ? JSON.parse(raw) : {};
    const weeksData = data.weeksData || data;
    weeksData[weekId] = { calendar };
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
