import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";

/*
  Preloader + smooth page change (Springs-style).
  - First visit: the brand name appears letter by letter, then fills left → right like a loading bar
    while the page loads. When the page is ready the navy curtain lifts with a soft curved edge.
  - Every route change: the curtain covers the screen, the page is swapped and scrolled to top,
    then the curtain lifts. Filter / sort changes (?query) don't trigger it.
  Put <RouteCurtain /> once inside <BrowserRouter> (e.g. in your Layout, next to <Header />).
  The loader finishes only when the page is really ready: all API requests have returned,
  the images on the first screen have downloaded, and nothing new started for a moment
  (max 10 s). markPageReady() (called by Home) lets it finish a bit sooner on the home page.
*/
const EASE = [0.76, 0, 0.24, 1];

let pageReady = false;
export function markPageReady() {
  if (pageReady) return;
  pageReady = true;
  window.dispatchEvent(new Event("sb:page-ready"));
}

/* ---- Tracks every API request (axios/XHR + fetch) made while the preloader is up ---- */
const net = { started: 0, done: 0, tracking: true };
(function trackNetwork() {
  if (typeof window === "undefined" || window.__sbNetTracked) return;
  window.__sbNetTracked = true;
  const finish = () => {
    net.done += 1;
  };
  const XHR = window.XMLHttpRequest?.prototype;
  if (XHR) {
    const send = XHR.send;
    XHR.send = function (...args) {
      if (net.tracking) {
        net.started += 1;
        this.addEventListener("loadend", finish, { once: true });
      }
      return send.apply(this, args);
    };
  }
  if (window.fetch) {
    const f = window.fetch.bind(window);
    window.fetch = (...args) => {
      if (!net.tracking) return f(...args);
      net.started += 1;
      return f(...args).finally(finish);
    };
  }
})();

// images that are visible on the first screen
function firstScreenImages() {
  const h = window.innerHeight;
  return Array.from(document.images).filter((img) => {
    if (!img.currentSrc && !img.src) return false;
    if (img.loading === "lazy" && img.getBoundingClientRect().top > h) return false;
    const r = img.getBoundingClientRect();
    return r.bottom > 0 && r.top < h && r.width > 40 && r.height > 40;
  });
}

export function RouteCurtain({ label = "Sleep Bonanza", color = "#1D2A4D" }) {
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  const prevPath = useRef(pathname);
  const [run, setRun] = useState({ id: 0, intro: true });

  // layout effect = runs before the browser paints the new page, so it is never seen uncovered.
  // Compare with the previous path (not a "first run" flag) so React StrictMode's double run in
  // development doesn't skip the preloader.
  useLayoutEffect(() => {
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;
    window.scrollTo(0, 0);
    setRun((r) => ({ id: r.id + 1, intro: false }));
  }, [pathname]);

  // "Reduce motion" (Windows: animation effects off): keep the loader, skip the page-change curtain
  if (reduce && !run.intro) return null;
  return <Curtain key={run.id} intro={run.intro} label={label} color={color} reduce={reduce} />;
}

