import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import AnalyzerForm from "../components/AnalyzerForm";
import ResultCard from "../components/ResultCard";
import { analyzeNews } from "../services/api";

export default function AnalyzePage({ user, getToken, onLogout }) {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("");

  async function handleAnalyze() {
    setError("");
    setResult(null);
    setLoading(true);
    setStep("Searching the web for evidence...");
    const t1 = setTimeout(() => setStep("AI agent is analyzing the claim..."), 5000);
    const t2 = setTimeout(() => setStep("Building verdict and report..."), 15000);
    const t3 = setTimeout(() => setStep("Almost done — finalizing results..."), 30000);

    try {
      const token = await getToken();
      const payload = await analyzeNews(token, text);

      setResult({
        prediction: payload.label || payload.analysis?.final_verdict || "Unknown",
        confidence: payload.confidence ?? payload.analysis?.confidence,
        reasoning: payload.analysis?.reasoning || [],
        sources: payload.analysis?.sources || [],
        headline: payload.report?.headline || "",
        explanation:
          payload.report?.report ||
          (Array.isArray(payload.analysis?.reasoning)
            ? payload.analysis.reasoning.join(" ")
            : payload.analysis?.reasoning) ||
          "No explanation returned.",
        recommendation: payload.report?.recommendation || "",
      });
    } catch (err) {
      setError(err?.message || "Unable to complete analysis.");
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setStep("");
      setLoading(false);
    }
  }

  return (
    <div className="page-shell">
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <Navbar user={user} onLogout={onLogout} activePage="analyze" />

      <main className="page-content">
        <div className="page-container">
          <div className="page-header">
            <h1>Analyze a <span className="gradient-text">Claim</span></h1>
            <p className="page-subtitle">
              Paste any news headline, claim, or article excerpt and let our AI agent verify it.
            </p>
          </div>

          <AnalyzerForm
            text={text}
            onTextChange={setText}
            onAnalyze={handleAnalyze}
            loading={loading}
            disabled={false}
            analysisStep={step}
          />

          {error && <p className="error-box">{error}</p>}

          <ResultCard result={result} />
        </div>
      </main>
    </div>
  );
}
