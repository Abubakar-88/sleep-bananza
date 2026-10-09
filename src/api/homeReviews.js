import { storeApi } from "./client";

// Home page only: store-wide / per-category reviews from the WooCommerce Store API
// GET /wc/store/v1/products/reviews  (params: category_id, product_id, per_page, orderby, order)
// Kept separate from api/reviews.js, which powers the product-page ReviewsSection.
export async function getStoreReviews(params = {}) {
  const { data } = await storeApi.get("/products/reviews", { params });
  return data;
}
