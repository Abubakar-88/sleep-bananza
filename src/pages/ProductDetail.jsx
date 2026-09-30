import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getProductById } from "../api/products";
import { useCart } from "../hooks/useCart";
import { formatPriceFromProduct } from "../utils/formatPrice";
import { decodeHtml } from "../utils/decodeHtml";
import { Button } from "../components/common/Button";
import { Loader } from "../components/common/Loader";
import { RelatedProducts } from "../components/product/RelatedProducts";
import { ReviewsSection } from "../components/product/ReviewsSection";

/* ---------- helpers ---------- */

// Swatch colours for common bedding colour names. Unknown names fall back to a text chip.
const SWATCHES = {
  oatmeal: "#D9CDB8",
  sage: "#9CAF98",
  "sky blue": "#8FA5B8",
  blue: "#8FA5B8",
  ivory: "#E8E4DC",
  white: "#F4F2ED",
  cream: "#EFE6D2",
  charcoal: "#4A4A48",
  grey: "#9A9A96",
  gray: "#9A9A96",
  black: "#1F1F1E",
  blush: "#E4C4BC",
  navy: "#2F3E55",
};

const norm = (s) => String(s ?? "").trim().toLowerCase();

function isColorAttribute(attr) {
  return /colou?r/i.test(attr.name);
}

function minorToMoney(prices, value) {
  if (!prices || value == null) return "";
  const minor = Number(prices.currency_minor_unit ?? 2);
  const amount = Number(value) / 10 ** minor;
  return `${prices.currency_prefix ?? ""}${amount.toFixed(minor)}${prices.currency_suffix ?? ""}`;
}

/* ---------- small UI pieces ---------- */

function Stars({ value = 0 }) {
  const rounded = Math.round(Number(value) || 0);
  return (
    <span aria-hidden="true" className="text-amber-500 tracking-tight">
      {"★".repeat(rounded)}
      <span className="text-slate-300">{"★".repeat(5 - rounded)}</span>
    </span>
  );
}

