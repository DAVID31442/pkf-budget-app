import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCW-Ued0K5v-91a3kD2kbEj0DlG7h_mhWg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "pkf-ed7df.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "pkf-ed7df",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "pkf-ed7df.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "59675659594",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:59675659594:web:030384023f7f3443b4c5b3",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-6CBG9EPM0W"
};

// Initialize Firebase
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Cloud Firestore instance
export const db = getFirestore(app);

// Firestore collection names constants
export const COLLECTIONS = {
  FISCAL_YEARS: 'fiscal_years',
  TRANSACTIONS: 'transactions',
  SERVANTS: 'servants',
  MONTHLY_PAYMENTS: 'monthly_payments',
} as const;
