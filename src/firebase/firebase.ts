import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDvHpz-cpeRbz9C0qq2YtafEs',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'statica-eot.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'statica-eot',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'statica-eot.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '378588634942',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:378588634942:web:c675bb9237ffb0241c166f',
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
