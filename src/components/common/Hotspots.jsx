import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { getProducts } from "../../api/products";
import { decodeHtml } from "../../utils/decodeHtml";
import { formatPrice } from "../../utils/formatPrice";

const EASE = [0.22, 1, 0.36, 1];

/* Shared "shop the look" pieces: product hotspots on an object-cover image.
   Used by the home Shop the Look banner, the Personalize page and collection pages. */

// Loads the WooCommerce products behind a list of hotspots: { [id]: product }
export function useHotspotProducts(hotspots) {
  const key = (hotspots || []).map((h) => h.productId).join(",");
  const ids = useMemo(() => [...new Set(key ? key.split(",") : [])], [key]);
  const [products, setProducts] = useState({});

  useEffect(() => {
    if (!ids.length) return;
    let alive = true;
    getProducts({ include: ids.join(","), per_page: ids.length })
      .then((list) => {
        if (!alive) return;
        const map = {};
        (list || []).forEach((p) => (map[p.id] = p));
        setProducts(map);
      })
      .catch((e) => console.error("Hotspot products failed:", e));
    return () => {
      alive = false;
    };
  }, [ids]);

  return products;
}

// Where a point of the original image (x%, y%) lands inside an object-fit: cover box.
// Admin places hotspots on the full image; the box crops it differently per screen size.
const FOCUS = { center: [0.5, 0.5], top: [0.5, 0], bottom: [0.5, 1], left: [0, 0.5], right: [1, 0.5] };
export function useCoverMapping(ref, image, maxCard = 300) {
  const [box, setBox] = useState(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return (spot) => {
    if (!box || !image?.width || !image?.height) {
      return { left: `${spot.x}%`, top: `${spot.y}%`, visible: true, below: spot.y < 35, cardOffset: -24, cardW: maxCard };
    }
    const scale = Math.max(box.w / image.width, box.h / image.height);
    const rw = image.width * scale;
    const rh = image.height * scale;
    const [fx, fy] = FOCUS[image.position] || FOCUS.center;
    const left = (box.w - rw) * fx + (spot.x / 100) * rw;
    const top = (box.h - rh) * fy + (spot.y / 100) * rh;
    const visible = left > 12 && left < box.w - 12 && top > 12 && top < box.h - 12;
    // keep the product card fully inside the image (important on phones)
    const cardW = Math.min(maxCard, box.w - 16);
    const cardLeft = Math.min(Math.max(left - 24, 8), box.w - cardW - 8);
    return { left, top, visible, below: top < box.h * 0.4, cardOffset: cardLeft - left, cardW };
  };
}

export function Hotspot({ pos, product, open, onToggle, index }) {
  if (!pos.visible) return null; // point is cropped out on this screen size
  const below = pos.below;

  return (
    <div className={`absolute ${open ? "z-20" : "z-10"}`} style={{ left: pos.left, top: pos.top }}>
      <motion.button
        type="button"
        onClick={onToggle}
        aria-label={open ? "Close product" : `Show product ${index + 1}`}
        aria-expanded={open}
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 + index * 0.12, type: "spring", stiffness: 300, damping: 18 }}
        className="relative -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 text-[#1D2A4D] shadow-lg flex items-center justify-center"
      >
        {!open && <span className="absolute inset-0 rounded-full bg-white/70 animate-ping" />}
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }} className="relative text-xl leading-none font-light">
          +
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: below ? -8 : 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: below ? -8 : 8, scale: 0.97 }}
            transition={{ duration: 0.22, ease: EASE }}
            style={{ left: pos.cardOffset, width: pos.cardW }}
            className={`absolute bg-white rounded-lg shadow-2xl p-3 flex gap-3 ${below ? "top-6" : "bottom-6"}`}
          >
            {product ? <ProductMini product={product} /> : <div className="h-20 w-full animate-pulse bg-slate-100 rounded" />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function productPriceLabel(product) {
  const pr = product?.prices || {};
  const minor = pr.currency_minor_unit ?? 2;
  const sym = pr.currency_symbol ?? "$";
  const range = pr.price_range;
  if (range && range.min_amount !== range.max_amount) {
    return `${formatPrice(range.min_amount, minor, sym)} – ${formatPrice(range.max_amount, minor, sym)}`;
  }
  return formatPrice(pr.price, minor, sym);
}

export function ProductMini({ product }) {
  const img = product.images?.[0];
  return (
    <>
      <Link to={`/product/${product.id}`} className="shrink-0 w-20 h-20 rounded-md overflow-hidden bg-slate-100">
        {img?.src && <img src={img.thumbnail || img.src} alt={decodeHtml(product.name)} className="w-full h-full object-cover" />}
      </Link>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#1D2A4D] leading-snug line-clamp-2">{decodeHtml(product.name)}</p>
        <p className="mt-1 text-sm text-[#5B6478]">{productPriceLabel(product)}</p>
        <Link
          to={`/product/${product.id}`}
          className="inline-block mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#1D2A4D] underline underline-offset-4"
        >
          Shop now
        </Link>
      </div>
    </>
  );
}

/* One image with hotspots, filling its box (give the box a height via className). */
export function LookImage({ image, hotspots = [], className = "", firstOpen = false }) {
  const boxRef = useRef(null);
  const place = useCoverMapping(boxRef, image, 280);
  const products = useHotspotProducts(hotspots);
  const [openIndex, setOpenIndex] = useState(firstOpen ? 0 : -1);
  if (!image?.src) return null;

  return (
    <div ref={boxRef} className={`relative overflow-hidden bg-[#EFEAE3] ${className}`}>
      <motion.img
        src={image.src}
        srcSet={image.srcset || undefined}
        sizes="(min-width: 768px) 55vw, 100vw"
        alt={image.alt || ""}
        loading="lazy"
        decoding="async"
        initial={{ scale: 1.05 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1.4, ease: EASE }}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: image.position || "center" }}
      />
      {hotspots.map((h, i) => (
        <Hotspot
          key={`${h.productId}-${i}`}
          pos={place(h)}
          product={products[h.productId]}
          open={openIndex === i}
          onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
          index={i}
        />
      ))}
    </div>
  );
}

/* Two "shop the look" images side by side (stacked on phones). */
export function LookPair({ looks = [], className = "" }) {
  const list = looks.filter((l) => l?.image?.src);
  if (!list.length) return null;
  return (
    <div className={`grid gap-4 md:gap-6 ${list.length > 1 ? "md:grid-cols-[1.35fr_1fr]" : ""} ${className}`}>
      {list.map((l, i) => (
        <LookImage key={i} image={l.image} hotspots={l.hotspots} className="h-[110vw] max-h-[620px] sm:h-[70vw] md:h-[560px]" />
      ))}
    </div>
  );
}
