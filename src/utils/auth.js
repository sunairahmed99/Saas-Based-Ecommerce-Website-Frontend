/** Normalize token from localStorage (strip optional Bearer prefix). */
export function getAuthToken() {
  const raw = localStorage.getItem("token");
  if (!raw) return null;
  return raw.replace(/^Bearer\s+/i, "").trim();
}

export function getAuthHeaders() {
  const token = getAuthToken();
  return token ? { auth_token: token } : {};
}
