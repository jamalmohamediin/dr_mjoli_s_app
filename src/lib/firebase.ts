import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  // Keep the known public Firebase app config as a fallback so
  // local/manual builds do not silently disconnect from Firestore.
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY?.trim() || "AIzaSyANAp02TgbOEdONXxZQiluFb1nbON8os5E",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() || "dr-mjoli.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim() || "dr-mjoli",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim() || "dr-mjoli.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() || "211488805925",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID?.trim() || "1:211488805925:web:f05614e58622785ee29bcc",
};

const hasFirebaseConfig = Object.values(firebaseConfig).every((value) => Boolean(value));

export const firebaseApp = hasFirebaseConfig
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const firestoreDb = firebaseApp ? getFirestore(firebaseApp) : null;
export const firebaseStorage = firebaseApp ? getStorage(firebaseApp) : null;
export const isFirebaseConfigured = Boolean(firestoreDb);
