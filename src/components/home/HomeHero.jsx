import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { EASE, FALLBACK_GRADIENT, FramedImage, Stars, imageMode, objectPosition } from "./primitives";

// Big rounded hero: image drifts slower than the page (parallax),
// zooms in gently on load, text fades out as you scroll past.
export function HomeHero({ content, image, stats }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgY = useSpring(useTransform(scrollYProgress, [0, 1], [0, 140]), { stiffness: 140, damping: 30, mass: 0.3 });
  const textY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.25 } } };
  const item = {
    hidden: { opacity: 0, y: 26 },
    show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
  };

  return (
    <section ref={ref} className="px-3 md:px-4 pt-3 md:pt-4">
      <div className="relative overflow-hidden rounded-2xl md:rounded-[28px] h-[78vh] min-h-[480px] max-h-[820px] bg-[#3E4F9B]">
        <motion.div
          className="absolute inset-x-0 -top-10 -bottom-10"
          style={{ y: reduce ? 0 : imgY }}
          initial={reduce ? false : { scale: 1.12 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.8, ease: EASE }}
        >
          {(() => {
            const mode = imageMode(image);
            if (mode === "cover" || mode === "contain") {
              const img = (
                <img
                  src={image.src}
                  alt=""
                  decoding="async"
                  fetchpriority="high"
                  style={{ objectPosition: objectPosition(image) }}
                  className={`w-full h-full ${mode === "contain" ? "object-contain" : "object-cover"}`}
                />
              );
              return mode === "contain" ? (
                <div className="w-full h-full" style={{ background: FALLBACK_GRADIENT }}>{img}</div>
              ) : (
                img
              );
            }
            return (
              <div className="relative w-full h-full" style={{ background: FALLBACK_GRADIENT }}>
                {mode === "framed" && <FramedImage src={image.src} width={image.width} />}
              </div>
            );
          })()}
        </motion.div>

        {/* readability gradient on the text side */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(90deg, rgba(29,42,77,.72) 0%, rgba(29,42,77,.35) 45%, rgba(29,42,77,0) 75%)" }}
        />

        <motion.div
          style={reduce ? undefined : { y: textY, opacity: textOpacity }}
          className="relative h-full flex items-end md:items-center"
        >
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="p-6 md:p-16 lg:pl-24 max-w-2xl text-white"
          >
            <motion.div variants={item} className="flex items-center gap-3 mb-4">
              {content.badge && (
                <span className="text-[11px] font-bold uppercase tracking-wider bg-white text-[#1D2A4D] px-2.5 py-1 rounded-full">
                  {content.badge}
                </span>
              )}
              {stats.avgRating > 0 && (
                <span className="text-xs text-white/90 flex items-center gap-1.5">
                  <Stars rating={stats.avgRating} /> {stats.totalReviews.toLocaleString()} reviews
                </span>
              )}
            </motion.div>

            <h1 className="text-4xl md:text-6xl font-semibold leading-[1.05] tracking-tight">
              {content.titleLines.map((line) => (
                <motion.span key={line} variants={item} className="block">
                  {line}
                </motion.span>
              ))}
            </h1>

            <motion.p variants={item} className="mt-4 text-white/85 md:text-lg max-w-md">
              {content.subtitle}
            </motion.p>

            <motion.div variants={item} className="mt-7">
              <Link
                to={content.ctaTo}
                className="inline-flex items-center gap-2 bg-white text-[#1D2A4D] text-sm font-semibold px-6 py-3 rounded-full transition-transform duration-300 hover:scale-[1.04]"
              >
                {content.ctaLabel} <span aria-hidden>→</span>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
