import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, MotionConfig, motion, useScroll, useTransform } from "framer-motion";
import { getProducts } from "../../api/products";
import { Carousel, EASE, FullBleed, Reveal } from "../home/primitives";
import { CollectionProductCard } from "../collection/CollectionProductCard";

/* Sections shared by the Personalize page and collection pages.
   All text/images come from WP Admin (Personalize Page / Collection Pages). */

/* Spans the whole browser width even when the Layout wraps pages in a max-width container */
export function FullWidthPage({ children, className = "" }) {
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.overflowX;
    html.style.overflowX = "clip"; // hide the tiny 100vw overflow when a scrollbar is visible
    return () => {
      html.style.overflowX = prev;
    };
  }, []);
  return (
    <MotionConfig reducedMotion="user">
      <div className={`bg-[#FBF9F6] text-[#1D2A4D] ${className}`} style={{ width: "100vw", position: "relative", left: "50%", marginLeft: "-50vw" }}>
        {children}
      </div>
    </MotionConfig>
  );
}

export const btnOutline =
  "inline-block border border-[#1D2A4D] text-[#1D2A4D] text-[11px] font-semibold uppercase tracking-[0.18em] px-6 py-3 transition-colors hover:bg-[#1D2A4D] hover:text-white";

/* Full-width hero with centered text. Without an image it becomes a soft beige band. */
export function PageHero({ eyebrow, title, text, image, className = "h-[46vh] min-h-[340px] max-h-[520px]" }) {
  const hasImg = Boolean(image?.src);
  const ref = useRef(null);
  // as the page scrolls down: photo drifts slowly, text rises and fades
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <FullBleed>
      <div ref={ref} className={`relative overflow-hidden flex items-center justify-center ${hasImg ? "bg-[#2a241f]" : "bg-[#EFE9E1]"} ${className}`}>
        {hasImg && (
          <>
            <motion.div style={{ y: imgY }} className="absolute inset-x-0 -top-[10%] h-[120%]">
              <motion.img
                src={image.src}
                srcSet={image.srcset || undefined}
                sizes="100vw"
                alt={image.alt || ""}
                initial={{ scale: 1.12 }}
                animate={{ scale: 1 }}
                transition={{ duration: 2.2, ease: EASE }}
                className="w-full h-full object-cover"
                style={{ objectPosition: image.position || "center" }}
              />
            </motion.div>
            <div className="absolute inset-0 bg-black/30" />
          </>
        )}
        <motion.div style={{ y: textY, opacity: textOpacity }} className="relative">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.18, delayChildren: 0.2 } } }}
            className={`text-center px-6 max-w-2xl ${hasImg ? "text-white" : "text-[#1D2A4D]"}`}
          >
            {eyebrow && (
              <motion.p variants={heroItem} className={`font-serif italic text-base md:text-lg ${hasImg ? "text-white/90" : "text-[#5B6478]"}`}>
                {eyebrow}
              </motion.p>
            )}
            {title && (
              <motion.h1 variants={heroItem} className="font-serif text-4xl md:text-6xl leading-tight mt-1">
                {title}
              </motion.h1>
            )}
            {text && (
              <motion.p variants={heroItem} className={`mt-3 text-sm md:text-base whitespace-pre-line ${hasImg ? "text-white/90" : "text-[#5B6478]"}`}>
                {text}
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      </div>
    </FullBleed>
  );
}

const heroItem = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 1.1, ease: EASE } },
};

/* Full-width page content area (no narrow max-width box) */
export function Wide({ children, className = "" }) {
  return <div className={`w-full max-w-[1920px] mx-auto px-4 md:px-8 lg:px-12 ${className}`}>{children}</div>;
}

/* Two images flush to the page edge + text, like the reference.
   reverse = text left, images right. One image also works. */
