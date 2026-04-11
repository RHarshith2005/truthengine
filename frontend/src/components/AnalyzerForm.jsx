export default function AnalyzerForm({ text, onTextChange, onAnalyze, loading, disabled, analysisStep }) {
  return (
    <section className="panel">
      <p className="section-title">Text Input</p>
      <textarea
        value={text}
        onChange={(event) => onTextChange(event.target.value)}
        className="text-input"
        placeholder="Paste a news claim or article excerpt here..."
        rows={8}
      />

      <button
        className="primary-btn analyze-btn"
        onClick={onAnalyze}
        disabled={disabled || loading || !text.trim()}
      >
        {loading ? "Analyzing..." : "Analyze"}
      </button>

      {loading && analysisStep && (
        <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#5b6f76" }}>
          ⚙ {analysisStep}
        </p>
      )}
    </section>
  );
}
