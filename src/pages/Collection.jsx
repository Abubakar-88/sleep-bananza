import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { countActive, readFilters, useCollectionPage, useCollectionProducts, useFilterOptions, useGridCells } from "../hooks/useCollection";
import { CollectionProductCard } from "../components/collection/CollectionProductCard";
import { FilterPanel } from "../components/collection/FilterPanel";
import { PromoTile, promoSpan } from "../components/collection/PromoTile";
import { LookPair } from "../components/common/Hotspots";
import { FaqList, FullWidthPage, HowToSteps, PageHero, ProductRail, Wide } from "../components/pages/PageSections";

/*
  /collection/:slug   (slug = product category slug, or "all")
  Banner:      Products → Categories → Edit (banner image / text), default in WP Admin → Collection Pages
  Promo tiles, shop-the-look, carousel, steps, FAQ: WP Admin → Collection Pages
  Products, filters, prices, swatches: WooCommerce
*/
export function Collection() {
  const { slug = "all" } = useParams();
  const [sp, setSp] = useSearchParams();
  const filters = useMemo(() => readFilters(sp), [sp]);

  const { loading: pageLoading, notFound, data: page } = useCollectionPage(slug);
  const ready = !pageLoading && !notFound;
  const categoryId = page.category?.id || null;

  const options = useFilterOptions({ ready, categoryId });
  const minor = options.price?.minor ?? 2;
  const list = useCollectionProducts({ ready, categoryId, children: page.children || [], filters, minor });
  const cells = useGridCells(list.items, page.promos, list.hasMore);

  const [showFilters, setShowFilters] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const cols = useColumns(showFilters);
  const active = countActive(filters);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [slug]);

  // patch = { key: value | null } → updates the URL (?sort=…&pa_color=…)
  const update = (patch) => {
    const next = new URLSearchParams(sp);
    Object.entries(patch).forEach(([k, v]) => (v == null || v === "" ? next.delete(k) : next.set(k, v)));
    setSp(next, { replace: true });
  };
  const clearAll = () => {
    const next = new URLSearchParams();
    if (filters.search) next.set("search", filters.search);
    if (filters.sort !== "recommended") next.set("sort", filters.sort);
    setSp(next, { replace: true });
  };

  if (notFound) {
    return (
      <FullWidthPage>
        <Wide className="py-32 text-center">
          <h1 className="font-serif text-3xl">Collection not found</h1>
          <Link to="/collection/all" className="inline-block mt-6 underline underline-offset-4">Shop all products</Link>
        </Wide>
      </FullWidthPage>
    );
  }

  const hero = page.hero || {};
  const title = filters.search ? `Results for “${filters.search}”` : hero.title || page.category?.name || "Shop All";
  const panel = (
    <FilterPanel filters={filters} onChange={update} options={options} categories={page.children || []} swatches={page.swatches} />
  );

  return (
    <FullWidthPage className="pb-10">
      {pageLoading ? (
        <div className="h-[40vh] min-h-[300px] bg-[#EFE9E1] animate-pulse" />
      ) : (
        <PageHero eyebrow={filters.search ? "" : hero.eyebrow} title={title} text={filters.search ? "" : hero.text} image={hero.image} className="h-[40vh] min-h-[300px] max-h-[460px]" />
      )}

      <Wide className="pt-5">
        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          className="flex items-center justify-between gap-4 pb-4 border-b border-[#1D2A4D]/10 text-[13px]"
        >
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setShowFilters(!showFilters)} className="hidden lg:inline-flex items-center gap-2 font-medium hover:underline underline-offset-4">
              <FilterIcon /> {showFilters ? "Hide filters" : "Show filters"}
              {active > 0 && <span className="text-[#5B6478]">({active})</span>}
            </button>
            <button type="button" onClick={() => setDrawer(true)} className="lg:hidden inline-flex items-center gap-2 border border-[#1D2A4D]/25 px-3 py-2 font-medium">
              <FilterIcon /> Filter &amp; sort {active > 0 && <span className="text-[#5B6478]">({active})</span>}
            </button>
          </div>
          <span className="text-[#5B6478]">{list.total != null ? `${list.total} product${list.total === 1 ? "" : "s"}` : ""}</span>
        </motion.div>

        {active > 0 && <ActiveChips filters={filters} page={page} options={options} onChange={update} onClear={clearAll} />}

        <div className="flex gap-8 pt-6">
          {/* Desktop sidebar */}
          <AnimatePresence initial={false} mode="popLayout">
            {showFilters && (
              <motion.aside
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="hidden lg:block shrink-0 w-[240px]"
              >
                <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 [scrollbar-width:thin]">{panel}</div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Grid */}
          <div className="flex-1 min-w-0">
            {list.loading ? (
              <GridSkeleton cols={showFilters ? 3 : 4} />
            ) : list.error && !list.items.length ? (
              <p className="py-20 text-center text-[#5B6478]">Products could not be loaded. Please refresh the page.</p>
            ) : !list.items.length ? (
              <div className="py-20 text-center">
                <p className="font-serif text-2xl">No products match these filters</p>
                {active > 0 && (
                  <button type="button" onClick={clearAll} className="mt-5 underline underline-offset-4 text-sm">
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className={`grid grid-cols-2 ${showFilters ? "lg:grid-cols-3" : "lg:grid-cols-4"} gap-x-3 md:gap-x-5 gap-y-10 grid-flow-row-dense`}>
                {cells.map((cell, i) =>
                  cell.type === "promo" ? (
                    <div key={cell.key} className={promoSpan(cell.promo.size)}>
                      <PromoTile promo={cell.promo} delay={(i % cols) * 0.12} />
                    </div>
                  ) : (
                    <motion.div
                      key={cell.key}
                      initial={{ opacity: 0, y: 60 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.15, margin: "0px 0px -60px 0px" }}
                      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: (i % cols) * 0.12 }}
                    >
                      <CollectionProductCard product={cell.product} swatches={page.swatches} eager={i < 6} />
                    </motion.div>
                  )
                )}
              </div>
            )}

            {list.hasMore && !list.loading && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="mt-14 text-center"
              >
                {list.total != null && (
                  <p className="text-xs text-[#5B6478] mb-3">
                    Showing {list.items.length} of {list.total}
                  </p>
                )}
                <button
                  type="button"
                  onClick={list.loadMore}
                  disabled={list.loadingMore}
                  className="min-w-[200px] bg-[#1D2A4D] text-white text-[11px] font-semibold uppercase tracking-[0.18em] px-8 py-3.5 hover:bg-[#2b3c6b] transition-colors disabled:opacity-60"
                >
                  {list.loadingMore ? "Loading…" : "Load more"}
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Sections below the grid (WP Admin → Collection Pages) */}
        {page.howTo && <HowToSteps {...page.howTo} />}
        {page.faq && <FaqList {...page.faq} />}
        {page.looks?.length > 0 && <LookPair looks={page.looks} className="py-10" />}
        {page.styled && <ProductRail title={page.styled.title} source={page.styled} swatches={page.swatches} />}
      </Wide>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {drawer && (
          <motion.div className="fixed inset-0 z-[60] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 left-0 w-[86%] max-w-sm bg-[#FBF9F6] flex flex-col"
              role="dialog"
              aria-label="Filter and sort"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#1D2A4D]/10">
                <p className="font-serif text-xl">Filter &amp; sort</p>
                <button type="button" onClick={() => setDrawer(false)} aria-label="Close" className="text-2xl leading-none">×</button>
              </div>
              <div className="flex-1 overflow-y-auto px-5">{panel}</div>
              <div className="p-4 border-t border-[#1D2A4D]/10 flex gap-3">
                {active > 0 && (
                  <button type="button" onClick={clearAll} className="flex-1 border border-[#1D2A4D] py-3 text-[11px] font-semibold uppercase tracking-[0.15em]">
                    Clear
                  </button>
                )}
                <button type="button" onClick={() => setDrawer(false)} className="flex-[2] bg-[#1D2A4D] text-white py-3 text-[11px] font-semibold uppercase tracking-[0.15em]">
                  {list.total != null ? `View ${list.total} products` : "View products"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </FullWidthPage>
  );
}

// how many product columns are visible right now (2 on phones, 3 or 4 on desktop)
function useColumns(showFilters) {
  const get = () => (typeof window !== "undefined" && window.innerWidth >= 1024 ? (showFilters ? 3 : 4) : 2);
  const [cols, setCols] = useState(get);
  useEffect(() => {
    const on = () => setCols(get());
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFilters]);
  return cols;
}

function ActiveChips({ filters, page, options, onChange, onClear }) {
  const chips = [];
  const remove = (key, arr, v) => onChange({ [key]: arr.filter((x) => x !== v).join(",") || null });
  filters.cats.forEach((s) => chips.push({ label: page.children?.find((c) => c.slug === s)?.name || s, off: () => remove("cat", filters.cats, s) }));
  Object.entries(filters.attrs).forEach(([tax, slugs]) => {
    const group = options.attributes.find((a) => a.taxonomy === tax);
    slugs.forEach((s) => chips.push({ label: group?.terms.find((t) => t.slug === s)?.name || s, off: () => remove(tax, slugs, s) }));
  });
  const sym = options.price?.symbol || "$";
  if (filters.min) chips.push({ label: `From ${sym}${filters.min}`, off: () => onChange({ min: null }) });
  if (filters.max) chips.push({ label: `Up to ${sym}${filters.max}`, off: () => onChange({ max: null }) });
  if (filters.instock) chips.push({ label: "In stock", off: () => onChange({ instock: null }) });
  if (filters.sale) chips.push({ label: "On sale", off: () => onChange({ sale: null }) });

  return (
    <div className="flex flex-wrap items-center gap-2 pt-4 text-xs">
      {chips.map((c, i) => (
        <button key={i} type="button" onClick={c.off} className="inline-flex items-center gap-1.5 bg-[#EFE9E1] px-3 py-1.5 hover:bg-[#E5DDD2]">
          {c.label} <span aria-hidden className="text-sm leading-none">×</span>
        </button>
      ))}
      <button type="button" onClick={onClear} className="ml-1 underline underline-offset-4 text-[#5B6478]">
        Clear all
      </button>
    </div>
  );
}

function GridSkeleton({ cols }) {
  return (
    <div className={`grid grid-cols-2 ${cols === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"} gap-x-3 md:gap-x-5 gap-y-10`}>
      {Array.from({ length: cols * 2 }).map((_, i) => (
        <div key={i}>
          <div className="aspect-[4/5] bg-[#F4F1EC] animate-pulse" />
          <div className="mt-3 h-4 w-3/4 bg-[#F4F1EC] animate-pulse" />
          <div className="mt-2 h-3 w-1/3 bg-[#F4F1EC] animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  );
}