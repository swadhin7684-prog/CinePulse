import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBWMNYEGemSziwv5C3JonVT0uLXdQuUc0w",
  authDomain: "cinepulse-f67d7.firebaseapp.com",
  projectId: "cinepulse-f67d7",
  storageBucket: "cinepulse-f67d7.firebasestorage.app",
  messagingSenderId: "312094043820",
  appId: "1:312094043820:web:87c033838cb58068c57909",
  measurementId: "G-N645VSQ37S"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Analytics conditionally
export let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

export default app;
