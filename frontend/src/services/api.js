const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

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

export async function verifyAccess(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/protected/me`, {
      method: "GET",
      headers: getAuthHeaders(token),
    });

    return parseResponse(response, "Backend token verification failed.");
  } catch (err) {
    if (err?.name === "TypeError") {
      throw new Error(
        "Cannot reach backend. Ensure FastAPI is running and CORS includes your frontend origin."
      );
    }
    throw err;
  }
}

export async function analyzeNews(token, text) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/analyze`, {
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
      throw new Error("Cannot reach backend. Please check API server and CORS configuration.");
    }
    throw err;
  }
}
