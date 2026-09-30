import { useEffect, useState } from "react";
import { getReviews, submitReview } from "../../api/reviews";

const EMPTY_FORM = { name: "", email: "", content: "", website: "" };
const PER_PAGE = 5;

function Stars({ value = 0, className = "" }) {
  const rounded = Math.round(Number(value) || 0);
  return (
    <span aria-hidden="true" className={`text-amber-500 tracking-tight ${className}`}>
      {"★".repeat(rounded)}
      <span className="text-slate-300">{"★".repeat(5 - rounded)}</span>
    </span>
  );
}

function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div role="radiogroup" aria-label="Your rating" className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className={`text-3xl leading-none ${(hover || value) >= n ? "text-amber-500" : "text-slate-300"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="block text-sm text-slate-700 mb-1">{label}</span>
      {children}
      {error && (
        <span role="alert" className="block text-sm text-red-600 mt-1">
          {error}
        </span>
      )}
    </label>
  );
}

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900";

export function ReviewsSection({ productId }) {
  const [data, setData] = useState({ items: [], average: 0, count: 0, counts: {}, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [rating, setRating] = useState(0);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPage(1);
    setDone(false);
    setFormOpen(false);
    getReviews(productId, { page: 1, perPage: PER_PAGE })
      .then((res) => !cancelled && setData(res))
      .catch((err) => console.error("getReviews failed:", err))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [productId]);

  async function loadMore() {
    const next = page + 1;
    setLoadingMore(true);
    try {
      const res = await getReviews(productId, { page: next, perPage: PER_PAGE });
      setData((d) => ({ ...res, items: [...d.items, ...res.items] }));
      setPage(next);
    } catch (err) {
      console.error("getReviews failed:", err);
    } finally {
      setLoadingMore(false);
    }
  }

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined, form: undefined }));
  }

  function validate() {
    const e = {};
    if (!rating) e.rating = "Select a rating";
    if (!form.name.trim()) e.name = "Enter your name";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";
    if (form.content.trim().length < 10) e.content = "Write at least 10 characters";
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    setSubmitting(true);
    try {
      await submitReview({
        productId,
        rating,
        name: form.name.trim(),
        email: form.email.trim(),
        content: form.content.trim(),
        website: form.website,
      });
      setDone(true);
      setFormOpen(false);
      setForm(EMPTY_FORM);
      setRating(0);
    } catch (err) {
      setErrors({
        form: err.response?.data?.message || "Couldn't send your review. Try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const hasMore = page < data.pages;

  return (
    <section id="reviews" className="mt-16 border-t border-slate-200 pt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Customer reviews</h2>
        {!formOpen && (
          <button
            type="button"
            onClick={() => {
              setFormOpen(true);
              setDone(false);
            }}
            className="text-sm font-medium text-slate-900 border border-slate-300 rounded-md px-4 py-2 hover:border-slate-900"
          >
            Write a review
          </button>
        )}
      </div>

      {done && (
        <p role="status" className="mb-6 rounded-md bg-emerald-50 text-emerald-800 text-sm px-4 py-3">
          Thanks for your review. It will appear once we approve it.
        </p>
      )}

      {formOpen && (
        <form onSubmit={handleSubmit} noValidate className="mb-8 rounded-lg border border-slate-200 p-5 space-y-4">
          <div>
            <span className="block text-sm text-slate-700 mb-1">Your rating</span>
            <StarInput
              value={rating}
              onChange={(n) => {
                setRating(n);
                setErrors((e) => ({ ...e, rating: undefined }));
              }}
            />
            {errors.rating && (
              <span role="alert" className="block text-sm text-red-600 mt-1">
                {errors.rating}
              </span>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Name" error={errors.name}>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                autoComplete="name"
                className={inputClass}
              />
            </Field>
            <Field label="Email (won't be shown)" error={errors.email}>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                autoComplete="email"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Your review" error={errors.content}>
            <textarea
              rows={4}
              value={form.content}
              onChange={(e) => setField("content", e.target.value)}
              className={inputClass}
            />
          </Field>

          {/* Honeypot: hidden from people, filled in by bots */}
          <div aria-hidden="true" className="absolute -left-[9999px]">
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={(e) => setField("website", e.target.value)}
            />
          </div>

          {errors.form && (
            <p role="alert" className="text-sm text-red-600">
              {errors.form}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-slate-900 text-white text-sm px-5 py-2 disabled:opacity-60"
            >
              {submitting ? "Sending..." : "Submit review"}
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-md border border-slate-300 text-sm text-slate-700 px-5 py-2"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading reviews...</p>
      ) : data.count === 0 ? (
        <p className="text-sm text-slate-500">No reviews yet. Be the first to review this product.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-8 mb-6">
            <div className="text-center">
              <div className="text-4xl font-semibold text-slate-900">{Number(data.average).toFixed(1)}</div>
              <Stars value={data.average} />
              <p className="text-xs text-slate-500 mt-1">
                {data.count} {data.count === 1 ? "review" : "reviews"}
              </p>
            </div>
            <div className="flex-1 min-w-[200px] space-y-1">
              {[5, 4, 3, 2, 1].map((n) => {
                const c = Number(data.counts?.[n] ?? 0);
                const pct = data.count ? Math.round((c / data.count) * 100) : 0;
                return (
                  <div key={n} className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="w-3">{n}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100">
                      <div className="h-1.5 rounded-full bg-slate-900" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-right">{c}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <ul className="divide-y divide-slate-200">
            {data.items.map((r) => (
              <li key={r.id} className="py-4">
                <div className="flex items-center gap-2 mb-1">
                  <Stars value={r.rating} />
                  <span className="text-sm font-medium text-slate-900">{r.author}</span>
                  {r.verified && <span className="text-xs text-emerald-700">Verified buyer</span>}
                </div>
                <p className="text-xs text-slate-400 mb-2">
                  {new Date(r.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                </p>
                <p className="text-sm text-slate-700 whitespace-pre-line">{r.content}</p>
              </li>
            ))}
          </ul>

          {hasMore && (
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="mt-4 text-sm font-medium text-slate-900 border border-slate-300 rounded-md px-4 py-2 hover:border-slate-900 disabled:opacity-60"
            >
              {loadingMore ? "Loading..." : "Show more reviews"}
            </button>
          )}
        </>
      )}
    </section>
  ); 
}