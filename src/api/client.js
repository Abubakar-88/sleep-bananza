import axios from "axios";

// Base URL comes from .env — this points at your headless WordPress/WooCommerce backend.
// Strip any trailing slash(es) so a value like "https://api.example.com/" in .env
// doesn't produce a double slash ("...com//wp-json/...") when we append the path below —
// a double slash can fail to match WordPress-side rewrite/redirect rules and break CORS.
const WP_API_URL = (import.meta.env.VITE_WP_API_URL || "").replace(/\/+$/, "");

// WooCommerce Store API — used for everything the customer touches directly:
// product listing, product detail, cart, checkout. No API key needed —
// it works via a session/cart token that this client stores automatically.
export const storeApi = axios.create({
  baseURL: `${WP_API_URL}/wp-json/wc/store/v1`,
  withCredentials: true, // keeps the cart session alive across requests
});

// WordPress REST API — used for content: pages, posts, blog, categories.
export const wpApi = axios.create({
  baseURL: `${WP_API_URL}/wp-json/wp/v2`,
});

// Automatically attach the Store API's cart token once WooCommerce issues one,
// so the same cart persists across page loads/requests.
storeApi.interceptors.response.use((response) => {
  const cartToken = response.headers["cart-token"];
  if (cartToken) {
    localStorage.setItem("cart_token", cartToken);
  }
  return response;
});

storeApi.interceptors.request.use((config) => {
  const cartToken = localStorage.getItem("cart_token");
  if (cartToken) {
    config.headers["Cart-Token"] = cartToken;
  }
  return config;
});