import { useCart as useCartContext } from "../context/CartContext";

// Thin re-export so components can `import { useCart } from "../hooks/useCart"`
// consistently alongside the other hooks, while the real state lives in CartContext.
export function useCart() {
  return useCartContext();
}
