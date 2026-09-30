import axios from "axios";
import { storeApi } from "./client";

// Reuses the same WordPress host as storeApi:
// .../wp-json/wc/store/v1  ->  .../wp-json/sleepstore/v1
const reviewsApi = axios.create({
  baseURL: String(storeApi.defaults.baseURL).replace(/\/wc\/store\/v1\/?$/, "/sleepstore/v1"),
});

export async function getReviews(productId, { page = 1, perPage = 5 } = {}) {
  const { data } = await reviewsApi.get("/reviews", {
    params: { product_id: productId, page, per_page: perPage },
  });
  return data;
}

export async function submitReview({ productId, rating, name, email, content, website = "" }) {
  const { data } = await reviewsApi.post("/reviews", {
    product_id: productId,
    rating,
    name,
    email,
    content,
    website,
  });
  return data;
}