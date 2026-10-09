import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useReviews } from "../../hooks/useHomeData";
import { decodeHtml } from "../../utils/decodeHtml";
import { Carousel, Container, EASE, PillTabs, Reveal, Stars, ink, muted, stripHtml } from "./primitives";

// Rotating short 5-star quote, taken from your real WooCommerce reviews
export function QuoteStrip({ press = [] }) {
  const { reviews } = useReviews(null, 20);
  const quotes = useMemo(
    () =>
      reviews
        .filter((r) => Number(r.rating) >= 5)
        .map((r) => ({ text: stripHtml(r.review), by: r.reviewer }))
        .filter((q) => q.text.length > 8 && q.text.length < 90)
        .slice(0, 6),
    [reviews]
  );
  const [i, setI] = useState(0);

  useEffect(() => {
    if (quotes.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % quotes.length), 4500);
    return () => clearInterval(t);
  }, [quotes.length]);

  if (!quotes.length) return null;
  const q = quotes[i % quotes.length];

  return (
    <Reveal className="bg-white py-14 md:py-20 px-6 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5B6478] mb-4">What sleepers say</p>
      <div className="min-h-[96px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.figure
            key={i}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <blockquote className={`text-2xl md:text-3xl font-medium ${ink}`}>“{q.text}”</blockquote>
            <figcaption className={`mt-3 text-sm ${muted}`}>{q.by}</figcaption>
          </motion.figure>
        </AnimatePresence>
      </div>
      {press.length > 0 && (
        <div className="mt-8 flex flex-wrap justify-center gap-x-10 gap-y-3 text-sm font-semibold uppercase tracking-widest text-[#9AA1B2]">
          {press.map((p) => (
            <span key={p}>{p}</span>
          ))}
        </div>
      )}
    </Reveal>
  );
}

// Review cards with category tabs
export function ReviewsCarousel({ content, categories, totalReviews }) {
  const [active, setActive] = useState(null);
  const { reviews, loading } = useReviews(active, 12);

  const tabs = useMemo(
    () => [
      { value: null, label: "All" },
      ...categories
        .filter((c) => Number(c.review_count || 0) > 0)
        .slice(0, 4)
        .map((c) => ({ value: c.id, label: decodeHtml(c.name) })),
    ],
    [categories]
  );

  if (!loading && active === null && reviews.length === 0) return null;

  return (
    <section className="py-16 md:py-24">
      <Container>
      <Reveal className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5B6478] mb-3">{content.eyebrow}</p>
        <h2 className={`text-3xl md:text-4xl font-semibold tracking-tight ${ink}`}>
          {totalReviews > 0 ? `${totalReviews.toLocaleString()}+ ` : ""}
          {content.titleSuffix}
        </h2>
      </Reveal>
      <div className="mt-6 mb-10">
        <PillTabs id="review-tabs" tabs={tabs} active={active} onChange={setActive} />
      </div>
      </Container>

      <AnimatePresence mode="wait">
        <motion.div
          key={String(active)}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: loading ? 0.4 : 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          {reviews.length === 0 && !loading ? (
            <p className={`text-center text-sm ${muted}`}>No reviews in this category yet.</p>
          ) : (
            <Carousel bleed itemClassName="w-[78%] sm:w-[44%] lg:w-[18.5%]" arrowTop="50%">
              {reviews.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </Carousel>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

function ReviewCard({ review }) {
  const [open, setOpen] = useState(false);
  const text = stripHtml(review.review);
  const long = text.length > 140;
  const date = review.formatted_date_created || new Date(review.date_created).toLocaleDateString();

  return (
    <article className="h-full bg-white rounded-xl p-5 flex flex-col border border-[#EEE9E2] transition-shadow duration-300 hover:shadow-lg">
      <Stars rating={review.rating} className="text-sm" />
      <p className={`mt-3 text-sm leading-relaxed ${ink} ${open ? "" : "line-clamp-5"}`}>“{text}”</p>
      {long && (
        <button type="button" onClick={() => setOpen((v) => !v)} className="self-start mt-1 text-xs font-semibold text-[#3E4F9B] underline">
          {open ? "Show less" : "Read more"}
        </button>
      )}
      <div className="mt-auto pt-4 text-xs">
        <p className={`font-semibold ${ink}`}>
          {review.reviewer} {review.verified && <span className="text-emerald-600 font-normal">✓ Verified</span>}
        </p>
        <p className={muted}>{date}</p>
        {review.product_name && (
          <Link to={`/product/${review.product_id}`} className="block mt-1 text-[#3E4F9B] hover:underline truncate">
            {decodeHtml(review.product_name)}
          </Link>
        )}
      </div>
    </article>
  );
}
