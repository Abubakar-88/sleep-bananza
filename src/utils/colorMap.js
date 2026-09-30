// Maps a WooCommerce color attribute term name (e.g. "Bitter Chocolate") to a
// swatch hex color. Checks exact names first, then partial matches (so
// "Bitter Chocolate" still matches "chocolate"), then falls back to a
// deterministic hashed hue so unknown color names still render *something*
// reasonable instead of a blank/broken swatch.
const NAMED_COLORS = {
  white: "#ffffff", black: "#111111", gray: "#9ca3af", grey: "#9ca3af",
  navy: "#1e3a5f", blue: "#3b82f6", "light blue": "#93c5fd", sky: "#7dd3fc",
  red: "#ef4444", pink: "#f9a8d4", orange: "#fb923c", coral: "#fb7185",
  yellow: "#fde047", green: "#22c55e", olive: "#84a98c", sage: "#9caf88",
  brown: "#78350f", chocolate: "#3f2a1d", beige: "#e8dcc8", cream: "#faf3e0",
  tan: "#d2b48c", charcoal: "#374151", purple: "#a855f7", teal: "#14b8a6",
  ivory: "#fffff0", stone: "#a8a29e", clay: "#b66a4f", rust: "#b7410e",
};

export function colorToHex(name = "") {
  const key = String(name).trim().toLowerCase();
  if (NAMED_COLORS[key]) return NAMED_COLORS[key];

  const found = Object.keys(NAMED_COLORS).find((k) => key.includes(k));
  if (found) return NAMED_COLORS[found];

  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 40%, 65%)`;
}