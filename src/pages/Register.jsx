import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { registerCustomer } from "../api/account";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/common/Button";
import { pageFade, fadeUp } from "../utils/motion";

export function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await registerCustomer({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
      });
      // Account created — log the customer straight in and send them to
      // their new dashboard instead of making them log in a second time.
      await login(form.email, form.password);
      navigate("/account");
    } catch (err) {
      const message =
        err.response?.data?.message || "Something went wrong creating your account. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      variants={pageFade}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-md mx-auto px-4 md:px-6 py-12"
    >
      <motion.div variants={fadeUp} initial="initial" animate="animate">
        <h1 className="text-2xl font-semibold text-slate-900 mb-1">Create an account</h1>
        <p className="text-sm text-slate-500 mb-8">
          Track orders, save your details, and check out faster next time.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-700 mb-1 block">First name</label>
              <input
                type="text"
                required
                value={form.first_name}
                onChange={(e) => update("first_name", e.target.value)}
                className="input w-full"
              />
            </div>
            <div>
              <label className="text-sm text-slate-700 mb-1 block">Last name</label>
              <input
                type="text"
                required
                value={form.last_name}
                onChange={(e) => update("last_name", e.target.value)}
                className="input w-full"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-700 mb-1 block">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="input w-full"
            />
          </div>

          <div>
            <label className="text-sm text-slate-700 mb-1 block">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              className="input w-full"
            />
          </div>

          <div>
            <label className="text-sm text-slate-700 mb-1 block">Confirm password</label>
            <input
              type="password"
              required
              value={form.confirm}
              onChange={(e) => update("confirm", e.target.value)}
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
              {submitting ? "Creating account..." : "Create Account"}
            </Button>
          </motion.div>
        </form>

        <p className="text-sm text-slate-500 mt-6 text-center">
          Already have an account?{" "}
          <Link to="/account" className="text-slate-900 font-medium hover:underline">
            Log in
          </Link>
        </p>
      </motion.div>
    </motion.div>
  );
}