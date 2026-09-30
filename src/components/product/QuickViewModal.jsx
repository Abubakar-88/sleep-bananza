import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProductById } from "../../api/products";
import { useCart } from "../../hooks/useCart";
import { decodeHtml } from "../../utils/decodeHtml";
import { formatPrice, formatPriceFromProduct } from "../../utils/formatPrice";
import { ColorSwatches } from "./ColorSwatches";
import { StarRating } from "./StarRating";
import { QuantityStepper } from "../common/QuantityStepper";
import { Button } from "../common/Button";

export function QuickViewModal({ productId, onClose }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selected, setSelected] = useState({}); // { [attributeName]: slug }
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProductById(productId).then((data) => {
      if (cancelled) return;
      setProduct(data);
      setActiveImage(0);
      setLoading(false);

      // Pre-select the first option of each attribute so a variation is
      // matched immediately (mirrors how ProductDetail behaves).
      const initial = {};
      (data.attributes || []).forEach((attr) => {
        if (attr.terms?.length) initial[attr.name] = attr.terms[0].slug;
      });
      setSelected(initial);
    });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (loading || !product) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
        <div className="bg-white rounded-2xl p-10 text-slate-400">Loading…</div>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [{ src: "" }];
  const isVariable = product.type === "variable" && product.variations?.length;

  function findVariation() {
    if (!isVariable) return null;
    return product.variations.find((v) =>
      v.attributes.every((a) => selected[a.name] === a.value)
    );
  }

  const matchedVariation = findVariation();
  // Note: WooCommerce's Store API only includes {id, attributes} on each
  // entry in product.variations — a variation's own price/regular_price
  // isn't in this payload, only the parent product's `prices` is. So price
  // here reflects the parent product regardless of which variation is
  // selected (matches WooCommerce's own storefront behavior for a lot of
  // simple variable-price setups; if variations are priced differently,
  // that needs its own /products/{variation_id} fetch — say the word if you
  // want that added).
  const regular = Number(product.prices?.regular_price ?? product.prices?.price ?? 0);
  const current = Number(product.prices?.price ?? 0);
  const onSale = regular > current;
  const discountPct = onSale ? Math.round(((regular - current) / regular) * 100) : 0;

  async function handleAddToCart() {
    setAdding(true);
    try {
      // For a variable product, the Store API expects the *variation's own*
      // id here (variations are posts with their own id) — same pattern the
      // add-item endpoint uses for simple products.
      const idToAdd = matchedVariation ? matchedVariation.id : product.id;
      await addItem(idToAdd, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 animate-[fadeIn_0.2s_ease-out]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="grid md:grid-cols-2 gap-0">
          {/* Gallery */}
          <div className="p-6">
            <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 mb-3">
              {images[activeImage]?.src && (
                <img
                  src={images[activeImage].src}
                  alt={decodeHtml(product.name)}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                      activeImage === i ? "border-slate-900" : "border-transparent hover:border-slate-300"
                    }`}
                  >
                    <img src={img.src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-6 md:pr-8 flex flex-col">
            <h2 className="text-xl font-semibold text-slate-900 mb-1">
              {decodeHtml(product.name)}
            </h2>
            {(product.average_rating > 0 || product.review_count > 0) && (
              <div className="mb-3">
                <StarRating rating={product.average_rating} count={product.review_count} />
              </div>
            )}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg font-semibold text-slate-900">
                {formatPriceFromProduct(product)}
              </span>
              {onSale && (
                <>
                  <span className="text-base text-slate-400 line-through">
                    {formatPrice(product.prices.regular_price, product.prices.currency_minor_unit, product.prices.currency_symbol)}
                  </span>
                  <span className="text-sm font-medium text-emerald-600">
                    Save {discountPct}%
                  </span>
                </>
              )}
            </div>

            {product.short_description && (
              <div
                className="text-sm text-slate-600 mb-5 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: product.short_description }}
              />
            )}

            <div className="space-y-4 mb-6">
              {(product.attributes || []).map((attr) => (
                <div key={attr.name}>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                    {attr.name}
                  </div>
                  {attr.name.toLowerCase().includes("color") ? (
                    <ColorSwatches
                      options={attr.terms}
                      activeSlug={selected[attr.name]}
                      onSelect={(slug) => setSelected((prev) => ({ ...prev, [attr.name]: slug }))}
                      size="md"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {attr.terms.map((term) => (
                        <button
                          key={term.slug}
                          type="button"
                          onClick={() =>
                            setSelected((prev) => ({ ...prev, [attr.name]: term.slug }))
                          }
                          className={`px-3 py-1.5 text-sm rounded-lg border transition ${
                            selected[attr.name] === term.slug
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-300 text-slate-700 hover:border-slate-500"
                          }`}
                        >
                          {decodeHtml(term.name)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-auto space-y-3">
              <div className="flex items-center gap-3">
                <QuantityStepper
                  quantity={quantity}
                  onDecrease={() => setQuantity((q) => Math.max(1, q - 1))}
                  onIncrease={() => setQuantity((q) => q + 1)}
                />
                <Button variant="accent" className="flex-1" onClick={handleAddToCart} disabled={adding}>
                  {added ? "Added ✓" : adding ? "Adding…" : "Add to Cart"}
                </Button>
              </div>
              <Link
                to={`/product/${product.id}`}
                onClick={onClose}
                className="block text-center text-sm text-slate-500 hover:text-slate-900 underline underline-offset-2"
              >
                View Full Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}