function Curtain({ intro, label, color, reduce }) {
  const [lift, setLift] = useState(!intro); // route changes lift straight away, the intro waits for the loader
  const [done, setDone] = useState(false);

  // stop the page scrolling behind the preloader
  useEffect(() => {
    if (!intro || lift) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [intro, lift]);

  if (done) return null;
  const hold = intro ? 0.1 : 0.25;

  return (
    <motion.div
      aria-hidden
      className="fixed inset-0 z-[200]"
      style={{ pointerEvents: lift ? "none" : "auto" }}
      initial={{ y: "0%" }}
      animate={lift ? (reduce ? { opacity: 0 } : { y: "-110%" }) : { y: "0%" }}
      transition={{ duration: 0.95, ease: EASE, delay: lift ? hold : 0 }}
      onAnimationComplete={() => lift && setDone(true)}
    >
      <div className="absolute inset-0" style={{ background: color }} />
      {/* curved bottom edge while lifting */}
      <motion.div
        className="absolute left-[-10%] right-[-10%] top-full h-[18vh]"
        style={{ background: color, borderRadius: "0 0 50% 50%" }}
        initial={{ scaleY: 0 }}
        animate={lift ? { scaleY: [0, 1, 0] } : { scaleY: 0 }}
        transition={{ duration: 0.95, ease: EASE, delay: hold, times: [0, 0.5, 1] }}
      />
      {intro ? (
        <WordLoader label={label} lifting={lift} onReady={() => setLift(true)} />
      ) : (
        <motion.span
          className="absolute inset-0 flex items-center justify-center font-serif text-white text-3xl md:text-5xl tracking-tight"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6, delay: hold, ease: "easeOut" }}
        >
          {label}
        </motion.span>
      )}
    </motion.div>
  );
}

/* The brand name fills from left to right as the site loads. */
function WordLoader({ label, lifting, onReady }) {
  const progress = useMotionValue(0);
  const clip = useTransform(progress, (p) => `inset(0 ${100 - p * 100}% 0 0)`);
  const percent = useTransform(progress, (p) => `${Math.round(p * 100)}%`);
  const letters = Array.from(label);

  useEffect(() => {
    let cancelled = false;
    const t0 = performance.now();
    const MIN = 1400; // let the letters finish appearing
    const MAX = 10000; // never keep a visitor waiting longer than this
    let idleSince = 0;
    let target = 0.08;
    // the home page tells us itself when its data is in (markPageReady); other pages rely on the network
    const waitForPage = window.location.pathname === "/";

    const tick = () => {
      if (cancelled) return;
      const now = performance.now();
      const pending = net.started - net.done;
      const imgs = firstScreenImages();
      const imgsDone = imgs.filter((i) => i.complete && i.naturalWidth > 0).length;
      const docLoaded = document.readyState === "complete";

      // real progress: finished requests + loaded first-screen images
      const total = net.started + imgs.length + 1;
      const finished = net.done + imgsDone + (docLoaded ? 1 : 0) - (waitForPage && !pageReady ? 1 : 0);
      target = Math.max(target, Math.min(0.95, 0.08 + 0.87 * (finished / total)));
      // keep moving slowly while waiting, so it never looks frozen (up to 60%)
      target = Math.max(target, Math.min(0.6, 0.08 + (now - t0) / 9000));
      // ease the bar towards the real value (never jumps backwards)
      progress.set(progress.get() + (target - progress.get()) * 0.08);

      const quiet = pending === 0 && docLoaded && imgsDone === imgs.length;
      idleSince = quiet ? idleSince || now : 0;
      const settled = idleSince && now - idleSince > 450 && (waitForPage ? pageReady : true); // nothing new for 0.45s
      const elapsed = now - t0;

      if ((settled && elapsed > MIN) || elapsed > MAX) {
        net.tracking = false;
        animate(progress, 1, { duration: 0.35 + (1 - progress.get()) * 0.6, ease: "easeOut" }).then(() => {
          if (!cancelled) setTimeout(onReady, 180);
        });
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const word = (cls) => (
    <span className={`block whitespace-pre ${cls}`}>
      {letters.map((ch, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, delay: 0.1 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  );

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center text-white select-none"
      animate={lifting ? { opacity: 0, y: -30 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="relative font-serif text-4xl sm:text-6xl md:text-7xl tracking-tight leading-none">
        {/* empty (outline-like) word */}
        {word("text-white/15")}
        {/* filled word, revealed left → right by the progress */}
        <motion.div className="absolute inset-0" style={{ clipPath: clip }} aria-hidden>
          {word("text-white")}
        </motion.div>
      </div>
      <motion.span
        className="mt-6 text-[11px] tracking-[0.35em] text-white/50 tabular-nums"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {percent}
      </motion.span>
    </motion.div>
  );
}