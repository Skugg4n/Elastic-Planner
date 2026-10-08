// In-page helpers for testing the timer against the emulators.
// In the browser console: const t = await import('/dev/timer-helpers.js'); await t.forgottenTimer(20)
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../src/firebase.js";
import { getCurrentUser } from "../src/auth.js";

const timerRef = () => doc(db, "planner", getCurrentUser().uid, "state", "timer");

/** A timer that started `hoursAgo` hours ago and was never stopped. */
export async function forgottenTimer(hoursAgo = 20, what = { type: "creative", label: "Bok", projectName: "Fotbollsboken", taskName: "Inlaga" }) {
  const startedAt = new Date(Date.now() - hoursAgo * 3600000).toISOString();
  await setDoc(timerRef(), { running: true, startedAt, unassigned: false, source: "test", ...what });
  return startedAt;
}

export async function timer() {
  return (await getDoc(timerRef())).data();
}

/** The calendar blocks a timer wrote into a week. */
export async function timerBlocks(weekIndex) {
  const snap = await getDoc(doc(db, "planner", getCurrentUser().uid, "weeks", String(weekIndex)));
  return (snap.data()?.calendar || []).filter((b) => b.trackedBy === "timer").map((b) => `${b.day} ${b.start} +${b.duration} ${b.projectName} ${b.trackedFrom} -> ${b.trackedTo}`);
}
