import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { getMyOrders, getOrderDetail } from "../api/account";
import { Button } from "../components/common/Button";
import { Loader } from "../components/common/Loader";
import { pageFade, fadeUp, staggerContainer, staggerItem } from "../utils/motion";

const STATUS_STYLES = {
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  processing: "bg-amber-50 text-amber-700 border-amber-200",
  "on-hold": "bg-amber-50 text-amber-700 border-amber-200",
  pending: "bg-slate-100 text-slate-600 border-slate-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  refunded: "bg-slate-100 text-slate-600 border-slate-200",
  failed: "bg-rose-50 text-rose-700 border-rose-200",
};

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || "bg-slate-100 text-slate-600 border-slate-200";
  const label = status
    ? status.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase())
    : "Unknown";
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${style}`}>
      {label}
    </span>
  );
}

function money(amount, currency) {
  const n = Number(amount || 0);
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD" }).format(n);
  } catch {
    return `${currency ?? ""} ${n.toFixed(2)}`;
  }
}

function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
    } catch {
      setError("Incorrect email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      variants={pageFade}
      initial="initial"
      animate="animate"
      className="max-w-sm mx-auto px-4 md:px-6 py-16"
    >
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">Log in</h1>
      <p className="text-sm text-slate-500 mb-8">Access your orders and account details.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-slate-700 mb-1 block">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input w-full"
          />
        </div>
        <div>
          <label className="text-sm text-slate-700 mb-1 block">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input w-full"
          />
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="text-sm text-red-600"
          >
            {error}
          </motion.p>
        )}

        <motion.div whileTap={{ scale: 0.98 }}>
          <Button type="submit" variant="accent" disabled={submitting} className="w-full">
            {submitting ? "Logging in..." : "Log In"}
          </Button>
        </motion.div>
      </form>

      <p className="text-sm text-slate-500 mt-6 text-center">
        Don't have an account?{" "}
        <Link to="/register" className="text-slate-900 font-medium hover:underline">
          Create one
        </Link>
      </p>
    </motion.div>
  );
}

function OrderRow({ order }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  async function toggle() {
    if (!open && !detail) {
      setLoadingDetail(true);
      try {
        setDetail(await getOrderDetail(order.id));
      } catch (err) {
        console.error("Failed to load order detail:", err);
      } finally {
        setLoadingDetail(false);
      }
    }
    setOpen((o) => !o);
  }

  return (
    <motion.div variants={staggerItem} className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between gap-4 px-4 md:px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div>
          <p className="text-sm font-medium text-slate-900">Order #{order.number}</p>
          <p className="text-xs text-slate-500">
            {order.date_created ? new Date(order.date_created).toLocaleDateString() : ""} ·{" "}
            {order.item_count} item{order.item_count === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <StatusBadge status={order.status} />
          <span className="text-sm font-medium text-slate-900">{money(order.total, order.currency)}</span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }} className="text-slate-400">
            ▾
          </motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-slate-200 bg-slate-50/60"
          >
            <div className="px-4 md:px-5 py-4">
              {loadingDetail ? (
                <p className="text-sm text-slate-500">Loading order details...</p>
              ) : detail ? (
                <div className="space-y-3">
                  {detail.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      {item.image && (
                        <img src={item.image} alt="" className="w-12 h-12 rounded-md object-cover bg-white" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 truncate">{item.name}</p>
                        <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-sm text-slate-700">{money(item.total, order.currency)}</span>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-slate-200 text-xs text-slate-500 space-y-1">
                    <p>Payment: {detail.payment_method || "—"}</p>
                    <p>Shipping: {detail.shipping_address || "—"}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-rose-600">Couldn't load this order's details.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Dashboard() {
  const { logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMyOrders()
      .then(setOrders)
      .catch((err) => {
        console.error("Failed to load orders:", err);
        setError("Could not load your orders right now.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div variants={pageFade} initial="initial" animate="animate" className="px-4 md:px-6 py-8 max-w-3xl mx-auto">
      <motion.div variants={fadeUp} initial="initial" animate="animate" className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">My Account</h1>
          <p className="text-sm text-slate-500">Your order history and account details.</p>
        </div>
        <Button variant="outline" onClick={logout}>Log Out</Button>
      </motion.div>

      <motion.h2 variants={fadeUp} initial="initial" animate="animate" className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">
        Order History
      </motion.h2>

      {loading ? (
        <Loader label="Loading orders..." />
      ) : error ? (
        <p className="text-sm text-rose-600">{error}</p>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-200 rounded-xl">
          <p className="text-slate-500 mb-4">You haven't placed any orders yet.</p>
          <Link to="/shop">
            <Button variant="accent">Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

export function Account() {
  const { isAuthenticated, checking } = useAuth();

  if (checking) return <Loader label="Loading..." />;

  return isAuthenticated ? <Dashboard /> : <LoginForm />;
}