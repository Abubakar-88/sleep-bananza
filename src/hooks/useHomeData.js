import { useEffect, useRef, useState } from "react";
import { getProducts, getProductCategories } from "../api/products";
import { getStoreReviews } from "../api/homeReviews";
import { getHomeSettings } from "../api/homeSettings";
import { homeContent as defaultContent } from "../content/homeContent";

// Loads everything the Home page needs in parallel, once.
export function useHomeData() {
  const [state, setState] = useState({
    loading: true,
    error: null,
    categories: [],
    featured: [],
    popular: [],
    stats: { avgRating: 0, totalReviews: 0 },
    content: defaultContent,
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [cats, featured, popular, settings] = await Promise.all([
          getProductCategories(),
          getProducts({ featured: true, per_page: 12 }),
          getProducts({ orderby: "popularity", order: "desc", per_page: 12 }),
          // WP Admin → Home Page. If it fails, the page still works with the default text.
          getHomeSettings().catch((e) => {
            console.warn("Home settings not loaded, using defaults:", e?.message);
            return null;
          }),
        ]);
        if (!alive) return;

        const usable = (cats || []).filter((c) => c.count > 0 && c.slug !== "uncategorized");
        const topLevel = usable.filter((c) => c.parent === 0);
        const categories = (topLevel.length ? topLevel : usable).sort((a, b) => b.count - a.count);

        const featuredList = featured?.length ? featured : popular || [];
        setState({
          loading: false,
          error: null,
          categories,
          featured: featuredList,
          popular: popular || [],
          stats: computeStats([...featuredList, ...(popular || [])], categories),
          content: mergeContent(defaultContent, settings),
        });
      } catch (err) {
        console.error("Home data failed:", err);
        if (alive) setState((s) => ({ ...s, loading: false, error: err }));
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return state;
}

// Products for one category tab (cached per tab so switching back is instant)
export function useCategoryProducts(categoryId, fallback) {
  const cache = useRef({});
  const [products, setProducts] = useState(fallback || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!categoryId) {
      setProducts(fallback || []);
      return;
    }
    if (cache.current[categoryId]) {
      setProducts(cache.current[categoryId]);
      return;
    }
    let alive = true;
    setLoading(true);
    getProducts({ category: String(categoryId), per_page: 10 })
      .then((list) => {
        cache.current[categoryId] = list;
        if (alive) setProducts(list);
      })
      .catch((e) => console.error(e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [categoryId, fallback]);

  return { products, loading };
}

// Reviews, optionally filtered by category (cached per tab)
export function useReviews(categoryId, perPage = 12) {
  const cache = useRef({});
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const key = categoryId || "all";
    if (cache.current[key]) {
      setReviews(cache.current[key]);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    const params = { per_page: perPage, orderby: "date_gmt", order: "desc" };
    if (categoryId) params.category_id = categoryId;
    getStoreReviews(params)
      .then((list) => {
        cache.current[key] = list || [];
        if (alive) setReviews(list || []);
      })
      .catch((e) => {
        console.error(e);
        if (alive) setReviews([]);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [categoryId, perPage]);

  return { reviews, loading };
}

// WordPress values win; empty fields fall back to the defaults in content/homeContent.js
function mergeContent(defaults, wp) {
  if (!wp || typeof wp !== "object") return defaults;
  const out = { ...defaults };
  for (const key of Object.keys(defaults)) {
    const d = defaults[key];
    const v = wp[key];
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(d) || Array.isArray(v)) {
      if (Array.isArray(v) && v.length) out[key] = v;
    } else if (d && typeof d === "object" && typeof v === "object" && !("src" in v)) {
      out[key] = mergeContent(d, v);
    } else {
      out[key] = v; // text, or an image object { src, width, height, srcset }
    }
  }
  return out;
}

function computeStats(products, categories) {
  const seen = new Set();
  let weighted = 0;
  let count = 0;
  for (const p of products) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    const rating = Number(p.average_rating || 0);
    const n = Number(p.review_count || 0);
    if (rating > 0 && n > 0) {
      weighted += rating * n;
      count += n;
    }
  }
  const catReviews = categories.reduce((sum, c) => sum + Number(c.review_count || 0), 0);
  return {
    avgRating: count ? Math.round((weighted / count) * 10) / 10 : 0,
    totalReviews: Math.max(count, catReviews),
  };
}
