import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useScroll, useSpring } from "framer-motion";
import { EASE } from "./primitives";

/*
  "Better sleep in 4 steps" — scroll story (FIND-style).
  Desktop: the photo column stays pinned while the steps scroll past; each step swaps the photo
  with an upward mask reveal, and a progress line fills as you go.
  Phone: each step shows its own photo above the text.
  Content: WP Admin → Home Page → "Sleep steps". Empty photos use product photos from the store.
*/
export function SleepSteps({ content, fallbackImages = [] }) {
  const steps = (content?.steps || []).filter((s) => s.title).slice(0, 4);
  const [active, setActive] = useState(0);
  const listRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 60%", "end 60%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  if (!steps.length) return null;
  const photo = (i) => steps[i]?.image?.src || fallbackImages[i % Math.max(fallbackImages.length, 1)] || null;

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1, ease: EASE }}
          className="text-center max-w-2xl mx-auto mb-14 md:mb-20"
        >
          {content.eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#5B6478]">{content.eyebrow}</p>}
          {content.title && <h2 className="mt-3 font-serif text-4xl md:text-5xl text-[#1D2A4D] leading-tight">{content.title}</h2>}
        </motion.div>

        <div className="md:grid md:grid-cols-2 md:gap-16 lg:gap-24">
          {/* pinned photo (desktop) */}
          <div className="hidden md:block">
            <div className="sticky top-24 h-[calc(100vh-8rem)] max-h-[760px] flex flex-col">
              <div className="relative flex-1 overflow-hidden rounded-2xl bg-[#ECE7E0]">
                <AnimatePresence initial={false}>
                  <motion.div
                    key={active}
                    className="absolute inset-0"
                    initial={{ clipPath: "inset(100% 0 0 0)" }}
                    animate={{ clipPath: "inset(0% 0 0 0)" }}
                    exit={{ opacity: 1 }}
                    transition={{ duration: 1.1, ease: EASE }}
                  >
                    {photo(active) && (
                      <motion.img
                        src={photo(active)}
                        alt=""
                        className="w-full h-full object-cover"
                        initial={{ scale: 1.18 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 1.6, ease: EASE }}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
                <div className="absolute left-6 bottom-5 z-10 font-serif text-white text-7xl leading-none drop-shadow-[0_2px_20px_rgba(0,0,0,.35)]">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={active}
                      className="inline-block"
                      initial={{ y: 40, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -40, opacity: 0 }}
                      transition={{ duration: 0.5, ease: EASE }}
                    >
                      {String(active + 1).padStart(2, "0")}
                    </motion.span>
                  </AnimatePresence>
                  <span className="text-2xl text-white/70 align-top ml-1">/ {String(steps.length).padStart(2, "0")}</span>
                </div>
              </div>
              {/* progress line */}
              <div className="mt-5 h-[2px] bg-[#1D2A4D]/10 overflow-hidden rounded">
                <motion.div className="h-full bg-[#1D2A4D] origin-left" style={{ scaleX: progress }} />
              </div>
            </div>
          </div>

          {/* steps */}
          <div ref={listRef}>
            {steps.map((s, i) => (
              <Step key={i} index={i} step={s} photo={photo(i)} active={active === i} onActive={() => setActive(i)} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Step({ index, step, photo, active, onActive }) {
  const ref = useRef(null);
  const inView = useInView(ref, { margin: "-45% 0px -45% 0px" }); // the step crossing the middle of the screen
  useEffect(() => {
    if (inView) onActive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  return (
    <div ref={ref} className="md:min-h-[78vh] flex flex-col justify-center py-10 md:py-0">
      {/* phone: own photo */}
      {photo && (
        <motion.div
          className="md:hidden mb-6 aspect-[4/3] overflow-hidden rounded-2xl bg-[#ECE7E0]"
          initial={{ clipPath: "inset(30% 0 0 0)", opacity: 0 }}
          whileInView={{ clipPath: "inset(0% 0 0 0)", opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1.1, ease: EASE }}
        >
          <img src={photo} alt="" loading="lazy" className="w-full h-full object-cover" />
        </motion.div>
      )}
      <motion.div animate={{ opacity: active ? 1 : 0.28 }} transition={{ duration: 0.6 }} className="max-md:!opacity-100">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1, ease: EASE }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#5B6478]">Step {index + 1}</p>
          <h3 className="mt-3 font-serif text-3xl md:text-5xl text-[#1D2A4D] leading-tight">{step.title}</h3>
          {step.text && <p className="mt-5 text-[15px] md:text-lg leading-relaxed text-[#5B6478] max-w-md whitespace-pre-line">{step.text}</p>}
        </motion.div>
      </motion.div>
    </div>
  );
}
