import { Link } from "react-router-dom";
import { useProducts } from "../hooks/useProducts";
import { ProductGrid } from "../components/product/ProductGrid";
import { Button } from "../components/common/Button";

export function Home() {
  const { products, loading } = useProducts({ per_page: 8, featured: true });

  return (
    <div>
      <section className="text-center py-16">
        <h1 className="text-4xl font-semibold text-slate-900 mb-4">
          Better Sleep, Better Days
        </h1>
        <p className="text-slate-600 max-w-xl mx-auto mb-8">
          Sleep care, bedding, lighting and wellness essentials — curated for
          rest and recovery.
        </p>
        <Link to="/shop">
          <Button>Shop the Collection</Button>
        </Link>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Featured Products</h2>
        <ProductGrid products={products} loading={loading} />
      </section>
    </div>
  );
}
