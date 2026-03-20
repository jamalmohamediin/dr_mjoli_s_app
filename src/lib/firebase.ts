import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyANAp02TgbOEdONXxZQiluFb1nbON8os5E",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dr-mjoli.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dr-mjoli",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dr-mjoli.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "211488805925",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    "1:211488805925:web:f05614e58622785ee29bcc",
};

const hasFirebaseConfig = Object.values(firebaseConfig).every((value) => Boolean(value));

export const firebaseApp = hasFirebaseConfig
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const firestoreDb = firebaseApp ? getFirestore(firebaseApp) : null;
export const isFirebaseConfigured = Boolean(firestoreDb);
