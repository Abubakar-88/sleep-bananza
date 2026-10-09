import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Carousel,
  Container,
  CountUp,
  EASE,
  ParallaxImage,
  Reveal,
  SectionHeading,
  ink,
  muted,
} from "./primitives";

// Full-width lifestyle banner with parallax background
export function ParallaxBanner({ content, image }) {
  return (
    <div className="my-6">
      <ParallaxImage src={image?.src} width={image?.width} fit={image?.fit} position={image?.position} strength={90} className="h-[70vh] min-h-[440px] max-h-[720px]">
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(90deg, rgba(20,28,52,.6) 0%, rgba(20,28,52,.15) 55%, rgba(20,28,52,0) 100%)" }}
        />
        <div className="relative h-full max-w-[1440px] mx-auto px-6 md:px-16 lg:px-24 flex items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.9, ease: EASE }}
            className="max-w-md text-white"
          >
            {content.eyebrow && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80 mb-3">{content.eyebrow}</p>
            )}
            <h2 className="text-3xl md:text-5xl font-semibold leading-tight tracking-tight">{content.title}</h2>
            <p className="mt-3 text-white/85">{content.text}</p>
            <Link
              to={content.ctaTo}
              className="inline-flex mt-6 bg-white text-[#1D2A4D] text-sm font-semibold px-6 py-3 rounded-full transition-transform duration-300 hover:scale-[1.04]"
            >
              {content.ctaLabel}
            </Link>
          </motion.div>
        </div>
      </ParallaxImage>
    </div>
  );
}

// Image + statistics card. Stats come from live store ratings unless overridden in homeContent.
export function StatsSplit({ content, image, stats }) {
  const items =
    content.stats ||
    [
      stats.avgRating > 0 && { value: stats.avgRating, decimals: 1, suffix: "★", label: "average customer rating" },
      stats.totalReviews > 0 && { value: stats.totalReviews, suffix: "+", label: "verified customer reviews" },
    ].filter(Boolean);

  return (
    <Container>
    <section className="py-16 md:py-24 grid md:grid-cols-2 gap-6 items-stretch">
      <Reveal className="min-h-[340px]">
        <ParallaxImage src={image?.src} width={image?.width} fit={image?.fit} position={image?.position} minCover={1000} framedBg="#EFE9E1" strength={50} className="h-full min-h-[340px] rounded-xl" />
      </Reveal>
      <Reveal delay={0.12} className="bg-white rounded-xl p-8 md:p-12 flex flex-col justify-center">
        <h2 className={`text-2xl md:text-3xl font-semibold tracking-tight ${ink}`}>{content.title}</h2>
        <p className={`mt-3 text-sm ${muted}`}>{content.text}</p>
        {items.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-6">
            {items.map((s) => (
              <div key={s.label}>
                <CountUp value={s.value} decimals={s.decimals || 0} suffix={s.suffix} className="text-4xl md:text-5xl font-semibold text-[#3E4F9B]" />
                <p className={`mt-2 text-sm ${muted}`}>{s.label}</p>
              </div>
            ))}
          </div>
        )}
        <Link
          to={content.ctaTo}
          className="self-start mt-8 bg-[#DCE2F4] text-[#1D2A4D] text-sm font-semibold px-5 py-2.5 rounded-full transition-colors hover:bg-[#1D2A4D] hover:text-white"
        >
          {content.ctaLabel}
        </Link>
      </Reveal>
    </section>
    </Container>
  );
}

// Customer / lifestyle photo strip
export function UgcStrip({ content, images }) {
  if (!images.length) return null;
  return (
    <section className="py-16 md:py-24">
      <Container>
        <SectionHeading eyebrow={content.eyebrow} title={content.title} className="mb-10" />
      </Container>
      <Carousel bleed itemClassName="w-[60%] sm:w-[36%] lg:w-[19%]" arrowTop="50%">
        {images.map((src, i) => (
          <div key={src + i} className="group aspect-[3/4] overflow-hidden rounded-xl bg-[#ECE7E0]">
            <img
              src={src}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          </div>
        ))}
      </Carousel>
    </section>
  );
}
