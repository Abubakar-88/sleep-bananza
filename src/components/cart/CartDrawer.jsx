import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../hooks/useCart";
import { formatPrice } from "../../utils/formatPrice";
import { decodeHtml } from "../../utils/decodeHtml";
import { Button } from "../common/Button";
import { QuantityStepper } from "../common/QuantityStepper";

export function CartDrawer({ open, onClose }) {
  const { cart, updateQuantity, removeItem } = useCart();
  const [pendingKey, setPendingKey] = useState(null);

  if (!open) return null;

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

  const hasItems = cart?.items?.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white h-full shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Your Cart {hasItems && <span className="text-slate-400 font-normal">({cart.items_count})</span>}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 text-sm" aria-label="Close cart">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {!hasItems && (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-xl">
                🛒
              </div>
              <p className="text-slate-500 text-sm mb-6">Your cart is empty.</p>
              <Link to="/shop" onClick={onClose}>
                <Button variant="accent">Continue Shopping</Button>
              </Link>
            </div>
          )}

          {hasItems &&
            cart.items.map((item) => (
              <div key={item.key} className="flex gap-3 py-4 border-b border-slate-100 last:border-0">
                <div className="w-16 h-16 bg-slate-100 rounded-md overflow-hidden shrink-0">
                  {item.images?.[0]?.src && (
                    <img src={item.images[0].src} alt={decodeHtml(item.name)} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 line-clamp-2">{decodeHtml(item.name)}</p>
                  {item.variation?.length > 0 && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.variation.map((v) => `${v.attribute}: ${decodeHtml(v.value)}`).join(" · ")}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <QuantityStepper
                      size="sm"
                      quantity={item.quantity}
                      disabled={pendingKey === item.key}
                      onDecrease={() => handleQuantityChange(item.key, item.quantity - 1)}
                      onIncrease={() => handleQuantityChange(item.key, item.quantity + 1)}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemove(item.key)}
                      disabled={pendingKey === item.key}
                      className="text-xs text-slate-400 hover:text-red-600 disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <p className="text-sm font-semibold text-slate-900 whitespace-nowrap">
                  {formatPrice(item.totals.line_total, item.totals.currency_minor_unit, item.totals.currency_symbol)}
                </p>
              </div>
            ))}
        </div>

        {hasItems && (
          <div className="border-t border-slate-200 px-6 py-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-semibold text-slate-900">
                {formatPrice(
                  cart.totals.total_items,
                  cart.totals.currency_minor_unit,
                  cart.totals.currency_symbol
                )}
              </span>
            </div>
            <Link to="/checkout" onClick={onClose}>
              <Button variant="accent" className="w-full">Checkout</Button>
            </Link>
            <Link
              to="/cart"
              onClick={onClose}
              className="block text-center text-sm text-emerald-700 hover:underline"
            >
              View Full Cart
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}