import { Link } from "react-router-dom";
import { motion } from "framer-motion";

/* Image card placed inside the product grid (WP Admin → Collection Pages → Promo tile). */
export const promoSpan = (size) => (size === "tall" ? "row-span-2" : size === "wide" ? "col-span-2" : "");

export function PromoTile({ promo, delay = 0 }) {
  const { image, eyebrow, title, text, ctaLabel, link, theme } = promo;
  const dark = theme !== "light";
  const hasText = Boolean(eyebrow || title || text || ctaLabel);
  const isExternal = /^https?:\/\//i.test(link || "");
  const Wrap = link ? (isExternal ? "a" : Link) : "div";
  const wrapProps = link ? (isExternal ? { href: link, target: "_blank", rel: "noreferrer" } : { to: link }) : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay }}
      className="h-full"
    >
      <Wrap {...wrapProps} className="group relative block h-full min-h-[320px] overflow-hidden bg-[#EFEAE3]">
        <img
          src={image.src}
          srcSet={image.srcset || undefined}
          sizes={promo.size === "wide" ? "(min-width:1024px) 60vw, 100vw" : "(min-width:1024px) 30vw, 50vw"}
          alt={image.alt || title || ""}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
          style={{ objectPosition: image.position || "center" }}
        />
        {hasText && (
          <>
            {dark && <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-transparent" />}
            <div className={`relative p-4 sm:p-5 md:p-7 text-center ${dark ? "text-white" : "text-[#1D2A4D]"}`}>
              {eyebrow && <p className="font-serif italic text-sm md:text-base opacity-90">{eyebrow}</p>}
              {title && <h3 className="font-serif text-xl sm:text-2xl md:text-3xl leading-tight mt-1">{title}</h3>}
              {text && <p className="mt-2 text-xs md:text-sm opacity-90 whitespace-pre-line">{text}</p>}
              {ctaLabel && (
                <span className="inline-block mt-4 text-[11px] font-semibold uppercase tracking-[0.15em] underline underline-offset-4">{ctaLabel}</span>
              )}
            </div>
          </>
        )}
      </Wrap>
    </motion.div>
  );
}