export function SplitFeature({ content, reverse = false }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const slow = useTransform(scrollYProgress, [0, 1], [30, -30]);
  const fast = useTransform(scrollYProgress, [0, 1], [90, -60]);

  if (!content?.title && !content?.text) return null;
  const imgs = [content.image, content.image2].filter((i) => i?.src);

  const text = (
    <Reveal className={`max-w-md ${imgs.length ? "" : "mx-auto text-center"}`}>
      <h2 className="font-serif text-3xl md:text-4xl lg:text-[44px] leading-[1.15] text-[#1D2A4D]">{content.title}</h2>
      {content.text && <p className="mt-5 text-[15px] leading-relaxed text-[#5B6478] whitespace-pre-line">{content.text}</p>}
      {content.ctaLabel && (
        <Link to={content.ctaTo || "/collection/all"} className={`${btnOutline} mt-8`}>
          {content.ctaLabel}
        </Link>
      )}
    </Reveal>
  );

  if (!imgs.length) return <section className="py-16 md:py-24 px-6">{text}</section>;

  const Img = ({ img, className, style }) => (
    <motion.div style={style} className={`overflow-hidden bg-[#EFEAE3] ${className}`}>
      <img
        src={img.src}
        srcSet={img.srcset || undefined}
        sizes="(min-width: 768px) 35vw, 60vw"
        alt={img.alt || ""}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover"
        style={{ objectPosition: img.position || "center" }}
      />
    </motion.div>
  );

  const images = (
    <div className={`flex items-start gap-3 md:gap-6 ${reverse ? "justify-end" : ""}`}>
      {imgs.length === 2 ? (
        <>
          <Img img={imgs[0]} style={{ y: slow }} className="w-[54%] md:w-[46%] aspect-[3/4]" />
          <Img img={imgs[1]} style={{ y: fast }} className="w-[42%] md:w-[36%] aspect-[4/5] mt-[22%] md:mt-[16%]" />
        </>
      ) : (
        <Img img={imgs[0]} style={{ y: slow }} className="w-full max-w-[640px] aspect-[4/5]" />
      )}
    </div>
  );

  return (
    <section ref={ref} className="py-14 md:py-24 overflow-hidden">
      <div className="grid md:grid-cols-12 items-center gap-y-12">
        <div className={`md:col-span-7 ${reverse ? "md:order-2 pl-4 md:pl-0" : "pr-4 md:pr-0"}`}>{images}</div>
        <div className={`md:col-span-5 px-6 md:px-12 lg:px-20 ${reverse ? "md:order-1 md:justify-self-end" : ""}`}>{text}</div>
      </div>
    </section>
  );
}

/* Horizontal product carousel. source = { ids, tagId, categoryId } from WP admin; empty = featured. */
export function ProductRail({ title, linkLabel, linkTo, source = {}, swatches, exclude = [] }) {
  const [products, setProducts] = useState(null);
  const key = JSON.stringify([source?.ids, source?.tagId, source?.categoryId]);

  useEffect(() => {
    let alive = true;
    const s = source || {};
    const params = { per_page: 12 };
    if (s.ids?.length) Object.assign(params, { include: s.ids.join(","), per_page: s.ids.length });
    else if (s.tagId) params.tag = String(s.tagId);
    else if (s.categoryId) params.category = String(s.categoryId);
    else Object.assign(params, { orderby: "popularity", order: "desc" });
    getProducts(params)
      .then((list) => {
        if (!alive) return;
        const rows = list || [];
        // keep the order typed in WP admin
        if (s.ids?.length) rows.sort((a, b) => s.ids.indexOf(a.id) - s.ids.indexOf(b.id));
        setProducts(rows);
      })
      .catch((e) => {
        console.error("Product carousel failed:", e);
        if (alive) setProducts([]);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const list = (products || []).filter((p) => !exclude.includes(p.id));
  if (products && !list.length) return null;

  return (
    <section className="py-12 md:py-16">
      <Reveal className="flex items-end justify-between gap-4 mb-6">
        <h2 className="font-serif text-2xl md:text-3xl text-[#1D2A4D]">{title}</h2>
        {linkLabel && (
          <Link to={linkTo || "/collection/all"} className="text-xs font-semibold uppercase tracking-[0.15em] text-[#1D2A4D] underline underline-offset-4">
            {linkLabel}
          </Link>
        )}
      </Reveal>
      {products ? (
        <Carousel itemClassName="w-[68%] sm:w-[40%] lg:w-[calc(22%-13px)] 2xl:w-[calc(18%-13px)]" arrowTop="38%">
          {list.map((p) => (
            <CollectionProductCard key={p.id} product={p} swatches={swatches} />
          ))}
        </Carousel>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`aspect-[4/5] bg-[#F4F1EC] animate-pulse ${i > 1 ? "hidden lg:block" : ""}`} />
          ))}
        </div>
      )}
    </section>
  );
}

