export async function getFreshAccessToken() {
  let accessToken = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");

  if (!refreshToken) {
    throw new Error("Refresh token missing. Please log in again.");
  }

  let needsRefresh = true;

  if (accessToken) {
    try {
      const payload = JSON.parse(
        atob(accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
      );

      needsRefresh =
        !payload.exp ||
        payload.exp * 1000 < Date.now() + 60000;
    } catch {
      needsRefresh = true;
    }
  }

  if (needsRefresh) {
    const response = await fetch(
      "http://127.0.0.1:8000/api/token/refresh/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: refreshToken }),
      }
    );

    if (!response.ok) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      throw new Error("Session expired. Please log in again.");
    }

    const data = await response.json();
    accessToken = data.access;

    localStorage.setItem("access_token", accessToken);

    if (data.refresh) {
      localStorage.setItem("refresh_token", data.refresh);
    }
  }

  if (!accessToken) {
    throw new Error("Access token unavailable. Please log in again.");
  }

  return accessToken;
}

export function getCurrentUser() {
  const token = localStorage.getItem("access_token");
  if (!token) return { id: null, username: "Anonymous" };
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return {
      id: payload.user_id ?? payload.userId ?? null,
      username: payload.username || payload.email || "Collaborator",
    };
  } catch {
    return { id: null, username: "Collaborator" };
  }
}
