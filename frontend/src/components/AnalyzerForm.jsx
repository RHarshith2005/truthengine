export default function AnalyzerForm({ text, onTextChange, onAnalyze, loading, disabled, analysisStep }) {
  const charCount = text.length;

  return (
    <section className="panel">
      <p className="section-title">Claim Input</p>
      <div className="textarea-wrapper">
        <textarea
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          className="text-input"
          placeholder="Paste a news claim, headline, or article excerpt here..."
          rows={6}
        />
        <span className="char-count">{charCount} characters</span>
      </div>

      <button
        id="analyze-button"
        className="primary-btn analyze-btn"
        onClick={onAnalyze}
        disabled={disabled || loading || !text.trim()}
      >
        {loading ? (
          <span className="btn-loading">
            <span className="spinner" />
            Analyzing...
          </span>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Analyze Claim
          </>
        )}
      </button>

      {loading && analysisStep && (
        <div className="step-indicator">
          <span className="step-pulse" />
          <span>{analysisStep}</span>
        </div>
      )}
    </section>
  );
}
