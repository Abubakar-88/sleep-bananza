import { useState } from "react";
import { Link } from "react-router-dom";
import { formatPrice, formatPriceFromProduct } from "../../utils/formatPrice";
import { decodeHtml } from "../../utils/decodeHtml";
import { ColorSwatches } from "./ColorSwatches";
import { StarRating } from "./StarRating";
import { useWishlist } from "../../hooks/useWishlist";

export function ProductCard({ product, onQuickView }) {
  const [hovered, setHovered] = useState(false);
  const [swatchIndex, setSwatchIndex] = useState(null);
  const { isWishlisted, toggle } = useWishlist();

  const images = product.images || [];
  // Hover swaps to the 2nd image (typical lifestyle/alt shot); picking a
  // color swatch overrides that with a guessed image for that color.
  const displayIndex = swatchIndex != null ? swatchIndex : hovered && images.length > 1 ? 1 : 0;
  const image = images[displayIndex]?.src || images[0]?.src;

  const colorAttr = (product.attributes || []).find((a) =>
    a.name?.toLowerCase().includes("color")
  );

  const wishlisted = isWishlisted(product.id);
  const badgeText = product.tags?.[0]?.name;

  const regular = Number(product.prices?.regular_price ?? product.prices?.price ?? 0);
  const current = Number(product.prices?.price ?? 0);
  const onSale = regular > current;
  const discountPct = onSale ? Math.round(((regular - current) / regular) * 100) : 0;

  return (
    <div
      className="group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden mb-3">
          {image && (
            <img
              src={image}
              alt={decodeHtml(product.name)}
              className="w-full h-full object-cover transition-opacity duration-500 ease-in-out"
              key={image}
            />
          )}

          {badgeText && (
            <span className="absolute top-3 left-3 bg-slate-900 text-white text-[11px] font-semibold uppercase tracking-wide px-2 py-1 rounded">
              {decodeHtml(badgeText)}
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggle(product.id);
            }}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 text-slate-600 hover:text-rose-500 shadow-sm transition"
            aria-label="Toggle wishlist"
          >
            {wishlisted ? "♥" : "♡"}
          </button>

          {onQuickView && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(product.id);
              }}
              className="absolute left-1/2 -translate-x-1/2 bottom-3 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 bg-white text-slate-900 text-xs font-semibold uppercase tracking-wide px-4 py-2 rounded-full shadow-md whitespace-nowrap hover:bg-slate-900 hover:text-white"
            >
              + Quick View
            </button>
          )}
        </div>

        <h3 className="text-sm font-medium text-slate-900 line-clamp-2">
          {decodeHtml(product.name)}
        </h3>

        {(product.average_rating > 0 || product.review_count > 0) && (
          <div className="mt-1">
            <StarRating rating={product.average_rating} count={product.review_count} />
          </div>
        )}

        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-semibold text-slate-900">
            {formatPriceFromProduct(product)}
          </span>
          {onSale && (
            <>
              <span className="text-sm text-slate-400 line-through">
                {formatPrice(product.prices.regular_price, product.prices.currency_minor_unit, product.prices.currency_symbol)}
              </span>
              <span className="text-xs font-medium text-emerald-600">-{discountPct}%</span>
            </>
          )}
        </div>
      </Link>

      {colorAttr && (
        <div className="mt-2">
          <ColorSwatches
            options={colorAttr.terms}
            activeSlug={colorAttr.terms[swatchIndex ?? 0]?.slug}
            onSelect={(slug) => {
              const idx = colorAttr.terms.findIndex((t) => t.slug === slug);
              setSwatchIndex(idx);
            }}
          />
        </div>
      )}
    </div>
  );
}