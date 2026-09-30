import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CartIcon } from "../cart/CartIcon";
import { getProductCategories } from "../../api/products";
import { decodeHtml } from "../../utils/decodeHtml";

export function Header() {
  const [categories, setCategories] = useState([]);
  const [shopMenuOpen, setShopMenuOpen] = useState(false);

  useEffect(() => {
    getProductCategories().then(setCategories);
  }, []);

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-semibold tracking-tight text-slate-900">Sleep Banaza</Link>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
          <Link to="/" className="hover:text-slate-900">Home</Link>

          <div
            className="relative"
            onMouseEnter={() => setShopMenuOpen(true)}
            onMouseLeave={() => setShopMenuOpen(false)}
          >
            <Link to="/shop" className="hover:text-slate-900 flex items-center gap-1">
              Shop
              {categories.length > 0 && (
                <span className={`text-[10px] transition-transform ${shopMenuOpen ? "rotate-180" : ""}`}>
                  ▾
                </span>
              )}
            </Link>

            {shopMenuOpen && categories.length > 0 && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 w-64">
                <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 grid grid-cols-1 gap-0.5">
                  <Link
                    to="/collection/all"
                    className="px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  >
                    All Products
                  </Link>
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/collection/${cat.slug}`}
                      className="px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    >
                      {decodeHtml(cat.name)}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link to="/account" className="hover:text-slate-900">Account</Link>
        </nav>
        <CartIcon />
      </div>
    </header>
  );
}