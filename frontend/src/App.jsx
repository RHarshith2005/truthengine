import { useMemo, useState } from "react";
import { signInWithPopup, signOut } from "firebase/auth";

import { auth, googleProvider } from "./firebase";
import GoogleLogin from "./components/GoogleLogin";
import AnalyzerForm from "./components/AnalyzerForm";
import ResultCard from "./components/ResultCard";
import { analyzeNews, verifyAccess } from "./services/api";
import "./styles.css";

function mapAuthError(error) {
  const code = error?.code || "";

  if (code === "auth/popup-closed-by-user") {
    return "Login popup was closed before sign-in completed.";
  }

  if (code === "auth/popup-blocked") {
    return "Popup was blocked by the browser. Allow popups for this site and try again.";
  }

  if (code === "auth/unauthorized-domain") {
    return "This domain is not authorized in Firebase. Add localhost and 127.0.0.1 in Firebase Authentication authorized domains.";
  }

  if (code === "auth/configuration-not-found") {
    return "Google Authentication is not enabled in your Firebase project. Please enable it in the Firebase Console (Authentication > Sign-in method).";
  }

  if (code === "auth/invalid-api-key") {
    return "The Firebase API key is invalid. Please check your .env file.";
  }

  return error?.message || "Google login failed.";
}

export default function App() {
  const [user, setUser] = useState(null);
  const [idToken, setIdToken] = useState("");
  const [isAccessGranted, setIsAccessGranted] = useState(false);
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);

  const canAnalyze = useMemo(() => Boolean(user && idToken && isAccessGranted), [user, idToken, isAccessGranted]);

  async function handleGoogleLogin() {
    setError("");
    setAuthLoading(true);

    try {
      const credentials = await signInWithPopup(auth, googleProvider);
      const token = await credentials.user.getIdToken();

      // Keep Firebase sign-in state first so user can see auth succeeded.
      setUser(credentials.user);
      setIdToken(token);
      setIsAccessGranted(false);

      // Send token to backend so middleware can verify Firebase auth.
      await verifyAccess(token);
      setIsAccessGranted(true);
    } catch (err) {
      console.error("Firebase Auth Error:", err);
      const code = err?.code || "";
      const isFirebasePopupError = code.startsWith("auth/");

      if (isFirebasePopupError) {
        await signOut(auth).catch(() => null);
        setUser(null);
        setIdToken("");
        setIsAccessGranted(false);
      }

      setError(mapAuthError(err));
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    setError("");
    setAuthLoading(true);

    try {
      await signOut(auth);
      setUser(null);
      setIdToken("");
      setIsAccessGranted(false);
      setResult(null);
    } catch (err) {
      setError(err?.message || "Logout failed.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleAnalyze() {
    if (!canAnalyze) {
      setError("Please log in before analyzing text.");
      return;
    }

    setError("");
    setAnalyzeLoading(true);

    try {
      const payload = await analyzeNews(idToken, text);

      setResult({
        prediction: payload.label || payload.analysis?.final_verdict || "Unknown",
        confidence: payload.confidence ?? payload.analysis?.confidence,
        explanation:
          payload.report?.report ||
          (Array.isArray(payload.analysis?.reasoning)
            ? payload.analysis.reasoning.join(" ")
            : payload.analysis?.reasoning) ||
          "No explanation returned.",
      });
    } catch (err) {
      setError(err?.message || "Unable to complete analysis.");
    } finally {
      setAnalyzeLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <div className="background-glow" aria-hidden="true" />
      <div className="container">
        <header className="hero">
          <p className="tag">Fake News Detection</p>
          <h1>Analyze claims with AI-backed insight</h1>
          <p className="subtitle">
            Authenticate with Google, submit text, and get a quick prediction with confidence and
            explanation.
          </p>
        </header>

        <GoogleLogin
          user={user}
          loading={authLoading}
          isAccessGranted={isAccessGranted}
          onLogin={handleGoogleLogin}
          onLogout={handleLogout}
        />

        <AnalyzerForm
          text={text}
          onTextChange={setText}
          onAnalyze={handleAnalyze}
          loading={analyzeLoading}
          disabled={!canAnalyze}
        />

        {error ? <p className="error-box">{error}</p> : null}

        <ResultCard result={result} />
      </div>
    </main>
  );
}
