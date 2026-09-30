import { Link } from "react-router-dom";
import { formatPrice } from "../../utils/formatPrice";
import { decodeHtml } from "../../utils/decodeHtml";
import { QuantityStepper } from "../common/QuantityStepper";

export function CartLineItem({ item, busy, onQuantityChange, onRemove }) {
  return (
    <div className="flex gap-4 py-5 border-b border-slate-100 last:border-0">
      <Link to={`/product/${item.id}`} className="w-24 h-24 bg-slate-100 rounded-lg overflow-hidden shrink-0">
        {item.images?.[0]?.src && (
          <img src={item.images[0].src} alt={decodeHtml(item.name)} className="w-full h-full object-cover" />
        )}
      </Link>

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <Link to={`/product/${item.id}`} className="text-sm font-medium text-slate-900 hover:underline">
            {decodeHtml(item.name)}
          </Link>
          {item.variation?.length > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">
              {item.variation.map((v) => `${v.attribute}: ${decodeHtml(v.value)}`).join(" · ")}
            </p>
          )}
          <p className="text-sm text-slate-500 mt-1">
            {formatPrice(item.prices.price, item.prices.currency_minor_unit, item.prices.currency_symbol)} each
          </p>
        </div>

        <div className="flex items-center gap-4 mt-3">
          <QuantityStepper
            quantity={item.quantity}
            disabled={busy}
            onDecrease={() => onQuantityChange(item.key, item.quantity - 1)}
            onIncrease={() => onQuantityChange(item.key, item.quantity + 1)}
          />
          <button
            type="button"
            onClick={() => onRemove(item.key)}
            disabled={busy}
            className="text-sm text-slate-400 hover:text-red-600 disabled:opacity-40 transition-colors"
          >
            Remove
          </button>
        </div>
      </div>

      <p className="text-sm font-semibold text-slate-900 whitespace-nowrap self-start">
        {formatPrice(item.totals.line_total, item.totals.currency_minor_unit, item.totals.currency_symbol)}
      </p>
    </div>
  );
}