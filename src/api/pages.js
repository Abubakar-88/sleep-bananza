import axios from "axios";
import { storeApi } from "./client";

// Same WordPress host as storeApi:  .../wp-json/wc/store/v1  ->  .../wp-json/sleepstore/v1
const pagesApi = axios.create({
  baseURL: String(storeApi.defaults?.baseURL || "").replace(/\/wc\/store\/v1\/?$/, "/sleepstore/v1"),
});

// WP Admin → Personalize Page
export async function getPersonalizePage() {
  const { data } = await pagesApi.get("/page/personalize");
  return data;
}

// WP Admin → Collection Pages + Products → Categories (banner) for one category slug ("all" = every product)
export async function getCollectionPage(slug) {
  const { data } = await pagesApi.get(`/collection/${encodeURIComponent(slug || "all")}`);
  return data;
}

/* ---------- WooCommerce Store API helpers for the collection page ---------- */

// Products with total count (for "Load more"). qs = URLSearchParams string.
export async function getProductsPaged(qs) {
  const res = await storeApi.get(`/products?${qs}`);
  const items = res.data || [];
  const total = Number(res.headers?.["x-wp-total"]);
  return { items, total: Number.isFinite(total) ? total : null };
}

export async function getAttributes() {
  const { data } = await storeApi.get("/products/attributes");
  return data || [];
}

export async function getAttributeTerms(attributeId) {
  const { data } = await storeApi.get(`/products/attributes/${attributeId}/terms?per_page=100`);
  return data || [];
}

// Price range + how many products each attribute term has (inside a category)
export async function getCollectionData({ categoryId, taxonomies = [] }) {
  const qs = new URLSearchParams({ calculate_price_range: "true" });
  taxonomies.forEach((tax, i) => {
    qs.append(`calculate_attribute_counts[${i}][taxonomy]`, tax);
    qs.append(`calculate_attribute_counts[${i}][query_type]`, "or");
  });
  if (categoryId) qs.append("category", String(categoryId));
  const { data } = await storeApi.get(`/products/collection-data?${qs}`);
  return data || {};
}
