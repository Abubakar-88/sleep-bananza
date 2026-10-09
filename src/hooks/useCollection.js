import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAttributeTerms, getAttributes, getCollectionData, getCollectionPage, getProductsPaged } from "../api/pages";
import { getProductCategories } from "../api/products";
import { decodeHtml } from "../utils/decodeHtml";

export const PER_PAGE = 24;

export const SORTS = [
  { id: "recommended", label: "Recommended", orderby: "menu_order", order: "asc" },
  { id: "popular", label: "Best selling", orderby: "popularity", order: "desc" },
  { id: "newest", label: "Newest", orderby: "date", order: "desc" },
  { id: "rating", label: "Top rated", orderby: "rating", order: "desc" },
  { id: "price-asc", label: "Price: low to high", orderby: "price", order: "asc" },
  { id: "price-desc", label: "Price: high to low", orderby: "price", order: "desc" },
];

/* ---------------- Page data (banner, promo tiles, extra sections) ---------------- */

const EMPTY_PAGE = { category: null, hero: {}, children: [], promos: [], looks: [], styled: null, howTo: null, faq: null, swatches: {} };

export function useCollectionPage(slug) {
  const [state, setState] = useState({ loading: true, notFound: false, data: EMPTY_PAGE });

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, notFound: false }));
    (async () => {
      let data;
      try {
        data = { ...EMPTY_PAGE, ...(await getCollectionPage(slug)) };
      } catch (e) {
        if (e?.response?.status === 404) {
          if (alive) setState({ loading: false, notFound: true, data: EMPTY_PAGE });
          return;
        }
        // WordPress plugin missing/unreachable → build the basics from the Store API
        console.warn("Collection settings not loaded, using WooCommerce category only:", e?.message);
        data = await fallbackPage(slug);
        if (!data) {
          if (alive) setState({ loading: false, notFound: true, data: EMPTY_PAGE });
          return;
        }
      }
      // "All products": offer the top-level categories as a filter
      if (!data.category && !data.children?.length) {
        const cats = await getProductCategories().catch(() => []);
        data.children = (cats || [])
          .filter((c) => c.parent === 0 && c.count > 0 && c.slug !== "uncategorized")
          .map((c) => ({ id: c.id, name: decodeHtml(c.name), slug: c.slug, count: c.count }));
      }
      if (alive) setState({ loading: false, notFound: false, data });
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  return state;
}

async function fallbackPage(slug) {
  if (slug === "all") return { ...EMPTY_PAGE, hero: { title: "Shop All" } };
  const cats = await getProductCategories().catch(() => []);
  const cat = (cats || []).find((c) => c.slug === slug);
  if (!cat) return null;
  const desc = String(cat.description || "").replace(/<[^>]*>/g, "").trim();
  return {
    ...EMPTY_PAGE,
    category: { id: cat.id, name: decodeHtml(cat.name), slug: cat.slug, count: cat.count, description: desc },
    hero: { title: decodeHtml(cat.name), text: desc, image: null },
    children: cats.filter((c) => c.parent === cat.id && c.count > 0).map((c) => ({ id: c.id, name: decodeHtml(c.name), slug: c.slug, count: c.count })),
  };
}

/* ---------------- Filters in the URL (?sort=&cat=&pa_color=&min=&max=&instock=1&sale=1&search=) ---------------- */

export function readFilters(sp) {
  const list = (k) => (sp.get(k) || "").split(",").map((s) => s.trim()).filter(Boolean);
  const attrs = {};
  for (const [k] of sp.entries()) if (k.startsWith("pa_")) attrs[k] = list(k);
  return {
    sort: SORTS.some((s) => s.id === sp.get("sort")) ? sp.get("sort") : "recommended",
    cats: list("cat"),
    attrs,
    min: sp.get("min") || "",
    max: sp.get("max") || "",
    instock: sp.get("instock") === "1",
    sale: sp.get("sale") === "1",
    search: sp.get("search") || "",
  };
}

export function countActive(f) {
  return f.cats.length + Object.values(f.attrs).reduce((n, v) => n + v.length, 0) + (f.min ? 1 : 0) + (f.max ? 1 : 0) + (f.instock ? 1 : 0) + (f.sale ? 1 : 0);
}

function buildQuery({ categoryId, children, filters: f, page, minor }) {
  const qs = new URLSearchParams({ per_page: String(PER_PAGE), page: String(page) });
  const sort = SORTS.find((s) => s.id === f.sort) || SORTS[0];
  qs.set("orderby", sort.orderby);
  qs.set("order", sort.order);

  const catIds = f.cats.map((slug) => children.find((c) => c.slug === slug)?.id).filter(Boolean);
  if (catIds.length) {
    qs.set("category", catIds.join(","));
    qs.set("category_operator", "in");
  } else if (categoryId) {
    qs.set("category", String(categoryId));
  }

  Object.entries(f.attrs).forEach(([tax, slugs], i) => {
    if (!slugs.length) return;
    qs.append(`attributes[${i}][attribute]`, tax);
    slugs.forEach((s) => qs.append(`attributes[${i}][slug][]`, s));
    qs.append(`attributes[${i}][operator]`, "in");
  });

  const toMinor = (v) => String(Math.round(Number(v) * 10 ** minor));
  if (f.min !== "" && !isNaN(Number(f.min))) qs.set("min_price", toMinor(f.min));
  if (f.max !== "" && !isNaN(Number(f.max))) qs.set("max_price", toMinor(f.max));
  if (f.instock) qs.append("stock_status[]", "instock");
  if (f.sale) qs.set("on_sale", "true");
  if (f.search) qs.set("search", f.search);
  return qs;
}

/* ---------------- Product list with "Load more" ---------------- */

export function useCollectionProducts({ ready, categoryId, children, filters, minor = 2 }) {
  const [state, setState] = useState({ items: [], total: null, page: 0, loading: true, loadingMore: false, hasMore: false, error: null });
  const reqId = useRef(0);
  const key = JSON.stringify([categoryId, filters, children.map((c) => c.id)]);

  const fetchPage = useCallback(
    async (page, append) => {
      const id = ++reqId.current;
      setState((s) => ({ ...s, loading: !append, loadingMore: append, error: null }));
      try {
        const qs = buildQuery({ categoryId, children, filters, page, minor });
        const { items, total } = await getProductsPaged(qs.toString());
        if (id !== reqId.current) return; // a newer request replaced this one
        setState((s) => {
          const all = append ? [...s.items, ...items.filter((p) => !s.items.some((x) => x.id === p.id))] : items;
          const hasMore = total != null ? all.length < total : items.length === PER_PAGE;
          return { items: all, total, page, loading: false, loadingMore: false, hasMore, error: null };
        });
      } catch (e) {
        if (id !== reqId.current) return;
        console.error("Collection products failed:", e);
        setState((s) => ({ ...s, loading: false, loadingMore: false, error: e }));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, minor]
  );

  useEffect(() => {
    if (ready) fetchPage(1, false);
  }, [ready, fetchPage]);

  const loadMore = () => !state.loadingMore && state.hasMore && fetchPage(state.page + 1, true);
  return { ...state, loadMore };
}

/* ---------------- Filter options (attributes + counts + price range) ---------------- */

let attributesCache = null;
const termsCache = {};

export function useFilterOptions({ ready, categoryId }) {
  const [opts, setOpts] = useState({ attributes: [], price: null, loading: true });

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    (async () => {
      try {
        attributesCache = attributesCache || (await getAttributes());
        const attrs = attributesCache || [];
        const [data] = await Promise.all([
          getCollectionData({ categoryId, taxonomies: attrs.map((a) => a.taxonomy) }),
          ...attrs.map(async (a) => (termsCache[a.id] = termsCache[a.id] || (await getAttributeTerms(a.id).catch(() => [])))),
        ]);
        const counts = new Map((data.attribute_counts || []).map((c) => [Number(c.term), Number(c.count)]));

        const groups = [];
        for (const a of attrs) {
          const terms = termsCache[a.id]
            .map((t) => ({ id: t.id, name: decodeHtml(t.name), slug: t.slug, count: counts.has(t.id) ? counts.get(t.id) : 0 }))
            .filter((t) => t.count > 0);
          if (terms.length) groups.push({ id: a.id, name: decodeHtml(a.name), taxonomy: a.taxonomy, terms });
        }

        const pr = data.price_range;
        const minor = pr?.currency_minor_unit ?? 2;
        const price = pr
          ? {
              min: Math.floor(Number(pr.min_price) / 10 ** minor),
              max: Math.ceil(Number(pr.max_price) / 10 ** minor),
              symbol: pr.currency_symbol || "$",
              minor,
            }
          : null;
        if (alive) setOpts({ attributes: groups, price, loading: false });
      } catch (e) {
        console.warn("Filter options failed:", e?.message);
        if (alive) setOpts({ attributes: [], price: null, loading: false });
      }
    })();
    return () => {
      alive = false;
    };
  }, [ready, categoryId]);

  return opts;
}

/* Grid cells: products with the admin promo tiles placed "after product N" */
export function useGridCells(products, promos, hasMore) {
  return useMemo(() => {
    const cells = [];
    const list = [...(promos || [])].sort((a, b) => a.after - b.after);
    let pi = 0;
    products.forEach((p, i) => {
      while (pi < list.length && list[pi].after <= i) cells.push({ type: "promo", promo: list[pi++], key: `promo-${pi}` });
      cells.push({ type: "product", product: p, key: p.id });
    });
    // tiles set after the last product are shown once everything is loaded
    if (!hasMore) while (pi < list.length) cells.push({ type: "promo", promo: list[pi++], key: `promo-${pi}` });
    return cells;
  }, [products, promos, hasMore]);
}
