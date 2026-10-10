import { useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";

/*
  Smooth page change (Springs-style):
  - First visit: a short preloader — the logo fades in, then the curtain lifts.
  - Every route change: a navy curtain covers the screen, the page is swapped and scrolled to top,
    then the curtain lifts with a soft curved edge.
  Only the URL path counts — filter / sort changes (?query) don't trigger it.
  Put <RouteCurtain /> once inside <BrowserRouter> (e.g. in your Layout, next to <Header />).
*/
const EASE = [0.76, 0, 0.24, 1];

export function RouteCurtain({ label = "Sleep Banaza", color = "#1D2A4D" }) {
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  const first = useRef(true);
  const [run, setRun] = useState({ id: 0, intro: true });

  // layout effect = runs before the browser paints the new page, so it is never seen uncovered
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo(0, 0);
    setRun((r) => ({ id: r.id + 1, intro: false }));
  }, [pathname]);

  if (reduce) return null;

  return (
    <Curtain key={run.id} intro={run.intro} label={label} color={color} />
  );
}

function Curtain({ intro, label, color }) {
  const [done, setDone] = useState(false);
  if (done) return null;
  const hold = intro ? 0.9 : 0.25; // how long the curtain stays closed

  return (
    <motion.div
      aria-hidden
      className="fixed inset-0 z-[200] pointer-events-none"
      initial={{ y: "0%" }}
      animate={{ y: "-110%" }}
      transition={{ duration: 0.9, ease: EASE, delay: hold }}
      onAnimationComplete={() => setDone(true)}
    >
      <div className="absolute inset-0" style={{ background: color }} />
      {/* curved bottom edge while lifting */}
      <motion.div
        className="absolute left-[-10%] right-[-10%] top-full h-[18vh]"
        style={{ background: color, borderRadius: "0 0 50% 50%" }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: [0, 1, 0] }}
        transition={{ duration: 0.9, ease: EASE, delay: hold, times: [0, 0.5, 1] }}
      />
      <motion.span
        className="absolute inset-0 flex items-center justify-center font-serif text-white text-3xl md:text-5xl tracking-tight"
        initial={{ opacity: intro ? 0 : 1, y: intro ? 14 : 0 }}
        animate={{ opacity: [intro ? 0 : 1, 1, 0], y: [intro ? 14 : 0, 0, -20] }}
        transition={{ duration: hold + 0.5, times: [0, 0.6, 1], ease: "easeOut" }}
      >
        {label}
      </motion.span>
    </motion.div>
  );
}
