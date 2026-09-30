import { useState } from "react";
import { useProducts } from "../hooks/useProducts";
import { ProductGrid } from "../components/product/ProductGrid";

export function Shop() {
  const [search, setSearch] = useState("");
  const { products, loading } = useProducts({ per_page: 24, search: search || undefined });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Shop</h1>
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-slate-300 rounded-md px-3 py-2 text-sm w-64"
        />
      </div>
      <ProductGrid products={products} loading={loading} />
    </div>
  );
}
