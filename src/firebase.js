import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD3rbuPMCvOlL8GfEAeQlyYLQxURZ_hW4Y",
  authDomain: "nexus-2519d.firebaseapp.com",
  projectId: "nexus-2519d",
  storageBucket: "nexus-2519d.firebasestorage.app",
  messagingSenderId: "22134638036",
  appId: "1:22134638036:web:dd22a64ab778df4eb68241",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
