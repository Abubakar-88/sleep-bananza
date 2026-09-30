import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProductCard } from "../../components/product/ProductCard";
import { QuickViewModal } from "../../components/product/QuickViewModal";
import { staggerContainer, staggerItem } from "../../utils/motion";

export function ProductGrid({ products, loading }) {
  const [quickViewId, setQuickViewId] = useState(null);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square bg-slate-100 rounded-xl mb-3" />
            <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
            <div className="h-4 bg-slate-100 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="py-24 text-center text-slate-500">
        No products found.
      </div>
    );
  }

  return (
    <>
      <motion.div
        key={products.map((p) => p.id).join("-")} // re-triggers stagger when the list changes (filter/sort/page)
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
      >
        {products.map((product) => (
          <motion.div key={product.id} variants={staggerItem}>
            <ProductCard product={product} onQuickView={() => setQuickViewId(product.id)} />
          </motion.div>
        ))}
      </motion.div>

      <AnimatePresence>
        {quickViewId && (
          <QuickViewModal productId={quickViewId} onClose={() => setQuickViewId(null)} />
        )}
      </AnimatePresence>
    </>
  );
}