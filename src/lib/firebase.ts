import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim() || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim() || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim() || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim() || "",
};

const missingFirebaseConfigKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);
const hasFirebaseConfig = missingFirebaseConfigKeys.length === 0;

if (!hasFirebaseConfig && typeof window !== "undefined") {
  console.warn(
    `Firebase is not configured. Missing env keys: ${missingFirebaseConfigKeys.join(", ")}`,
  );
}

export const firebaseApp = hasFirebaseConfig
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const firestoreDb = firebaseApp ? getFirestore(firebaseApp) : null;
export const firebaseStorage = firebaseApp ? getStorage(firebaseApp) : null;
export const isFirebaseConfigured = Boolean(firestoreDb);
