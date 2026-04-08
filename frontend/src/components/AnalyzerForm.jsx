export default function AnalyzerForm({ text, onTextChange, onAnalyze, loading, disabled }) {
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
    </section>
  );
}
