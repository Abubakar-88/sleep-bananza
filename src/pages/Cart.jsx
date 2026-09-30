import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { formatPrice } from "../utils/formatPrice";
import { Button } from "../components/common/Button";
import { Loader } from "../components/common/Loader";
import { CartLineItem } from "../components/cart/CartLineItem";

export function Cart() {
  const { cart, loading, updateQuantity, removeItem } = useCart();
  const [pendingKey, setPendingKey] = useState(null);

  if (loading) return <Loader label="Loading cart..." />;

  if (!cart?.items?.length) {
    return (
      <div className="text-center py-24">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-5 text-2xl">
          🛒
        </div>
        <h1 className="text-xl font-semibold text-slate-900 mb-2">Your cart is empty</h1>
        <p className="text-slate-500 mb-8">Looks like you haven't added anything yet.</p>
        <Link to="/shop">
          <Button variant="accent">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  async function handleQuantityChange(itemKey, quantity) {
    setPendingKey(itemKey);
    try {
      await updateQuantity(itemKey, quantity);
    } finally {
      setPendingKey(null);
    }
  }

  async function handleRemove(itemKey) {
    setPendingKey(itemKey);
    try {
      await removeItem(itemKey);
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Shopping Cart</h1>
        <p className="text-sm text-slate-500 mt-1">
          {cart.items_count} {cart.items_count === 1 ? "item" : "items"} in your cart
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl px-6">
          {cart.items.map((item) => (
            <CartLineItem
              key={item.key}
              item={item}
              busy={pendingKey === item.key}
              onQuantityChange={handleQuantityChange}
              onRemove={handleRemove}
            />
          ))}
        </div>

        <div>
          <div className="bg-white border border-slate-200 rounded-xl p-6 lg:sticky lg:top-24">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Order Summary</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>
                  {formatPrice(
                    cart.totals.total_items,
                    cart.totals.currency_minor_unit,
                    cart.totals.currency_symbol
                  )}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
            </div>

            <div className="flex justify-between items-center py-4 mt-2 border-t border-slate-200">
              <span className="text-base font-semibold text-slate-900">Total</span>
              <span className="text-lg font-semibold text-slate-900">
                {formatPrice(
                  cart.totals.total_price,
                  cart.totals.currency_minor_unit,
                  cart.totals.currency_symbol
                )}
              </span>
            </div>

            <Link to="/checkout">
              <Button variant="accent" className="w-full">Proceed to Checkout →</Button>
            </Link>

            <Link to="/shop" className="block text-center text-sm text-emerald-700 hover:underline mt-4">
              ← Continue Shopping
            </Link>

            <div className="mt-6 bg-emerald-50 border border-emerald-100 rounded-lg p-4 flex gap-3">
              <span className="text-emerald-600 text-lg leading-none">🔒</span>
              <p className="text-xs text-emerald-700">
                Secure checkout — your information is protected with industry-standard encryption.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}