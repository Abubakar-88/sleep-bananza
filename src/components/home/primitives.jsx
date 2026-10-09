import { Children, useCallback, useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

// ---- Design tokens (kept here so the whole home page shares one palette) ----
export const ink = "text-[#1D2A4D]";
export const muted = "text-[#5B6478]";
export const EASE = [0.22, 1, 0.36, 1];

// ---- Helpers ----
export function stripHtml(html = "") {
  if (typeof document === "undefined") return html.replace(/<[^>]+>/g, "");
  const el = document.createElement("div");
  el.innerHTML = html;
  return (el.textContent || "").trim();
}

export function productImage(product, index = 0) {
  const imgs = product?.images || [];
  return imgs[index]?.src || imgs[0]?.src || "";
}

// <img> props for a WooCommerce image object: full-size src + srcset so the
// browser downloads a sharp size for the slot (and 2x on retina screens).
export function wcImgProps(image, sizes) {
  if (!image?.src) return {};
  return { src: image.src, srcSet: image.srcset || undefined, sizes: image.srcset ? sizes : undefined };
}

// ---- Image size handling ----
// Supplier photos are often only 600–1000px wide. Stretching them across a
// 1900px hero makes them pixelated, so every image is measured first:
//   - wide enough  -> shown full-bleed ("cover")
//   - too small    -> shown at its own size as a sharp card on a gradient ("framed")
const widthCache = new Map();
export function measure(src) {
  if (!src) return Promise.resolve(0);
  if (widthCache.has(src)) return widthCache.get(src);
  const p = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth || 0);
    img.onerror = () => resolve(0);
    img.src = src;
  });
  widthCache.set(src, p);
  return p;
}

// Largest distinct images from a candidate list -> [{ src, width }]
export function useImagePicks(candidates, count = 4) {
  const key = [...new Set(candidates.filter(Boolean))].join("|");
  const [result, setResult] = useState({ key: null, list: [] });

  useEffect(() => {
    let alive = true;
    const list = key ? key.split("|") : [];
    Promise.all(list.map(measure)).then((widths) => {
      if (!alive) return;
      const picks = list
        .map((src, i) => ({ src, width: widths[i] }))
        .filter((x) => x.width > 0)
        .sort((a, b) => b.width - a.width)
        .slice(0, count);
      setResult({ key, list: picks });
    });
    return () => {
      alive = false;
    };
  }, [key, count]);

  return result.key === key ? result.list : [];
}

// One specific image -> { src, width }
// Accepts a WordPress image object ({ src, width }) or a plain URL string.
export function useMeasured(input) {
  const known = input && typeof input === "object" ? input : null;
  const src = known ? known.src : input || "";
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (known?.width) return; // WordPress already told us the size
    let alive = true;
    setWidth(0);
    measure(src).then((w) => {
      if (alive) setWidth(w);
      if (w && w < COVER_MIN_WIDTH) {
        console.warn(`[home] ${src} is only ${w}px wide — it will be shown as a card. Use 1600px+ (ideally 2400px) for a full-width photo.`);
      }
    });
    return () => {
      alive = false;
    };
  }, [src, known?.width]);
  if (!src) return null;
  return { ...(known || {}), src, width: known?.width || width };
}

// Display mode chosen in WP Admin → Home Page ("auto" | "cover" | "contain")
// auto = cover when the image is wide enough, otherwise a sharp framed card
export function imageMode(image, minCover = COVER_MIN_WIDTH) {
  if (!image?.src) return "none";
  if (image.fit === "cover" || image.fit === "contain") return image.fit;
  if (!image.width) return "cover"; // size not known yet
  return image.width >= minCover ? "cover" : "framed";
}

const POSITIONS = { center: "50% 50%", top: "50% 0%", bottom: "50% 100%", left: "0% 50%", right: "100% 50%" };
export const objectPosition = (image) => POSITIONS[image?.position] || POSITIONS.center;

export const COVER_MIN_WIDTH = 1600;
export const isCoverQuality = (image, min = COVER_MIN_WIDTH) => Boolean(image?.src && image.width >= min);

// Small image shown sharp at (at most) its own pixel size, as a card
export function FramedImage({ src, width, className = "" }) {
  return (
    <div className={`absolute inset-0 flex items-start md:items-center justify-center md:justify-end p-6 pt-10 md:p-10 md:pr-[7%] ${className}`}>
      <img
        src={src}
        alt=""
        decoding="async"
        style={{ maxWidth: width || undefined }}
        className="w-[70%] md:w-[44%] max-h-[46%] md:max-h-[82%] object-contain rounded-2xl shadow-2xl bg-white"
      />
    </div>
  );
}

export const FALLBACK_GRADIENT = "linear-gradient(135deg, #1D2A4D 0%, #3E4F9B 55%, #8E9BD6 100%)";

