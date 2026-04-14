const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function getAlternativeBaseUrl(baseUrl) {
  if (baseUrl.includes("127.0.0.1")) {
    return baseUrl.replace("127.0.0.1", "localhost");
  }

  if (baseUrl.includes("localhost")) {
    return baseUrl.replace("localhost", "127.0.0.1");
  }

  return null;
}

function getAuthHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function parseResponse(response, fallbackMessage) {
  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const detail = payload?.detail || payload?.message || fallbackMessage;
    throw new Error(detail);
  }

  return payload;
}

async function requestWithHostFallback(path, options) {
  const primaryUrl = `${API_BASE_URL}${path}`;

  try {
    return await fetch(primaryUrl, options);
  } catch (err) {
    if (err?.name !== "TypeError") {
      throw err;
    }

    const alternativeBaseUrl = getAlternativeBaseUrl(API_BASE_URL);
    if (!alternativeBaseUrl) {
      throw err;
    }

    const fallbackUrl = `${alternativeBaseUrl}${path}`;
    return await fetch(fallbackUrl, options);
  }
}

function buildBackendUnavailableError() {
  const origin = typeof window !== "undefined" ? window.location.origin : "unknown-origin";
  return new Error(
    `Cannot reach backend at ${API_BASE_URL}. Frontend origin: ${origin}. Ensure FastAPI is running and CORS allows this origin.`
  );
}

export async function getFreshToken(firebaseUser) {
  if (!firebaseUser) throw new Error("No user logged in.");
  // forceRefresh=true gets a new token even if the current one is not expired yet
  return await firebaseUser.getIdToken(true);
}

export async function verifyAccess(token) {
  try {
    const response = await requestWithHostFallback("/api/v1/protected/me", {
      method: "GET",
      headers: getAuthHeaders(token),
    });

    return parseResponse(response, "Backend token verification failed.");
  } catch (err) {
    if (err?.name === "TypeError") {
      throw buildBackendUnavailableError();
    }
    throw err;
  }
}

export async function analyzeNews(token, text) {
  try {
    const response = await requestWithHostFallback("/api/v1/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(token),
      },
      body: JSON.stringify({ text }),
    });

    return parseResponse(response, "Analysis request failed.");
  } catch (err) {
    if (err?.name === "TypeError") {
      throw buildBackendUnavailableError();
    }
    throw err;
  }
}

export async function fetchHistory(token) {
  try {
    const response = await requestWithHostFallback("/api/v1/history", {
      method: "GET",
      headers: getAuthHeaders(token),
    });

    return parseResponse(response, "Failed to fetch analysis history.");
  } catch (err) {
    if (err?.name === "TypeError") {
      throw buildBackendUnavailableError();
    }
    throw err;
  }
}
