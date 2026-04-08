function formatConfidence(value) {
  if (typeof value !== "number") return "N/A";
  return `${Math.round(value * 100)}%`;
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
          <p className="value">{result.prediction}</p>
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
