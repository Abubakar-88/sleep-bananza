import axios from "axios";

// Customer login/register runs against a dedicated auth endpoint (JWT plugin),
// separate from storeApi/wpApi since it needs its own base path (/wp-json/jwt-auth/v1
// or /wp-json/simple-jwt-login/v1 depending on which plugin the backend uses).
const WP_API_URL = import.meta.env.VITE_WP_API_URL;

const authApi = axios.create({
  baseURL: `${WP_API_URL}/wp-json/jwt-auth/v1`,
});

export async function login(username, password) {
  const { data } = await authApi.post("/token", { username, password });
  if (data.token) {
    localStorage.setItem("auth_token", data.token);
  }
  return data;
}

export function logout() {
  localStorage.removeItem("auth_token");
}

export function getToken() {
  return localStorage.getItem("auth_token");
}

export function isLoggedIn() {
  return Boolean(getToken());
}

export async function validateToken() {
  const token = getToken();
  if (!token) return false;
  try {
    await authApi.post(
      "/token/validate",
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return true;
  } catch {
    logout();
    return false;
  }
}
