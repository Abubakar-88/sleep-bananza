import { Routes, Route } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { Home } from "../pages/Home";
import { Shop } from "../pages/Shop";
import { Collection } from "../pages/Collection";
import { ProductDetail } from "../pages/ProductDetail";
import { Cart } from "../pages/Cart";
import { Checkout } from "../pages/Checkout";
import { Account } from "../pages/Account";
import { NotFound } from "../pages/NotFound";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Shop />} />
        <Route path="collection/:slug" element={<Collection />} />
        <Route path="product/:id" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="account" element={<Account />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}