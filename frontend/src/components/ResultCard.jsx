function formatConfidence(value) {
  if (typeof value !== "number") return "N/A";
  return `${Math.round(value * 100)}%`;
}

function getPredictionColor(prediction) {
  const p = (prediction || "").toLowerCase();
  if (p === "fake") return "#c0392b";
  if (p === "real") return "#1a7a4a";
  return "#b7640a";
}

export default function ResultCard({ result }) {
  if (!result) {
    return (
      <section className="panel">
        <p className="section-title">Result</p>
        <p className="empty-text">Run an analysis to see prediction details.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <p className="section-title">Result</p>
      <div className="result-grid">
        <div>
          <p className="label">Prediction</p>
          <p className="value" style={{ color: getPredictionColor(result.prediction) }}>
            {result.prediction}
          </p>
        </div>
        <div>
          <p className="label">Confidence</p>
          <p className="value">{formatConfidence(result.confidence)}</p>
        </div>
      </div>

      <div className="explanation-block">
        <p className="label">Explanation</p>
        <p className="explanation-text">{result.explanation || "No explanation returned."}</p>
      </div>
    </section>
  );
}
