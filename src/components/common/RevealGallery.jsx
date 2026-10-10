import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/*
  Product image gallery with a "curtain wipe" between photos (Springs-style gallery transition).
  The new photo slides in behind a clip-path mask while the old one drifts and dims.
  Arrows, thumbnails, keyboard ← → and swipe on phones.
  Usage on your product page:
    <RevealGallery images={product.images} name={product.name} />
  images = WooCommerce Store API images: [{ src, thumbnail, srcset, alt }]
*/
const EASE = [0.77, 0, 0.18, 1];

export function RevealGallery({ images = [], name = "", className = "" }) {
  const list = images.filter((i) => i?.src);
  const [[index, dir], setState] = useState([0, 1]);
  const go = useCallback(
    (to) => {
      if (!list.length) return;
      const next = (to + list.length) % list.length;
      if (next === index) return;
      setState([next, to > index ? 1 : -1]);
    },
    [index, list.length]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.target?.closest?.("input, textarea, select")) return;
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index]);

  // reset when the product changes
  useEffect(() => setState([0, 1]), [list[0]?.src]);

  if (!list.length) return <div className={`aspect-[4/5] bg-[#F4F1EC] ${className}`} />;
  const img = list[index];

  return (
    <div className={className}>
      <div className="relative aspect-[4/5] overflow-hidden bg-[#F4F1EC] select-none">
        <AnimatePresence initial={false} custom={dir}>
          <motion.img
            key={img.src}
            src={img.src}
            srcSet={img.srcset || undefined}
            sizes="(min-width: 1024px) 50vw, 100vw"
            alt={img.alt || name}
            custom={dir}
            variants={{
              enter: (d) => ({ clipPath: d > 0 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)", scale: 1.12, zIndex: 2 }),
              center: { clipPath: "inset(0 0 0 0%)", scale: 1, zIndex: 2 },
              exit: (d) => ({ x: d > 0 ? "-12%" : "12%", opacity: 0.4, zIndex: 1 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 1, ease: EASE }}
            drag={list.length > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) go(index + 1);
              else if (info.offset.x > 60) go(index - 1);
            }}
            className="absolute inset-0 w-full h-full object-cover cursor-grab active:cursor-grabbing"
            draggable={false}
          />
        </AnimatePresence>

        {list.length > 1 && (
          <>
            <Arrow side="left" onClick={() => go(index - 1)} />
            <Arrow side="right" onClick={() => go(index + 1)} />
            <span className="absolute bottom-3 right-3 z-10 bg-white/85 backdrop-blur px-2.5 py-1 text-[11px] tracking-[0.15em] text-[#1D2A4D]">
              {String(index + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")}
            </span>
          </>
        )}
      </div>

      {list.length > 1 && (
        <div className="mt-3 grid grid-cols-5 sm:grid-cols-6 gap-2">
          {list.map((t, i) => (
            <button
              key={t.src}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show image ${i + 1}`}
              className="relative aspect-square overflow-hidden bg-[#F4F1EC]"
            >
              <img src={t.thumbnail || t.src} alt="" loading="lazy" className={`w-full h-full object-cover transition duration-500 ${i === index ? "opacity-100" : "opacity-55 hover:opacity-90"}`} />
              {i === index && <motion.span layoutId="gallery-active" className="absolute inset-x-0 bottom-0 h-[2px] bg-[#1D2A4D]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Arrow({ side, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous image" : "Next image"}
      className={`absolute top-1/2 -translate-y-1/2 z-10 ${side === "left" ? "left-3" : "right-3"} w-10 h-10 rounded-full bg-white/85 backdrop-blur text-[#1D2A4D] shadow flex items-center justify-center transition hover:scale-110`}
    >
      {side === "left" ? "‹" : "›"}
    </button>
  );
}
