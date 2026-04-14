function formatConfidence(value) {
  if (typeof value !== "number") return "N/A";
  return `${Math.round(value * 100)}%`;
}

function getVerdictConfig(prediction) {
  const p = (prediction || "").toUpperCase();
  if (p === "FAKE" || p.includes("FAKE")) {
    return { label: "FAKE", color: "#ef4444", glow: "rgba(239, 68, 68, 0.25)", emoji: "🚫" };
  }
  if (p === "REAL" || p.includes("REAL")) {
    return { label: "REAL", color: "#22c55e", glow: "rgba(34, 197, 94, 0.25)", emoji: "✅" };
  }
  return { label: "UNVERIFIED", color: "#f59e0b", glow: "rgba(245, 158, 11, 0.25)", emoji: "⚠️" };
}

export default function ResultCard({ result }) {
  if (!result) {
    return (
      <section className="panel result-empty">
        <div className="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.35">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <p className="empty-text">Run an analysis to see the verdict.</p>
        </div>
      </section>
    );
  }

  const verdict = getVerdictConfig(result.prediction);
  const confidencePercent = typeof result.confidence === "number" ? Math.round(result.confidence * 100) : 0;

  return (
    <section className="panel result-panel">
      {/* Verdict Badge */}
      <div className="verdict-header">
        <div
          className="verdict-badge"
          style={{ backgroundColor: verdict.glow, borderColor: verdict.color }}
        >
          <span className="verdict-emoji">{verdict.emoji}</span>
          <span className="verdict-label" style={{ color: verdict.color }}>{verdict.label}</span>
        </div>
        {result.headline && (
          <p className="verdict-headline">{result.headline}</p>
        )}
      </div>

      {/* Confidence Meter */}
      <div className="confidence-section">
        <div className="confidence-header">
          <span className="label">Confidence</span>
          <span className="confidence-value" style={{ color: verdict.color }}>
            {formatConfidence(result.confidence)}
          </span>
        </div>
        <div className="confidence-track">
          <div
            className="confidence-fill"
            style={{
              width: `${confidencePercent}%`,
              backgroundColor: verdict.color,
              boxShadow: `0 0 12px ${verdict.glow}`,
            }}
          />
        </div>
      </div>

      {/* Reasoning Points */}
      {result.reasoning && result.reasoning.length > 0 && (
        <div className="reasoning-section">
          <p className="label">Evidence & Reasoning</p>
          <ul className="reasoning-list">
            {result.reasoning.map((point, index) => (
              <li key={index} className="reasoning-item">
                <span className="reasoning-bullet" style={{ backgroundColor: verdict.color }} />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detailed Report */}
      <div className="explanation-block">
        <p className="label">Detailed Report</p>
        <p className="explanation-text">{result.explanation || "No explanation returned."}</p>
      </div>

      {/* Sources */}
      {result.sources && result.sources.length > 0 && (
        <div className="sources-section">
          <p className="label">Sources Referenced</p>
          <div className="sources-list">
            {result.sources.map((source, index) => (
              <span key={index} className="source-chip">
                {source.startsWith("http") ? (
                  <a href={source} target="_blank" rel="noopener noreferrer">{new URL(source).hostname}</a>
                ) : (
                  source
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation */}
      {result.recommendation && (
        <div className="recommendation-block">
          <span className="rec-icon">💡</span>
          <p className="rec-text">{result.recommendation}</p>
        </div>
      )}
    </section>
  );
}
