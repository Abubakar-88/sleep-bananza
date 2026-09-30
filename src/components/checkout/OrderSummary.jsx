import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../hooks/useCart";
import { formatPrice } from "../../utils/formatPrice";
import { decodeHtml } from "../../utils/decodeHtml";
import { QuantityStepper } from "../common/QuantityStepper";

// USA-market payment options only — no bKash/Nagad (those are Bangladesh-only
// mobile wallets and don't apply to a US-facing storefront).
const PAYMENT_BADGES = [
  { label: "Visa", classes: "bg-blue-900 text-white" },
  { label: "Mastercard", classes: "bg-orange-500 text-white" },
  { label: "Amex", classes: "bg-sky-600 text-white" },
  { label: "PayPal", classes: "bg-indigo-600 text-white" },
  { label: "Cash on Delivery", classes: "bg-slate-100 text-slate-700 border border-slate-300" },
];

export function OrderSummary() {
  const { cart, updateQuantity } = useCart();
  const [pendingKey, setPendingKey] = useState(null);

  if (!cart) return null;

  async function handleChange(itemKey, quantity) {
    setPendingKey(itemKey);
    try {
      await updateQuantity(itemKey, quantity);
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 lg:sticky lg:top-24">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Your Order</h2>

      <div className="space-y-4 mb-2">
        {cart.items?.map((item) => (
          <div key={item.key} className="flex gap-3 pb-4 border-b border-slate-100 last:border-0">
            <div className="w-16 h-16 bg-slate-100 rounded-md overflow-hidden shrink-0">
              {item.images?.[0]?.src && (
                <img src={item.images[0].src} alt={decodeHtml(item.name)} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{decodeHtml(item.name)}</p>
              {item.variation?.length > 0 && (
                <p className="text-xs text-slate-500 mb-2">
                  {item.variation.map((v) => `${v.attribute}: ${decodeHtml(v.value)}`).join(" · ")}
                </p>
              )}
              <div className="mt-2">
                <QuantityStepper
                  size="sm"
                  quantity={item.quantity}
                  disabled={pendingKey === item.key}
                  onDecrease={() => handleChange(item.key, item.quantity - 1)}
                  onIncrease={() => handleChange(item.key, item.quantity + 1)}
                />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-900 whitespace-nowrap">
              {formatPrice(
                item.totals.line_total,
                item.totals.currency_minor_unit,
                item.totals.currency_symbol
              )}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-2 py-4 border-t border-slate-200 text-sm">
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
          <span>
            {Number(cart.totals.total_shipping) > 0
              ? formatPrice(
                  cart.totals.total_shipping,
                  cart.totals.currency_minor_unit,
                  cart.totals.currency_symbol
                )
              : "Calculated at next step"}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center py-4 border-t border-slate-200">
        <span className="text-base font-semibold text-slate-900">Total</span>
        <span className="text-lg font-semibold text-slate-900">
          {formatPrice(
            cart.totals.total_price,
            cart.totals.currency_minor_unit,
            cart.totals.currency_symbol
          )}
        </span>
      </div>

      <div className="pt-2">
        <p className="text-sm font-medium text-slate-900 mb-2">We accept</p>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_BADGES.map((badge) => (
            <span
              key={badge.label}
              className={`text-xs font-semibold px-2.5 py-1.5 rounded ${badge.classes}`}
            >
              {badge.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-emerald-50 border border-emerald-100 rounded-lg p-4 flex gap-3">
        <span className="text-emerald-600 text-lg leading-none">🔒</span>
        <div>
          <p className="text-sm font-medium text-emerald-900">Your order is safe and secure</p>
          <p className="text-xs text-emerald-700 mt-0.5">
            We use industry-standard encryption to protect your personal information.
          </p>
        </div>
      </div>

      <Link to="/cart" className="inline-block mt-4 text-sm text-emerald-700 hover:underline">
        ← Return to Cart
      </Link>
    </div>
  );
}