import { createContext, useContext, useEffect, useState } from "react";

const WishlistContext = createContext(null);
const STORAGE_KEY = "wishlist_product_ids";

// Client-side only (localStorage) — WooCommerce has no built-in wishlist REST
// endpoint without an extra plugin (e.g. YITH Wishlist). This keeps the heart
// icon working everywhere right away; swap the storage calls for real API
// calls later if/when a wishlist plugin is added to the backend.
export function WishlistProvider({ children }) {
  const [ids, setIds] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // ignore (private browsing / storage blocked)
    }
  }, [ids]);

  function toggle(productId) {
    setIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  }

  function isWishlisted(productId) {
    return ids.includes(productId);
  }

  return (
    <WishlistContext.Provider value={{ ids, toggle, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlistContext() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside a WishlistProvider");
  return ctx;
}