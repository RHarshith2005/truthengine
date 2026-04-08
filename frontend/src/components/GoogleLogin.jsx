export default function GoogleLogin({ user, loading, isAccessGranted, onLogin, onLogout }) {
  return (
    <div className="auth-card">
      <div>
        <p className="section-title">Account</p>
        {user ? (
          <>
            <p className="user-text">Signed in as {user.displayName || user.email}</p>
            <p className="user-text">{isAccessGranted ? "Access granted by backend." : "Waiting for backend verification..."}</p>
          </>
        ) : (
          <p className="user-text">Sign in with Google to analyze text.</p>
        )}
      </div>

      {user ? (
        <button className="secondary-btn" onClick={onLogout} disabled={loading}>
          {loading ? "Signing out..." : "Logout"}
        </button>
      ) : (
        <button className="primary-btn" onClick={onLogin} disabled={loading}>
          {loading ? "Signing in..." : "Login with Google"}
        </button>
      )}
    </div>
  );
}
