// 🔥 Firebase Configuration — Karyika
// Project: karyika-by-kartar-aryavart

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyD0j9W7MtULSHL4HBM5xL0sE2jfGjyOgrM",
  authDomain: "karyika-by-kartar-aryavart.firebaseapp.com",
  projectId: "karyika-by-kartar-aryavart",
  storageBucket: "karyika-by-kartar-aryavart.firebasestorage.app",
  messagingSenderId: "1097801303244",
  appId: "1:1097801303244:web:cf65f48d6f9fafe21c6e69",
  measurementId: "G-YBLL33HFQW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const analytics = getAnalytics(app);

export default app;