/* "How To Make It Your Own" — up to 4 numbered steps */
export function HowToSteps({ title, steps = [] }) {
  if (!steps.length) return null;
  return (
    <section className="py-12 md:py-16">
      {title && <h2 className="font-serif text-2xl md:text-3xl text-[#1D2A4D] mb-6">{title}</h2>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {steps.map((s, i) => (
          <Reveal key={i} delay={i * 0.08}>
            <div className="aspect-square bg-[#F4F1EC] overflow-hidden flex items-center justify-center">
              {s.image?.src ? (
                <img src={s.image.src} srcSet={s.image.srcset || undefined} sizes="(min-width:1024px) 25vw, 50vw" alt={s.image.alt || ""} loading="lazy" className="w-full h-full object-cover" />
              ) : (
                <span className="font-serif text-6xl text-[#1D2A4D]/25">{i + 1}</span>
              )}
            </div>
            <p className="mt-3 text-sm text-[#1D2A4D]">
              <span className="font-semibold">Step {i + 1}:</span> {s.title}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* Monogram style rows: title + up to 3 examples (small label, big monogram, note) on a photo/colour band */
const SAMPLE_FONTS = ["font-serif", "font-serif italic", "font-serif tracking-[0.12em]"];
export function StyleRows({ title, items = [] }) {
  if (!items.length) return null;
  return (
    <section className="pt-6">
      {title && <h2 className="font-serif text-2xl md:text-3xl text-[#1D2A4D] text-center mb-8">{title}</h2>}
      {items.map((row, i) => (
        <div key={i} className="relative overflow-hidden py-16 md:py-24 text-white" style={{ background: i % 2 ? "#9C8E80" : "#B5A797" }}>
          {row.image?.src && (
            <>
              <img src={row.image.src} srcSet={row.image.srcset || undefined} sizes="100vw" alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: row.image.position || "center" }} />
              <div className="absolute inset-0 bg-[#3a2f26]/45" />
            </>
          )}
          <Wide className="relative">
            <Reveal>
              <h3 className="font-serif text-3xl md:text-5xl text-center">{row.title}</h3>
            </Reveal>
            {row.samples?.length > 0 && (
              <div className={`mt-10 md:mt-14 grid gap-10 max-w-5xl mx-auto ${row.samples.length >= 3 ? "sm:grid-cols-3" : row.samples.length === 2 ? "sm:grid-cols-2" : ""}`}>
                {row.samples.slice(0, 3).map((s, j) => (
                  <Reveal key={j} delay={0.12 * j} className="text-center">
                    {s.label && <p className="font-serif text-base md:text-lg text-white/90">{s.label}</p>}
                    <p className={`mt-3 text-6xl md:text-8xl leading-none ${SAMPLE_FONTS[j % SAMPLE_FONTS.length]}`}>{s.text}</p>
                    {s.caption && <p className="mt-4 text-[11px] uppercase tracking-[0.22em] text-white/80">{s.caption}</p>}
                  </Reveal>
                ))}
              </div>
            )}
          </Wide>
        </div>
      ))}
    </section>
  );
}

/* FAQ accordion */
export function FaqList({ title = "FAQs", items = [] }) {
  const [open, setOpen] = useState(-1);
  if (!items.length) return null;
  return (
    <section className="py-12 md:py-16">
      <Reveal>
        <h2 className="font-serif text-2xl md:text-3xl text-[#1D2A4D] text-center mb-6">{title || "FAQs"}</h2>
      </Reveal>
      <Reveal delay={0.1} className="max-w-2xl mx-auto border-t border-[#1D2A4D]/10">
        {items.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="border-b border-[#1D2A4D]/10">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-6 py-5 text-left text-[15px] text-[#1D2A4D]"
              >
                <span>{f.q}</span>
                <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }} className="shrink-0 text-[#5B6478]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <p className="pb-5 pr-8 text-sm leading-relaxed text-[#5B6478] whitespace-pre-line">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </Reveal>
    </section>
  );
}