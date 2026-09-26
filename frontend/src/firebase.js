// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || "AIzaSyBWMNYEGemSziwv5C3JonVT0uLXdQuUc0w",
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || "cinepulse-f67d7.firebaseapp.com",
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || "cinepulse-f67d7",
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || "cinepulse-f67d7.firebasestorage.app",
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "312094043820",
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || "1:312094043820:web:87c033838cb58068c57909",
  measurementId: import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID || "G-N645VSQ37S"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Initialize Analytics conditionally
export let analytics = null;
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {});
}

export default app;
