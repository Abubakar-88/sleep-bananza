import { storeApi } from "./client";

// Update customer billing/shipping info + shipping method on the cart
// before placing the order (Store API keeps this as part of /cart/update-customer)
export async function updateCustomer(customerData) {
  const { data } = await storeApi.post("/cart/update-customer", customerData);
  return data;
}

// Get available shipping rates for the current cart
export async function getShippingRates() {
  const { data } = await storeApi.get("/cart");
  return data.shipping_rates;
}

// Select a shipping rate for a package
export async function selectShippingRate(packageId, rateId) {
  const { data } = await storeApi.post("/cart/select-shipping-rate", {
    package_id: packageId,
    rate_id: rateId,
  });
  return data;
}

// Place the order using the WooCommerce Checkout Store API endpoint.
// payment_method must match an enabled WooCommerce payment gateway id
// (e.g. "stripe", "cod", "paypal"). billing_address is required by this
// endpoint even though it was already saved via updateCustomer() — the
// Store API's /checkout route validates its own copy of the address,
// it doesn't fall back to whatever is already stored on the cart/session.
export async function placeOrder({ payment_method, payment_data = [], billing_address, shipping_address }) {
  const { data } = await storeApi.post("/checkout", {
    payment_method,
    payment_data,
    billing_address,
    shipping_address,
  });
  return data;
}