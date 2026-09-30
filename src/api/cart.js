import { storeApi } from "./client";

// Get the current cart (creates one automatically via the cart token if none exists)
export async function getCart() {
  const { data } = await storeApi.get("/cart");
  return data;
}

// Add a product to the cart
export async function addToCart(productId, quantity = 1) {
  const { data } = await storeApi.post("/cart/add-item", {
    id: productId,
    quantity,
  });
  return data;
}

// Update quantity of an item already in the cart
export async function updateCartItem(itemKey, quantity) {
  const { data } = await storeApi.post("/cart/update-item", {
    key: itemKey,
    quantity,
  });
  return data;
}

// Remove an item from the cart
export async function removeCartItem(itemKey) {
  const { data } = await storeApi.post("/cart/remove-item", {
    key: itemKey,
  });
  return data;
}