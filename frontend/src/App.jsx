import { useState, useCallback } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { signInWithPopup, signOut } from "firebase/auth";

import { auth, googleProvider } from "./firebase";
import { verifyAccess, getFreshToken } from "./services/api";

import LoginPage from "./pages/LoginPage";
import AnalyzePage from "./pages/AnalyzePage";
import HistoryPage from "./pages/HistoryPage";

function mapAuthError(error) {
  const code = error?.code || "";
  if (code === "auth/popup-closed-by-user") return "Login popup was closed before sign-in completed.";
  if (code === "auth/popup-blocked") return "Popup was blocked by the browser. Allow popups and try again.";
  if (code === "auth/unauthorized-domain") return "This domain is not authorized in Firebase. Add localhost in Firebase Console.";
  if (code === "auth/configuration-not-found") return "Google Auth is not enabled in your Firebase project.";
  if (code === "auth/invalid-api-key") return "The Firebase API key is invalid. Check your .env file.";
  if (error?.message?.includes("Cannot reach backend")) return "Cannot reach backend. Ensure FastAPI is running.";
  if (error?.message?.includes("401") || error?.message?.includes("Unauthorized")) return "Backend rejected your token.";
  return error?.message || "Google login failed.";
}

export default function App() {
  const [user, setUser] = useState(null);
  const [idToken, setIdToken] = useState("");
  const [isAccessGranted, setIsAccessGranted] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const handleGoogleLogin = useCallback(async () => {
    setAuthError("");
    setAuthLoading(true);
    try {
      const credentials = await signInWithPopup(auth, googleProvider);
      const token = await credentials.user.getIdToken();
      setUser(credentials.user);
      setIdToken(token);
      setIsAccessGranted(false);
      await verifyAccess(token);
      setIsAccessGranted(true);
    } catch (err) {
      console.error("Auth Error:", err);
      if (err?.code?.startsWith("auth/")) {
        await signOut(auth).catch(() => null);
        setUser(null);
        setIdToken("");
        setIsAccessGranted(false);
      }
      setAuthError(mapAuthError(err));
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    setAuthLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setIdToken("");
      setIsAccessGranted(false);
    } catch (err) {
      setAuthError(err?.message || "Logout failed.");
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const getToken = useCallback(async () => {
    if (!user) throw new Error("No user logged in.");
    const fresh = await getFreshToken(user);
    setIdToken(fresh);
    return fresh;
  }, [user]);

  const isAuthenticated = Boolean(user && idToken && isAccessGranted);

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/analyze" replace />
          ) : (
            <LoginPage
              onLogin={handleGoogleLogin}
              loading={authLoading}
              error={authError}
            />
          )
        }
      />
      <Route
        path="/analyze"
        element={
          isAuthenticated ? (
            <AnalyzePage
              user={user}
              getToken={getToken}
              onLogout={handleLogout}
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/history"
        element={
          isAuthenticated ? (
            <HistoryPage
              user={user}
              getToken={getToken}
              onLogout={handleLogout}
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
    </Routes>
  );
}
