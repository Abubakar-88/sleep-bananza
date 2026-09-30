import { storeApi } from "./client";

// Get a list of products (supports search, category filter, pagination via params)
export async function getProducts(params = {}) {
  const { data } = await storeApi.get("/products", { params });
  return data;
}

// Get a single product by its numeric ID
export async function getProductById(id) {
  const { data } = await storeApi.get(`/products/${id}`);
  return data;
}

// Get all product categories (Sleep, Bedding, Lighting, Wellness, etc.)
export async function getProductCategories() {
  const { data } = await storeApi.get("/products/categories");
  return data;
}
// WooCommerce Store API: same category products, current product বাদ দিয়ে
// Same category-র product, current product বাদ দিয়ে
export async function getRelatedProducts(product, limit = 4) {
  const cat = product.categories?.[0]?.id;

  let list = [];
  if (cat) {
    list = await getProducts({ category: String(cat), per_page: limit + 1 });
    list = list.filter((p) => p.id !== product.id);
  }

  // category-তে যথেষ্ট product না থাকলে অন্য product দিয়ে ভরা
  if (list.length < limit) {
    const more = await getProducts({ per_page: limit + 1 });
    for (const p of more) {
      if (p.id !== product.id && !list.some((x) => x.id === p.id)) list.push(p);
    }
  }

  return list.slice(0, limit);
}