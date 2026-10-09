import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { decodeHtml } from "../../utils/decodeHtml";
import { formatPrice } from "../../utils/formatPrice";
import { Stars } from "../home/primitives";

/*
  Product card for collection pages and product carousels.
  Everything comes from the WooCommerce Store API product:
  badge = first product tag (or "Sale"), price / "From" price, rating, colour swatches.
  Swatch colours: Products → Attributes → (Color) → Configure terms → Edit → "Swatch colour".
*/
export function CollectionProductCard({ product, swatches = {}, eager = false }) {
  const [img1, img2] = product.images || [];
  const name = decodeHtml(product.name);
  const to = `/product/${product.id}`;
  const badge = product.on_sale ? "Sale" : product.tags?.[0]?.name ? decodeHtml(product.tags[0].name) : null;
  const colors = colorTerms(product, swatches);
  const rating = Number(product.average_rating || 0);
  const reviews = Number(product.review_count || 0);

  return (
    <article className="group">
      <Link to={to} className="block relative aspect-[4/5] overflow-hidden bg-[#F4F1EC]" aria-label={name}>
        {/* photo zooms out slowly when the card scrolls into view */}
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.15 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        >
        {img1?.src && (
          <img
            src={img1.src}
            srcSet={img1.srcset || undefined}
            sizes="(min-width: 1024px) 30vw, 50vw"
            alt={img1.alt || name}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            className={`absolute inset-0 w-full h-full object-cover transition duration-700 ease-out group-hover:scale-[1.04] ${
              img2?.src ? "group-hover:opacity-0" : ""
            }`}
          />
        )}
        {img2?.src && (
          <img
            src={img2.src}
            srcSet={img2.srcset || undefined}
            sizes="(min-width: 1024px) 30vw, 50vw"
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover opacity-0 transition duration-700 ease-out group-hover:opacity-100"
          />
        )}
        </motion.div>
        {badge && (
          <span className="absolute top-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/85 backdrop-blur px-2.5 py-1 text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1D2A4D]">
            {badge}
          </span>
        )}
        {!product.is_in_stock && product.is_in_stock !== undefined && (
          <span className="absolute bottom-3 left-3 bg-[#1D2A4D] text-white px-2 py-1 text-[10px] uppercase tracking-wider">Sold out</span>
        )}
      </Link>

      <div className="pt-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-3">
        <Link to={to} className="font-serif text-[15px] md:text-base leading-snug text-[#1D2A4D] hover:underline underline-offset-4 line-clamp-2">
          {name}
        </Link>
        <Price product={product} />
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 min-h-[18px]">
        {rating > 0 ? (
          <span className="flex items-center gap-1 text-[11px] text-[#5B6478]">
            <Stars rating={rating} className="text-[12px]" />
            {reviews > 0 && <span>({reviews})</span>}
          </span>
        ) : (
          <span />
        )}
        {colors.length > 0 && <Swatches colors={colors} to={to} />}
      </div>
    </article>
  );
}

function Price({ product }) {
  const pr = product.prices || {};
  const minor = pr.currency_minor_unit ?? 2;
  const sym = pr.currency_symbol ?? "$";
  const range = pr.price_range;
  if (range && range.min_amount !== range.max_amount) {
    return <span className="shrink-0 text-sm text-[#5B6478] whitespace-nowrap sm:text-right">From {formatPrice(range.min_amount, minor, sym)}</span>;
  }
  const onSale = product.on_sale && pr.regular_price && pr.regular_price !== pr.price;
  return (
    <span className="shrink-0 text-sm whitespace-nowrap sm:text-right">
      {onSale && <s className="sm:block mr-1.5 sm:mr-0 text-xs text-[#5B6478]/70">{formatPrice(pr.regular_price, minor, sym)}</s>}
      <span className={onSale ? "text-[#B4412F]" : "text-[#5B6478]"}>{formatPrice(pr.price, minor, sym)}</span>
    </span>
  );
}

function Swatches({ colors, to, max = 6 }) {
  const shown = colors.slice(0, max);
  return (
    <span className="flex items-center gap-1">
      {shown.map((c) => (
        <Link
          key={c.slug}
          to={`${to}?attribute_${c.taxonomy}=${encodeURIComponent(c.slug)}`}
          title={c.name}
          aria-label={c.name}
          className="w-3.5 h-3.5 rounded-sm ring-1 ring-black/10 hover:ring-[#1D2A4D] transition"
          style={{ background: c.color || "#d9d4cc" }}
        />
      ))}
      {colors.length > max && <span className="text-[11px] text-[#5B6478]">+{colors.length - max}</span>}
    </span>
  );
}

const isColorAttr = (a) => /colou?r/i.test(`${a.taxonomy || ""} ${a.name || ""}`);

// [{ slug, name, taxonomy, color }] for the product's colour attribute
export function colorTerms(product, swatches = {}) {
  const attr = (product.attributes || []).find(isColorAttr);
  if (!attr) return [];
  return (attr.terms || []).map((t) => ({
    slug: t.slug,
    name: decodeHtml(t.name),
    taxonomy: attr.taxonomy,
    color: swatchColor(attr.taxonomy, t, swatches),
  }));
}

export function swatchColor(taxonomy, term, swatches = {}) {
  const own = swatches?.[taxonomy]?.[term.slug];
  if (own) return own;
  // fall back to the colour name itself ("navy", "light-blue" → lightblue) when the browser knows it
  const guess = String(term.slug || term.name || "").replace(/[-\s]/g, "").toLowerCase();
  return typeof CSS !== "undefined" && CSS.supports?.("color", guess) ? guess : null;
}

export { isColorAttr };