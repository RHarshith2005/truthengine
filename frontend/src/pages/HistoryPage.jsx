import { useState, useEffect, useCallback } from "react";

import Navbar from "../components/Navbar";
import { fetchHistory } from "../services/api";

function getVerdictConfig(label) {
  const p = (label || "").toUpperCase();
  if (p.includes("FAKE")) return { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)", emoji: "🚫", label: "FAKE" };
  if (p.includes("REAL")) return { color: "#22c55e", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.25)", emoji: "✅", label: "REAL" };
  return { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)", emoji: "⚠️", label: "UNVERIFIED" };
}

function timeAgo(dateStr) {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return then.toLocaleDateString();
}

export default function HistoryPage({ user, getToken, onLogout }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      const data = await fetchHistory(token);
      setItems(data.items || []);
    } catch (err) {
      setError(err?.message || "Failed to load history.");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filtered = items.filter((item) => {
    if (filter === "ALL") return true;
    return (item.prediction_label || "").toUpperCase().includes(filter);
  });

  const stats = {
    total: items.length,
    fake: items.filter((i) => (i.prediction_label || "").toUpperCase().includes("FAKE")).length,
    real: items.filter((i) => (i.prediction_label || "").toUpperCase().includes("REAL")).length,
  };

  return (
    <div className="page-shell">
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <Navbar user={user} onLogout={onLogout} activePage="history" />

      <main className="page-content">
        <div className="page-container">
          <div className="page-header">
            <h1>Analysis <span className="gradient-text">History</span></h1>
            <p className="page-subtitle">Track all your past fact-checks and verdicts.</p>
          </div>

          {/* Stats Row */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-icon" style={{ color: "#6366f1" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              </div>
              <div>
                <span className="stat-value">{stats.total}</span>
                <span className="stat-label">Total Analyses</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ color: "#ef4444" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div>
                <span className="stat-value">{stats.fake}</span>
                <span className="stat-label">Fake Detected</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ color: "#22c55e" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <div>
                <span className="stat-value">{stats.real}</span>
                <span className="stat-label">Verified Real</span>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="filter-bar">
            {["ALL", "FAKE", "REAL", "UNVERIFIED"].map((f) => (
              <button
                key={f}
                className={`filter-pill ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* History List */}
          {loading && (
            <div className="history-loading">
              <span className="spinner" />
              <span>Loading history...</span>
            </div>
          )}

          {error && <p className="error-box">{error}</p>}

          {!loading && !error && filtered.length === 0 && (
            <div className="history-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <p>{items.length === 0 ? "No analyses yet. Go analyze your first claim!" : "No results match this filter."}</p>
            </div>
          )}

          <div className="history-list">
            {filtered.map((item) => {
              const v = getVerdictConfig(item.prediction_label);
              const isExpanded = expandedId === item.id;
              return (
                <div
                  key={item.id}
                  className={`history-card ${isExpanded ? "expanded" : ""}`}
                  style={{ borderLeftColor: v.color }}
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div className="history-card-top">
                    <p className="history-text">{item.text}</p>
                    <div className="history-meta">
                      <span
                        className="history-verdict"
                        style={{ color: v.color, backgroundColor: v.bg, borderColor: v.border }}
                      >
                        {v.emoji} {v.label}
                      </span>
                      <span className="history-confidence">
                        {typeof item.confidence === "number" ? `${Math.round(item.confidence * 100)}%` : "N/A"}
                      </span>
                      <span className="history-time">{timeAgo(item.created_at)}</span>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="history-expanded">
                      <p className="history-full-text">{item.text}</p>
                      <div className="history-detail-row">
                        <span>Verdict: <strong style={{ color: v.color }}>{v.label}</strong></span>
                        <span>Confidence: <strong>{typeof item.confidence === "number" ? `${Math.round(item.confidence * 100)}%` : "N/A"}</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