// ---- Fade-up on scroll ----
export function Reveal({ children, delay = 0, y = 28, className = "" }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

// Staggered children on scroll
const groupVariants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};
export function RevealGroup({ children, className = "" }) {
  return (
    <motion.div
      className={className}
      variants={groupVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
    >
      {children}
    </motion.div>
  );
}
export function RevealItem({ children, className = "" }) {
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

// ---- Parallax image: the image moves slower than the page scroll ----
export function ParallaxImage({ src, width, fit, position, minCover = COVER_MIN_WIDTH, alt = "", strength = 70, className = "", children, framedBg }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const raw = useTransform(scrollYProgress, [0, 1], [-strength, strength]);
  const y = useSpring(raw, { stiffness: 140, damping: 30, mass: 0.3 });
  const cardY = useTransform(y, (v) => v * 0.3); // gentler drift so a framed card never gets cut off
  const image = src ? { src, width, fit, position } : null;
  const mode = imageMode(image, minCover);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {mode === "framed" ? (
        <>
          <div className="absolute inset-0" style={{ background: framedBg || FALLBACK_GRADIENT }} />
          <motion.div className="absolute inset-0" style={{ y: reduce ? 0 : cardY }}>
            <FramedImage src={src} width={width} />
          </motion.div>
        </>
      ) : mode === "contain" ? (
        <>
          <div className="absolute inset-0" style={{ background: framedBg || FALLBACK_GRADIENT }} />
          <motion.img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            style={{ y: reduce ? 0 : cardY, objectPosition: objectPosition(image) }}
            className="absolute inset-0 w-full h-full object-contain"
          />
        </>
      ) : src ? (
        <motion.img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          style={{
            y: reduce ? 0 : y,
            top: -strength,
            height: `calc(100% + ${strength * 2}px)`,
            objectPosition: objectPosition(image),
          }}
          className="absolute left-0 w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0" style={{ background: FALLBACK_GRADIENT }} />
      )}
      {children}
    </div>
  );
}

// ---- Section heading ----
export function SectionHeading({ eyebrow, title, emphasis, subtitle, className = "" }) {
  return (
    <Reveal className={`text-center ${className}`}>
      {eyebrow && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5B6478] mb-3">
          {eyebrow}
        </p>
      )}
      <h2 className={`text-3xl md:text-4xl font-semibold tracking-tight ${ink}`}>
        {title} {emphasis && <em className="font-serif italic font-medium">{emphasis}</em>}
      </h2>
      {subtitle && <p className={`mt-3 max-w-xl mx-auto ${muted}`}>{subtitle}</p>}
    </Reveal>
  );
}

// ---- Pill tabs with a sliding active background ----
export function PillTabs({ tabs, active, onChange, id }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {tabs.map((t) => {
        const isActive = t.value === active;
        return (
          <button
            key={String(t.value)}
            type="button"
            onClick={() => onChange(t.value)}
            className={`relative px-4 py-1.5 text-sm rounded-full border transition-colors ${
              isActive ? "border-transparent text-[#1D2A4D]" : "border-[#D9DCE5] text-[#5B6478] hover:text-[#1D2A4D]"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId={`pill-${id}`}
                className="absolute inset-0 rounded-full bg-[#DCE2F4]"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ---- Horizontal snap carousel with arrows (touch-swipe on mobile) ----
export function Carousel({ children, itemClassName = "", arrowTop = "40%", className = "", bleed = false }) {
  const ref = useRef(null);
  const [edges, setEdges] = useState({ prev: false, next: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({
      prev: el.scrollLeft > 4,
      next: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update, children]);

  const go = (dir) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <div className={`relative ${className}`}>
      <div
        ref={ref}
        className={`flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 [&::-webkit-scrollbar]:hidden ${
          bleed ? "px-4 md:px-8 scroll-pl-4 md:scroll-pl-8" : ""
        }`}
        style={{ scrollbarWidth: "none" }}
      >
        {Children.map(children, (child) =>
          child ? <div className={`snap-start shrink-0 ${itemClassName}`}>{child}</div> : null
        )}
      </div>
      <ArrowButton side="left" show={edges.prev} onClick={() => go(-1)} top={arrowTop} inset={bleed} />
      <ArrowButton side="right" show={edges.next} onClick={() => go(1)} top={arrowTop} inset={bleed} />
    </div>
  );
}

function ArrowButton({ side, show, onClick, top, inset }) {
  return (
    <button
      type="button"
      aria-label={side === "left" ? "Previous" : "Next"}
      onClick={onClick}
      style={{ top }}
      className={`hidden md:flex absolute -translate-y-1/2 ${
        side === "left" ? (inset ? "left-4 md:left-6" : "-left-4") : inset ? "right-4 md:right-6" : "-right-4"
      } w-10 h-10 items-center justify-center rounded-full bg-white text-[#1D2A4D] shadow-lg transition-all duration-300 hover:scale-110 ${
        show ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {side === "left" ? "‹" : "›"}
    </button>
  );
}

// ---- Stars ----
export function Stars({ rating = 5, className = "" }) {
  const full = Math.round(Number(rating));
  return (
    <span className={`text-[#E7A93B] tracking-tight ${className}`} aria-label={`${rating} out of 5 stars`}>
      {"★★★★★".slice(0, full)}
      <span className="text-[#D9DCE5]">{"★★★★★".slice(full)}</span>
    </span>
  );
}

// ---- Number that counts up when it scrolls into view ----
export function CountUp({ value, decimals = 0, suffix = "", className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, Number(value) || 0, {
      duration: 1.6,
      ease: EASE,
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

// Centered inner container used by every section (page itself is full width)
export function Container({ children, className = "" }) {
  return <div className={`mx-auto w-full max-w-[1440px] px-4 md:px-8 ${className}`}>{children}</div>;
}

// Full-width wrapper that breaks out of the page container
export function FullBleed({ children, className = "" }) {
  return (
    <div className={className} style={{ width: "100vw", marginLeft: "calc(50% - 50vw)" }}>
      {children}
    </div>
  );
}
