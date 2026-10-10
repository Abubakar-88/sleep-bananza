import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { EASE, FALLBACK_GRADIENT, Stars } from "./primitives";
import { WaterImage } from "../common/WaterImage";

/*
  Layered "sleep in the clouds" hero (FIND-style depth parallax).
  Back → front: photo (slowest) · far clouds · text · mid clouds · near clouds + mist (fastest).
  While scrolling down each layer moves at its own speed and the near clouds rise over the photo,
  melting into the next section. On desktop the layers also follow the mouse a little,
  and (optional) the photo ripples like water under the cursor.
  Content: WP Admin → Home Page → Hero (photo, text, button, "Hero effect").
*/
const PAGE_BG = "#F6F1EA"; // must match the Home page background so the mist blends in

// How strong the clouds look (0 = none, 1 = very thick). Change these to taste.
const CLOUDS = { far: 0.45, mid: 0.55, near: 0.69 };

export function CloudHero({ content, image, stats, water = true }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const soft = (v) => useSpring(v, { stiffness: 120, damping: 28, mass: 0.35 });

  // scroll speeds per layer (px over the hero height)
  const photoY = soft(useTransform(scrollYProgress, [0, 1], [0, 160]));
  const farY = soft(useTransform(scrollYProgress, [0, 1], [0, -80]));
  const textY = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const midY = soft(useTransform(scrollYProgress, [0, 1], [0, -260]));
  const nearY = soft(useTransform(scrollYProgress, [0, 1], [0, -420]));
  const nearScale = useTransform(scrollYProgress, [0, 1], [1, 1.25]);

  // mouse parallax (desktop)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 50, damping: 20 });
  const smy = useSpring(my, { stiffness: 50, damping: 20 });
  const depth = (k) => ({ x: useTransform(smx, (v) => v * k), y: useTransform(smy, (v) => v * k * 0.6) });
  const dPhoto = depth(-10);
  const dFar = depth(18);
  const dMid = depth(34);
  const dNear = depth(56);

  useEffect(() => {
    if (reduce || !window.matchMedia?.("(hover: hover) and (pointer: fine)").matches) return;
    const onMove = (e) => {
      mx.set(e.clientX / window.innerWidth - 0.5);
      my.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce, mx, my]);

  const hasPhoto = Boolean(image?.src);
  const container = { hidden: {}, show: { transition: { staggerChildren: 0.14, delayChildren: 0.5 } } };
  const item = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 1.1, ease: EASE } } };
  const still = reduce ? {} : null; // reduced motion → no transforms

  return (
    <section ref={ref} className="relative h-[92vh] min-h-[560px] max-h-[920px] overflow-hidden" style={{ background: FALLBACK_GRADIENT }}>
      {/* 1 · photo */}
      <motion.div className="absolute inset-x-0 -top-[8%] h-[120%]" style={still || { y: photoY }}>
        <motion.div
          className="absolute inset-[-3%]"
          style={still || dPhoto}
          initial={reduce ? false : { scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.4, ease: EASE }}
        >
          {hasPhoto && (
            <WaterImage src={image.src} srcSet={image.srcset} position={image.position || "center"} enabled={water} className="w-full h-full" />
          )}
        </motion.div>
      </motion.div>

      {/* night-sky tint for readability */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(20,28,58,.55) 0%, rgba(29,42,77,.25) 45%, rgba(29,42,77,.05) 70%)" }} />

      {/* 2 · far clouds */}
      <motion.div className="absolute inset-0 pointer-events-none" style={{ opacity: CLOUDS.far, ...(still || { y: farY }) }}>
        <motion.div className="absolute inset-0" style={still || dFar}>
          <Cloud className="left-[-6%] top-[14%] w-[34vw]" drift={40} duration={48} />
          <Cloud className="right-[-8%] top-[8%] w-[30vw]" drift={-36} duration={56} delay={4} />
        </motion.div>
      </motion.div>

      {/* 3 · text */}
      <motion.div className="relative z-10 h-full flex items-center justify-center text-center px-6" style={still || { y: textY, opacity: textOpacity }}>
        <motion.div variants={container} initial="hidden" animate="show" className="max-w-3xl text-white">
          <motion.div variants={item} className="flex items-center justify-center gap-3 mb-5">
            {content.badge && (
              <span className="text-[11px] font-bold uppercase tracking-wider bg-white/90 text-[#1D2A4D] px-2.5 py-1 rounded-full">{content.badge}</span>
            )}
            {stats?.avgRating > 0 && (
              <span className="text-xs text-white/90 flex items-center gap-1.5">
                <Stars rating={stats.avgRating} /> {stats.totalReviews.toLocaleString()} reviews
              </span>
            )}
          </motion.div>
          <h1 className="font-serif text-5xl md:text-7xl leading-[1.02] tracking-tight drop-shadow-[0_2px_30px_rgba(20,28,58,.35)]">
            {content.titleLines.map((line) => (
              <motion.span key={line} variants={item} className="block">
                {line}
              </motion.span>
            ))}
          </h1>
          {content.subtitle && (
            <motion.p variants={item} className="mt-5 text-white/90 md:text-lg max-w-xl mx-auto">
              {content.subtitle}
            </motion.p>
          )}
          {content.ctaLabel && (
            <motion.div variants={item} className="mt-8">
              <Link
                to={content.ctaTo}
                className="inline-flex items-center gap-2 bg-white text-[#1D2A4D] text-sm font-semibold px-7 py-3.5 rounded-full shadow-lg transition-transform duration-300 hover:scale-[1.04]"
              >
                {content.ctaLabel} <span aria-hidden>→</span>
              </Link>
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* 4 · mid clouds (in front of the text edges) */}
      <motion.div className="absolute inset-0 z-[5] pointer-events-none" style={{ opacity: CLOUDS.mid, ...(still || { y: midY }) }}>
        <motion.div className="absolute inset-0" style={still || dMid}>
          <Cloud className="left-[-14%] bottom-[2%] w-[40vw]" drift={50} duration={40} />
          <Cloud className="right-[-16%] bottom-[6%] w-[38vw]" drift={-44} duration={44} delay={2} />
        </motion.div>
      </motion.div>

      {/* 5 · near clouds + mist that rise over the photo while scrolling */}
      <motion.div className="absolute inset-x-0 bottom-0 z-30 pointer-events-none" style={still || { y: nearY, scale: nearScale }}>
        <motion.div className="relative h-[42vh] min-h-[260px]" style={still || dNear}>
          <div className="absolute inset-0" style={{ opacity: CLOUDS.near }}>
            <Cloud className="left-[-14%] bottom-[-34%] w-[58vw]" drift={30} duration={36} />
            <Cloud className="left-[30%] bottom-[-42%] w-[54vw]" drift={-30} duration={42} delay={3} />
            <Cloud className="right-[-16%] bottom-[-36%] w-[52vw]" drift={26} duration={38} delay={1} />
          </div>
          {/* mist: blends the hero into the page colour */}
          <div className="absolute inset-x-0 bottom-0 h-[38%]" style={{ background: `linear-gradient(180deg, rgba(246,241,234,0) 0%, ${PAGE_BG} 92%)` }} />
        </motion.div>
      </motion.div>

      {/* scroll hint */}
      {!reduce && (
        <motion.div
          className="absolute z-40 bottom-6 left-1/2 -translate-x-1/2 text-[#1D2A4D]/60 text-[11px] uppercase tracking-[0.25em]"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0], y: [0, 0, 8, 12] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: 2 }}
        >
          Scroll
        </motion.div>
      )}
    </section>
  );
}

/* Soft cloud made of blurred puffs — no image files needed. */
const PUFFS = [
  [8, 48, 38, 52], [26, 30, 40, 62], [48, 22, 42, 70], [68, 34, 36, 58], [84, 50, 30, 44], [36, 56, 60, 44], [62, 58, 50, 40],
];
function Cloud({ className = "", drift = 30, duration = 40, delay = 0 }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`absolute aspect-[2.6/1] ${className}`}
      animate={reduce ? undefined : { x: [0, drift, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
      style={{ filter: "blur(6px)" }}
    >
      {PUFFS.map(([x, y, w, h], i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${x - w / 2}%`,
            top: `${y - h / 2}%`,
            width: `${w}%`,
            height: `${h * 2.6}%`,
            transform: "translateY(-30%)",
            background: "radial-gradient(closest-side, rgba(255,255,255,.9), rgba(255,255,255,.55) 55%, rgba(255,255,255,0))",
          }}
        />
      ))}
    </motion.div>
  );
}