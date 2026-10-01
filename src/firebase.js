import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, disableNetwork, enableNetwork } from "firebase/firestore";

// Local end-to-end testing: `npm run dev:emulator` talks to the Firebase emulators
// (see dev/README.md) instead of the real project. Never active in a production build.
export const usingEmulators = import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === "1";

const firebaseConfig = {
  apiKey: "AIzaSyD3rbuPMCvOlL8GfEAeQlyYLQxURZ_hW4Y",
  authDomain: "nexus-2519d.firebaseapp.com",
  projectId: "nexus-2519d",
  storageBucket: "nexus-2519d.firebasestorage.app",
  messagingSenderId: "22134638036",
  appId: "1:22134638036:web:dd22a64ab778df4eb68241",
};

export const testNet = { offline: false }; // only ever set by the emulator test hook below

const app = initializeApp(usingEmulators ? { ...firebaseConfig, projectId: "demo-elastic" } : firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

if (usingEmulators) {
  connectAuthEmulator(auth, `http://127.0.0.1:${import.meta.env.VITE_EMULATOR_AUTH_PORT || 9199}`, { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", Number(import.meta.env.VITE_EMULATOR_FIRESTORE_PORT || 8180));
  // Test hook: simulate losing and regaining the connection to the cloud.
  // disableNetwork stops the listeners; transactions go around it, hence the flag.
  window.__epNet = {
    off: () => { testNet.offline = true; return disableNetwork(db); },
    on: () => { testNet.offline = false; return enableNetwork(db); },
  };
}
export const googleProvider = new GoogleAuthProvider();
