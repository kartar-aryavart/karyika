// 🔐 useAuth v2 — Robust Auth with Redirect Fallback
import { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithPopup, signInWithRedirect, getRedirectResult,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase/config";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

const AuthContext = createContext(null);

// Save user profile to Firestore on first signup
async function saveUserProfile(user, extraData = {}) {
  const ref = doc(db, "users", user.uid, "profile", "info");
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      name: user.displayName || extraData.name || "User",
      email: user.email,
      avatar: user.photoURL || "",
      plan: "free",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      theme: "dark",
      lang: "en",
      createdAt: serverTimestamp(),
      onboarded: false,
    });
  }
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    // Check for redirect result first (Google redirect flow)
    getRedirectResult(auth)
      .then(result => {
        if (result?.user) saveUserProfile(result.user);
      })
      .catch(() => {});

    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const loginWithGoogle = async () => {
    setAuthError("");
    try {
      // Try popup first
      const result = await signInWithPopup(auth, googleProvider);
      await saveUserProfile(result.user);
      return result;
    } catch (err) {
      if (
        err.code === "auth/popup-blocked" ||
        err.code === "auth/popup-closed-by-user" ||
        err.code === "auth/cancelled-popup-request"
      ) {
        // Fallback to redirect
        await signInWithRedirect(auth, googleProvider);
      } else {
        throw err;
      }
    }
  };

  const loginWithEmail = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const signupWithEmail = async (email, password, name) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(res.user, { displayName: name });
    await saveUserProfile(res.user, { name });
    return res;
  };

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{
      user, loading, authError,
      loginWithGoogle, loginWithEmail, signupWithEmail,
      resetPassword, logout,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