function Gallery({ images, name }) {
  const [active, setActive] = useState(0);
  const list = images?.length ? images : [];
  const current = list[active];

  return (
    <div>
      <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden">
        {current && (
          <img
            src={current.src}
            alt={current.alt || name}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      {list.length > 1 && (
        <div className="grid grid-cols-4 gap-2 mt-2">
          {list.slice(0, 8).map((img, i) => (
            <button
              key={img.id ?? i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              className={`aspect-square rounded-md overflow-hidden bg-slate-100 border-2 ${
                i === active ? "border-slate-900" : "border-transparent"
              }`}
            >
              <img src={img.thumbnail || img.src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function OptionPicker({ attr, selected, onSelect, isOptionAvailable }) {
  const asSwatch = isColorAttribute(attr);
  return (
    <div className="mb-5">
      <p className="text-sm text-slate-600 mb-2">
        {attr.name}
        {selected && (
          <span className="text-slate-900 font-medium">
            : {attr.terms.find((t) => norm(t.slug) === norm(selected))?.name}
          </span>
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        {attr.terms.map((term) => {
          const on = norm(selected) === norm(term.slug);
          const available = isOptionAvailable(attr.name, term.slug);
          const color = SWATCHES[norm(term.name)];

          if (asSwatch && color) {
            return (
              <button
                key={term.id}
                type="button"
                title={term.name}
                aria-label={term.name}
                aria-pressed={on}
                onClick={() => onSelect(attr.name, term.slug)}
                className={`w-8 h-8 rounded-full border border-slate-300 outline-offset-2 ${
                  on ? "outline outline-2 outline-slate-900" : ""
                } ${available ? "" : "opacity-40"}`}
                style={{ backgroundColor: color }}
              />
            );
          }

          return (
            <button
              key={term.id}
              type="button"
              aria-pressed={on}
              onClick={() => onSelect(attr.name, term.slug)}
              className={`px-4 py-2 text-sm rounded-md border ${
                on
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 text-slate-700 hover:border-slate-500"
              } ${available ? "" : "opacity-40 line-through"}`}
            >
              {term.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QuantityStepper({ value, onChange }) {
  return (
    <div className="flex items-center border border-slate-300 rounded-md">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(1, value - 1))}
        className="px-3 py-2 text-slate-700 hover:bg-slate-50"
      >
        −
      </button>
      <span className="w-8 text-center text-sm" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(Math.min(10, value + 1))}
        className="px-3 py-2 text-slate-700 hover:bg-slate-50"
      >
        +
      </button>
    </div>
  );
}

function Accordion({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="border-t border-slate-200">
      {items.map((item, i) => (
        <div key={item.title} className="border-b border-slate-200">
          <button
            type="button"
            onClick={() => setOpen(open === i ? -1 : i)}
            aria-expanded={open === i}
            className="w-full flex justify-between items-center py-3 text-sm font-medium text-slate-900"
          >
            {item.title}
            <span aria-hidden="true" className="text-slate-500">
              {open === i ? "−" : "+"}
            </span>
          </button>
          {open === i && <div className="pb-4 text-sm text-slate-600">{item.content}</div>}
        </div>
      ))}
    </div>
  );
}

function TrustList() {
  const rows = [
    ["Free shipping on orders over $75", "Estimated delivery 5-8 business days"],
    ["30-day free returns", "Unused items in original packaging"],
    ["Made with care for the planet", "Organic materials and low-impact dyes"],
  ];
  return (
    <ul className="bg-slate-50 rounded-lg p-4 space-y-3 mb-6">
      {rows.map(([title, sub]) => (
        <li key={title}>
          <p className="text-sm font-medium text-slate-900">{title}</p>
          <p className="text-xs text-slate-500">{sub}</p>
        </li>
      ))}
    </ul>
  );
}

/* ---------- page ---------- */

export function ProductDetail() {
  const { id } = useParams();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState({}); // { [attributeName]: termSlug }
  const [error, setError] = useState("");
  const [showSticky, setShowSticky] = useState(false);
  const buyBoxRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setSelected({});
    setQuantity(1);
    setError("");
    getProductById(id)
      .then(setProduct)
      .finally(() => setLoading(false));
  }, [id]);

  // Show the mobile sticky bar once the main buy box scrolls out of view.
  useEffect(() => {
    const el = buyBoxRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setShowSticky(!entry.isIntersecting), {
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [product]);

  const variationAttrs = useMemo(
    () => (product?.attributes ?? []).filter((a) => a.has_variations && a.terms?.length),
    [product]
  );

  const variations = product?.variations ?? [];

  // The variation that matches every chosen option, if all options are picked.
  const matchedVariation = useMemo(() => {
    if (!variationAttrs.length) return null;
    if (variationAttrs.some((a) => !selected[a.name])) return null;
    return (
      variations.find((v) =>
        v.attributes.every((va) => !va.value || norm(selected[va.name]) === norm(va.value))
      ) ?? null
    );
  }, [variationAttrs, variations, selected]);

  // Greys out options that can't be combined with what is already selected.
  function isOptionAvailable(attrName, slug) {
    if (!variations.length) return true;
    return variations.some((v) =>
      v.attributes.every((va) => {
        if (!va.value) return true;
        const pick = va.name === attrName ? slug : selected[va.name];
        return !pick || norm(pick) === norm(va.value);
      })
    );
  }

  function handleSelect(name, slug) {
    setSelected((s) => ({ ...s, [name]: s[name] === slug ? undefined : slug }));
    setError("");
    setAdded(false);
  }

  if (loading) return <Loader label="Loading product..." />;
  if (!product) return <p className="text-slate-500">Product not found.</p>;

  const needsOptions = variationAttrs.length > 0;
  const missing = variationAttrs.find((a) => !selected[a.name]);
  const inStock = product.is_in_stock !== false;
  const onSale = product.on_sale && product.prices?.regular_price !== product.prices?.price;
  const name = decodeHtml(product.name);
  const rating = Number(product.average_rating) || 0;
  const reviewCount = Number(product.review_count) || 0;

  async function handleAddToCart() {
    if (missing) {
      setError(`Select a ${missing.name.toLowerCase()}`);
      return;
    }
    setAdding(true);
    setError("");
    try {
      if (needsOptions) {
        if (!matchedVariation) {
          setError("That combination isn't available. Try another option.");
          return;
        }
        // Store API expects the variation id plus the chosen attributes.
        await addItem(
          matchedVariation.id,
          quantity,
          variationAttrs.map((a) => ({ attribute: a.name, value: selected[a.name] }))
        );
      } else {
        await addItem(product.id, quantity);
      }
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } finally {
      setAdding(false);
    }
  }

  const buttonLabel = !inStock ? "Out of stock" : adding ? "Adding..." : added ? "Added to cart" : "Add to cart";

  const accordionItems = [
    {
      title: "Description",
      content: (
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: product.description || product.short_description }}
        />
      ),
    },
    {
      title: "Materials and care",
      content: (
        <ul className="list-disc pl-5 space-y-1">
          <li>Add fabric details from your product data or ACF field</li>
          <li>Machine wash cold, tumble dry low</li>
        </ul>
      ),
    },
    {
      title: "Shipping and returns",
      content: (
        <p>
          Orders ship within 1-2 business days. Free returns within 30 days on unused items in their
          original packaging.
        </p>
      ),
    },
  ];

  return (
    <>
      <div className="grid md:grid-cols-2 gap-10">
        <Gallery images={product.images} name={name} />

        <div>
          {product.categories?.[0] && (
            <p className="text-xs text-slate-500 mb-1">{decodeHtml(product.categories[0].name)}</p>
          )}
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">{name}</h1>

          {reviewCount > 0 && (
            <a href="#reviews" className="inline-flex items-center gap-2 text-sm mb-3">
              <Stars value={rating} />
              <span className="text-slate-500">
                {rating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
              </span>
            </a>
          )}

          <div className="flex items-baseline gap-3 mb-5">
            <span className="text-xl font-medium text-slate-900">{formatPriceFromProduct(product)}</span>
            {onSale && (
              <span className="text-sm text-slate-400 line-through">
                {minorToMoney(product.prices, product.prices.regular_price)}
              </span>
            )}
          </div>

          {product.short_description && (
            <div
              className="text-sm text-slate-600 mb-6 prose prose-sm"
              dangerouslySetInnerHTML={{ __html: product.short_description }}
            />
          )}

          <div ref={buyBoxRef}>
            {variationAttrs.map((attr) => (
              <OptionPicker
                key={attr.id ?? attr.name}
                attr={attr}
                selected={selected[attr.name]}
                onSelect={handleSelect}
                isOptionAvailable={isOptionAvailable}
              />
            ))}

            <div className="flex items-stretch gap-3 mb-2">
              <QuantityStepper value={quantity} onChange={setQuantity} />
              <Button onClick={handleAddToCart} disabled={adding || !inStock} className="flex-1">
                {buttonLabel}
              </Button>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600 mb-2">
                {error}
              </p>
            )}

            <p className={`text-sm mb-6 ${inStock ? "text-emerald-700" : "text-red-600"}`}>
              {!inStock
                ? "Currently out of stock"
                : product.low_stock_remaining
                ? `Only ${product.low_stock_remaining} left in stock`
                : "In stock. Ships in 1-2 business days"}
            </p>
          </div>

          <TrustList />
          <Accordion items={accordionItems} />
        </div>
      </div>

      <ReviewsSection productId={product.id} />

      <RelatedProducts product={product} />

      {/* Mobile sticky add to cart */}
      {showSticky && inStock && (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 px-4 py-3 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900 truncate">{name}</p>
            <p className="text-xs text-slate-500">{formatPriceFromProduct(product)}</p>
          </div>
          <Button onClick={handleAddToCart} disabled={adding}>
            {missing ? `Select ${missing.name.toLowerCase()}` : buttonLabel}
          </Button>
        </div>
      )}
    </>
  );
}