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

/** Login types that represent a customer/admin user session (not seller). */
export function isUserLoginType(loginType) {
  return loginType === "user" || loginType === "google";
}

export function getLoginType() {
  return localStorage.getItem("loginType");
}

export function getUserRecord(user) {
  return user?.data || user;
}

export function isAdminRole(userOrRole) {
  if (typeof userOrRole === "string") {
    return userOrRole.toLowerCase().trim() === "admin";
  }
  const record = getUserRecord(userOrRole);
  return (record?.role || "").toLowerCase().trim() === "admin";
}
