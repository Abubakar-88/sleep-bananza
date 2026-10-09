import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { EASE, FullBleed, objectPosition } from "./primitives";
import { Hotspot, useCoverMapping, useHotspotProducts } from "../common/Hotspots";

/*
  "Shop the Look" — wide lifestyle image with clickable product hotspots.
  Everything is managed in WP Admin → Home Page → "Shop the Look":
  image, text, button, and hotspots (x%, y%, product ID).
  Product name, price and image come live from WooCommerce.
*/
export function ShopTheLook({ content }) {
  const hotspots = content?.hotspots || [];
  const image = content?.image;
  const products = useHotspotProducts(hotspots);
  const [openIndex, setOpenIndex] = useState(0); // first card open by default, like the reference design

  const boxRef = useRef(null);
  const place = useCoverMapping(boxRef, image);

  if (!image?.src) return null;

  return (
    <FullBleed className="my-6">
      <div ref={boxRef} className="relative overflow-hidden h-[78vh] min-h-[520px] max-h-[760px] bg-[#2a241f]">
        <motion.img
          src={image.src}
          alt={image.alt || ""}
          loading="lazy"
          decoding="async"
          initial={{ scale: 1.06 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1.6, ease: EASE }}
          style={{ objectPosition: objectPosition(image) }}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* readability gradient behind the text */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(90deg, rgba(30,24,20,.62) 0%, rgba(30,24,20,.25) 38%, rgba(30,24,20,0) 60%)" }}
        />

        {/* Text block */}
        <div className="absolute inset-0 flex items-end md:items-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.9, ease: EASE }}
            className="pointer-events-auto max-w-md p-6 md:pl-[6%] text-white"
          >
            {content.eyebrow && <p className="font-serif italic text-lg md:text-2xl text-white/90">{content.eyebrow}</p>}
            {content.title && <h2 className="font-serif text-4xl md:text-6xl leading-tight mt-2">{content.title}</h2>}
            {content.text && <p className="mt-4 text-[15px] md:text-base text-white/90 whitespace-pre-line">{content.text}</p>}
            {content.ctaLabel && (
              <Link
                to={content.ctaTo || "/collection/all"}
                className="inline-block mt-7 bg-white text-[#1D2A4D] text-xs font-semibold uppercase tracking-[0.15em] px-6 py-3.5 transition-colors hover:bg-[#1D2A4D] hover:text-white"
              >
                {content.ctaLabel}
              </Link>
            )}
          </motion.div>
        </div>

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
    </FullBleed>
  );
}
