import axios from "axios";
import { getToken } from "./auth";

// Talks to the custom "sleepbanaza/v1" REST namespace (see
// wp-content/mu-plugins/custom-account-api.php) — NOT the Store API or the
// admin-level wc/v3 API. Register is public; my-orders requires the JWT
// token from auth.js to be sent as a Bearer header.
const WP_API_URL = (import.meta.env.VITE_WP_API_URL || "").replace(/\/+$/, "");

const accountApi = axios.create({
  baseURL: `${WP_API_URL}/wp-json/sleepbanaza/v1`,
});

accountApi.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function registerCustomer({ first_name, last_name, email, password }) {
  const { data } = await accountApi.post("/register", { first_name, last_name, email, password });
  return data;
}

export async function getMyOrders() {
  const { data } = await accountApi.get("/my-orders");
  return data;
}

export async function getOrderDetail(orderId) {
  const { data } = await accountApi.get(`/my-orders/${orderId}`);
  return data;
}