import { createContext, useContext, useEffect, useState } from "react";
import {
  getCart,
  addToCart as apiAddToCart,
  updateCartItem as apiUpdateCartItem,
  removeCartItem as apiRemoveCartItem,
} from "../api/cart";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refreshCart() {
    setLoading(true);
    try {
      const data = await getCart();
      setCart(data);
    } catch (err) {
      console.error("Failed to load cart:", err);
    } finally {
      setLoading(false);
    }
  }

  async function addItem(productId, quantity = 1) {
    const data = await apiAddToCart(productId, quantity);
    setCart(data);
  }

  async function updateQuantity(itemKey, quantity) {
    if (quantity < 1) return removeItem(itemKey);
    const data = await apiUpdateCartItem(itemKey, quantity);
    setCart(data);
  }

  async function removeItem(itemKey) {
    const data = await apiRemoveCartItem(itemKey);
    setCart(data);
  }

  useEffect(() => {
    refreshCart();
  }, []);

  return (
    <CartContext.Provider
      value={{ cart, loading, addItem, updateQuantity, removeItem, refreshCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside a CartProvider");
  return ctx;
}