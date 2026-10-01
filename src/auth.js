import { signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, googleProvider, usingEmulators } from "./firebase";

// Emulator only: sign in as the test user from .env.emulator (created on first use)
async function loginEmulatorTestUser() {
  const email = import.meta.env.VITE_EMULATOR_EMAIL;
  const password = import.meta.env.VITE_EMULATOR_PASSWORD;
  try {
    return (await signInWithEmailAndPassword(auth, email, password)).user;
  } catch (err) {
    return (await createUserWithEmailAndPassword(auth, email, password)).user;
  }
}

export async function loginWithGoogle() {
  if (usingEmulators) return loginEmulatorTestUser();
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
}

export async function logout() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout failed:", error);
    throw error;
  }
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser() {
  return auth.currentUser;
}
