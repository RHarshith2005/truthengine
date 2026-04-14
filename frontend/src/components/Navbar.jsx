import { Link } from "react-router-dom";

export default function Navbar({ user, onLogout, activePage }) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/analyze" className="nav-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="url(#navGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <defs>
              <linearGradient id="navGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
          <span className="nav-brand-text">Truth<span className="gradient-text">Engine</span></span>
        </Link>

        <div className="nav-links">
          <Link
            to="/analyze"
            className={`nav-link ${activePage === "analyze" ? "active" : ""}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Analyze
          </Link>
          <Link
            to="/history"
            className={`nav-link ${activePage === "history" ? "active" : ""}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            History
          </Link>
        </div>

        <div className="nav-user">
          {user?.photoURL && (
            <img src={user.photoURL} alt="" className="nav-avatar" referrerPolicy="no-referrer" />
          )}
          <span className="nav-username">{user?.displayName || user?.email || "User"}</span>
          <button className="nav-logout-btn" onClick={onLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}
