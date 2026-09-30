import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProducts, getProductCategories } from "../api/products";
import { decodeHtml } from "../utils/decodeHtml";
import { ProductGrid } from "../components/product/ProductGrid";

const SORT_OPTIONS = [
  { value: "menu_order-asc", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "date-desc", label: "Newest" },
  { value: "popularity-desc", label: "Best Selling" },
];

export function Collection() {
  const { slug } = useParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("menu_order-asc");
  const [priceInputs, setPriceInputs] = useState({ min: "", max: "" });
  const [priceFilter, setPriceFilter] = useState({ min: "", max: "" });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getProductCategories()
      .then(setCategories)
      .catch((err) => {
        console.error("Failed to load categories:", err);
        setError("Could not load categories from the store.");
      });
  }, []);

  const activeCategory = categories.find((c) => c.slug === slug);

  useEffect(() => {
    if (categories.length === 0) return;
    setLoading(true);
    setError(null);
    const [orderby, order] = sort.split("-");
    const params = { per_page: 24, orderby, order };
    if (activeCategory) params.category = activeCategory.id;
    // Store API accepts min_price/max_price in the shop's major currency unit (e.g. "50", not cents).
    if (priceFilter.min !== "") params.min_price = priceFilter.min;
    if (priceFilter.max !== "") params.max_price = priceFilter.max;

    getProducts(params)
      .then(setProducts)
      .catch((err) => {
        // Without this, a blocked/failed request (CORS, network, backend
        // down) looked identical to "this category genuinely has 0
        // products" — logging + surfacing it makes the real cause visible.
        console.error("Failed to load products:", err);
        setProducts([]);
        setError("Could not load products. Check the browser console / network tab for details.");
      })
      .finally(() => setLoading(false));
  }, [slug, sort, categories, activeCategory, priceFilter]);

  // Reset price filter whenever the category changes so it doesn't silently
  // carry over and confuse the shopper.
  useEffect(() => {
    setPriceInputs({ min: "", max: "" });
    setPriceFilter({ min: "", max: "" });
  }, [slug]);

  function applyPriceFilter(e) {
    e.preventDefault();
    setPriceFilter(priceInputs);
  }

  function clearPriceFilter() {
    setPriceInputs({ min: "", max: "" });
    setPriceFilter({ min: "", max: "" });
  }

  const heroImage = activeCategory?.image?.src;
  const title = activeCategory ? decodeHtml(activeCategory.name) : "All Products";
  const description = activeCategory?.description
    ? decodeHtml(activeCategory.description)
    : "Everything you need for better sleep, curated in one place.";

  const CategoryList = (
    <nav className="space-y-1">
      <Link
        to="/collection/all"
        className={`block px-3 py-2 rounded-md text-sm transition-colors ${
          !activeCategory
            ? "bg-slate-900 text-white font-medium"
            : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        All Products
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.id}
          to={`/collection/${cat.slug}`}
          className={`block px-3 py-2 rounded-md text-sm transition-colors ${
            activeCategory?.id === cat.id
              ? "bg-slate-900 text-white font-medium"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {decodeHtml(cat.name)}
        </Link>
      ))}
    </nav>
  );

  const PriceFilter = (
    <form onSubmit={applyPriceFilter} className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          placeholder="Min"
          value={priceInputs.min}
          onChange={(e) => setPriceInputs((p) => ({ ...p, min: e.target.value }))}
          className="input w-full text-sm"
        />
        <span className="text-slate-400">–</span>
        <input
          type="number"
          min="0"
          placeholder="Max"
          value={priceInputs.max}
          onChange={(e) => setPriceInputs((p) => ({ ...p, max: e.target.value }))}
          className="input w-full text-sm"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 bg-slate-900 text-white text-sm font-medium rounded-md py-2 hover:bg-slate-700 transition"
        >
          Apply
        </button>
        {(priceFilter.min || priceFilter.max) && (
          <button
            type="button"
            onClick={clearPriceFilter}
            className="text-sm text-slate-500 hover:text-slate-900 px-2"
          >
            Clear
          </button>
        )}
      </div>
    </form>
  );

  return (
    <div className="-mx-4 md:-mx-6">
      {/* Hero banner */}
      <div className="relative h-56 md:h-72 mx-4 md:mx-6 rounded-2xl overflow-hidden mb-8">
        {heroImage ? (
          <img src={heroImage} alt={title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
          <p className="text-white/70 text-xs mb-2">
            <Link to="/" className="hover:underline">Home</Link>
            {" / "}
            <Link to="/shop" className="hover:underline">Shop</Link>
            {activeCategory && <> {" / "}<span className="text-white">{title}</span></>}
          </p>
          <h1 className="text-2xl md:text-4xl font-semibold text-white mb-2">{title}</h1>
          <p className="text-white/80 text-sm max-w-lg">{description}</p>
        </div>
      </div>

      <div className="px-4 md:px-6 lg:flex lg:gap-8">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24 space-y-8">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                Categories
              </h3>
              {CategoryList}
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                Price
              </h3>
              {PriceFilter}
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {/* Mobile: horizontal category pills + filter toggle */}
          <div className="lg:hidden mb-4">
            <div className="flex gap-2 overflow-x-auto pb-2 mb-2 -mx-1 px-1">
              <Link
                to="/collection/all"
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm border transition-colors ${
                  !activeCategory
                    ? "bg-slate-900 text-white border-slate-900"
                    : "border-slate-300 text-slate-600 hover:border-slate-400"
                }`}
              >
                All
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/collection/${cat.slug}`}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-sm border transition-colors ${
                    activeCategory?.id === cat.id
                      ? "bg-slate-900 text-white border-slate-900"
                      : "border-slate-300 text-slate-600 hover:border-slate-400"
                  }`}
                >
                  {decodeHtml(cat.name)}
                </Link>
              ))}
            </div>
            <button
              onClick={() => setMobileFiltersOpen((v) => !v)}
              className="text-sm font-medium text-slate-700 border border-slate-300 rounded-md px-3 py-1.5"
            >
              {mobileFiltersOpen ? "Hide" : "Show"} Price Filter
            </button>
            {mobileFiltersOpen && (
              <div className="mt-3 border border-slate-200 rounded-lg p-4">{PriceFilter}</div>
            )}
          </div>

          {/* Sort + count bar */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
            <p className="text-sm text-slate-500">
              {loading ? "Loading..." : `${products.length} product${products.length === 1 ? "" : "s"}`}
            </p>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border border-slate-300 rounded-md px-3 py-1.5 text-sm text-slate-700"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>Sort: {opt.label}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
              {error}
            </div>
          )}
          <ProductGrid products={products} loading={loading} />
        </div>
      </div>
    </div>
  );
}