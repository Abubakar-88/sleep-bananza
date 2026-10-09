import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useCategoryProducts } from "../../hooks/useHomeData";
import { decodeHtml } from "../../utils/decodeHtml";
import { formatPriceFromProduct } from "../../utils/formatPrice";
import { Carousel, Container, EASE, PillTabs, SectionHeading, stripHtml, wcImgProps } from "./primitives";

// "The easier way to sleep well": category tabs + product carousel.
// "Featured" tab uses featured products; other tabs load that category from the API.
export function ProductTabsSection({ content, categories, featured }) {
  const [active, setActive] = useState(null);
  const { products, loading } = useCategoryProducts(active, featured);

  const tabs = useMemo(
    () => [
      { value: null, label: "Featured" },
      ...categories.slice(0, 4).map((c) => ({ value: c.id, label: decodeHtml(c.name) })),
    ],
    [categories]
  );

  return (
    <section className="py-16 md:py-24">
      <Container>
        <motion.div {...rise(0)}>
          <SectionHeading eyebrow={content.eyebrow} title={content.title} emphasis={content.titleEmphasis} />
        </motion.div>
        <motion.div {...rise(0.15)} className="mt-6 mb-10">
          <PillTabs id="product-tabs" tabs={tabs} active={active} onChange={setActive} />
        </motion.div>
      </Container>

      <AnimatePresence mode="wait">
        <motion.div
          key={String(active)}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: loading ? 0.4 : 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.45, ease: EASE }}
        >
          <Carousel bleed itemClassName="w-[72%] sm:w-[42%] lg:w-[23.5%]" arrowTop="38%">
            {products.map((p, i) => (
              // cards rise in one by one (left to right) when the section scrolls into view
              <motion.div key={p.id} {...rise(i < 5 ? 0.1 + i * 0.12 : 0.05)}>
                <FeatureCard product={p} />
              </motion.div>
            ))}
          </Carousel>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

// Same slow scroll animation as the collection page
const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 60 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 1.1, ease: EASE, delay },
});

function FeatureCard({ product }) {
  const SIZES = "(min-width: 1024px) 24vw, (min-width: 640px) 42vw, 72vw";
  const main = wcImgProps(product.images?.[0], SIZES);
  const alt = product.images?.[1] ? wcImgProps(product.images[1], SIZES) : null;
  const badge = product.tags?.[0]?.name;
  const desc = stripHtml(product.short_description || product.description);

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#ECE7E0]">
        {/* photo zooms out slowly as the card appears */}
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.15 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 1.6, ease: EASE }}
        >
        {main.src && (
          <img
            {...main}
            alt={decodeHtml(product.name)}
            decoding="async"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-0"
          />
        )}
        {alt && (
          <img
            {...alt}
            alt=""
            decoding="async"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover opacity-0 scale-105 transition-all duration-700 ease-out group-hover:opacity-100 group-hover:scale-100"
          />
        )}
        </motion.div>
        {badge && (
          <span className="absolute top-3 left-3 bg-white/95 text-[#1D2A4D] text-[11px] font-semibold px-2.5 py-1 rounded-full">
            {decodeHtml(badge)}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <h3 className="text-[15px] font-semibold text-[#1D2A4D] group-hover:underline underline-offset-4">
          {decodeHtml(product.name)}
        </h3>
        <span className="text-sm font-medium text-[#1D2A4D] whitespace-nowrap">{formatPriceFromProduct(product)}</span>
      </div>
      {desc && <p className="mt-1 text-[13px] text-[#5B6478] line-clamp-2">{desc}</p>}
    </Link>
  );
}