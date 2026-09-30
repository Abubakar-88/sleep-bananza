import { useState } from "react";
import { useCart } from "../../hooks/useCart";
import { CartDrawer } from "./CartDrawer";

export function CartIcon() {
  const { cart } = useCart();
  const [open, setOpen] = useState(false);
  const count = cart?.items_count ?? 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative text-slate-700 hover:text-slate-900"
        aria-label="Open cart"
      >
        Cart
        {count > 0 && (
          <span className="absolute -top-2 -right-3 bg-slate-900 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {count}
          </span>
        )}
      </button>
      <CartDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
