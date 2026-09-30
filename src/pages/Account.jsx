import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/common/Button";

export function Account() {
  const { isAuthenticated, login, logout } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(form.username, form.password);
    } catch {
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  }

  if (isAuthenticated) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-6">My Account</h1>
        <p className="text-slate-600 mb-6">You are logged in.</p>
        <Button variant="secondary" onClick={logout}>Log Out</Button>
      </div>
    );
  }

  return (
    <div className="max-w-sm">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Log In</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          placeholder="Username or email"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Logging in..." : "Log In"}
        </Button>
      </form>
    </div>
  );
}
