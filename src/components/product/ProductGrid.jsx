import { useState } from "react";
import { ProductCard } from "./ProductCard";
import { QuickViewModal } from "./QuickViewModal";
import { Loader } from "../common/Loader";

export function ProductGrid({ products, loading }) {
  const [quickViewId, setQuickViewId] = useState(null);

  if (loading) return <Loader label="Loading products..." />;
  if (!products?.length) {
    return <p className="text-slate-500 py-16 text-center">No products found.</p>;
  }
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onQuickView={setQuickViewId} />
        ))}
      </div>
      {quickViewId && (
        <QuickViewModal productId={quickViewId} onClose={() => setQuickViewId(null)} />
      )}
    </>
  );
}