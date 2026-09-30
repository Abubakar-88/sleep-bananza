import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getRelatedProducts } from "../../api/products";
import { formatPriceFromProduct } from "../../utils/formatPrice";
import { decodeHtml } from "../../utils/decodeHtml";

function Arrow({ direction, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "Previous products" : "Next products"}
      className="w-9 h-9 rounded-full border border-slate-300 text-slate-700 flex items-center justify-center transition-colors hover:border-slate-900 disabled:opacity-30 disabled:hover:border-slate-300"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d={direction === "prev" ? "M10 3L5 8l5 5" : "M6 3l5 5-5 5"}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export function RelatedProducts({ product, title = "Complete your sleep set", limit = 8 }) {
  const [items, setItems] = useState([]);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const trackRef = useRef(null);
  const raf = useRef(0);

  useEffect(() => {
    let cancelled = false;
    setItems([]);
    getRelatedProducts(product, limit)
      .then((list) => {
        if (!cancelled) setItems(list);
      })
      .catch((err) => {
        console.error("getRelatedProducts failed:", err);
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [product?.id, limit]);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  // Recalculate when items load, on scroll, and when the window resizes.
  useEffect(() => {
    updateArrows();
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(updateArrows);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateArrows);
      cancelAnimationFrame(raf.current);
    };
  }, [items, updateArrows]);

  function slide(dir) {
    const el = trackRef.current;
    if (!el) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({
      left: dir * el.clientWidth * 0.9,
      behavior: reduce ? "auto" : "smooth",
    });
  }

  if (!items.length) return null;

  return (
    <section className="mt-16 border-t border-slate-200 pt-8" aria-label={title}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {(canPrev || canNext) && (
          <div className="flex gap-2">
            <Arrow direction="prev" onClick={() => slide(-1)} disabled={!canPrev} />
            <Arrow direction="next" onClick={() => slide(1)} disabled={!canNext} />
          </div>
        )}
      </div>

      <ul
        ref={trackRef}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((p) => {
          const img = p.images?.[0];
          const name = decodeHtml(p.name);
          return (
            <li
              key={p.id}
              className="snap-start shrink-0 basis-[calc((100%-1rem)/2)] sm:basis-[calc((100%-2rem)/3)] lg:basis-[calc((100%-3rem)/4)]"
            >
              <Link to={`/products/${p.id}`} className="group block" draggable={false}>
                <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden mb-2">
                  {img && (
                    <img
                      src={img.thumbnail || img.src}
                      alt={img.alt || name}
                      loading="lazy"
                      draggable={false}
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                    />
                  )}
                </div>
                <p className="text-sm text-slate-900 line-clamp-2">{name}</p>
                <p className="text-sm text-slate-500">{formatPriceFromProduct(p)}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}