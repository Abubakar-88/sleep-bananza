import { Link, Navigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { formatPrice } from "../utils/formatPrice";
import { Button } from "../components/common/Button";
import { pageFade, fadeUp } from "../utils/motion";

export function OrderConfirmation() {
  const location = useLocation();
  const order = location.state?.order;

  // Someone landed here directly (refresh, bookmark, back button) without
  // an order in hand — there's nothing to show, send them home instead of
  // a blank/broken confirmation page.
  if (!order) {
    return <Navigate to="/" replace />;
  }

  const totals = order.totals;

  return (
    <motion.div
      variants={pageFade}
      initial="initial"
      animate="animate"
      className="max-w-lg mx-auto text-center px-4 md:px-6 py-16"
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto mb-6"
      >
        ✓
      </motion.div>

      <motion.div variants={fadeUp} initial="initial" animate="animate">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">Thank you for your order!</h1>
        <p className="text-slate-500 mb-8">
          Your order has been placed successfully. A confirmation email is on its way.
        </p>

        <div className="border border-slate-200 rounded-xl p-6 text-left space-y-3 mb-8">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Order number</span>
            <span className="font-medium text-slate-900">
              #{order.order_number || order.id || order.order_id}
            </span>
          </div>
          {order.status && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Status</span>
              <span className="font-medium text-slate-900 capitalize">{order.status}</span>
            </div>
          )}
          {totals && (
            <div className="flex justify-between text-sm pt-3 border-t border-slate-200">
              <span className="text-slate-500">Total</span>
              <span className="font-semibold text-slate-900">
                {formatPrice(totals.total_price, totals.currency_minor_unit, totals.currency_symbol)}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-center">
          <Link to="/shop">
            <Button variant="secondary">Continue Shopping</Button>
          </Link>
          <Link to="/account">
            <Button variant="accent">View My Orders</Button>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}