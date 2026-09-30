import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getProducts } from "../api/products";
import { ProductGrid } from "../components/product/ProductGrid";
import { pageFade, fadeUp } from "../utils/motion";

const SORT_OPTIONS = [
  { value: "menu_order-asc", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "date-desc", label: "Newest" },
  { value: "popularity-desc", label: "Best Selling" },
];

export function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("menu_order-asc");
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const [orderby, order] = sort.split("-");

    getProducts({ per_page: 24, orderby, order })
      .then(setProducts)
      .catch((err) => {
        console.error("Failed to load products:", err);
        setProducts([]);
        setError("Could not load products. Check the browser console / network tab for details.");
      })
      .finally(() => setLoading(false));
  }, [sort]);

  return (
    <motion.div
      variants={pageFade}
      initial="initial"
      animate="animate"
      exit="exit"
      className="px-4 md:px-6"
    >
      <motion.div variants={fadeUp} className="border-b border-slate-200 pb-6 mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-1">Shop All</h1>
        <p className="text-sm text-slate-500">
          Everything you need for better sleep, in one place.
        </p>
      </motion.div>

      <motion.div
        variants={fadeUp}
        className="flex items-center justify-between mb-6"
      >
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
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700"
        >
          {error}
        </motion.div>
      )}

      {/* ProductGrid handles its own enter animation (staggered fade+rise per
          card) — re-runs automatically whenever `products` changes because
          it keys its animated wrapper off the product id list. */}
      <ProductGrid products={products} loading={loading} />
    </motion.div>
  );
}