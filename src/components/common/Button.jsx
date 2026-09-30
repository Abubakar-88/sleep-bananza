export function Button({ children, variant = "primary", className = "", ...props }) {
  const base = "px-5 py-2.5 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-700",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
    outline: "border border-slate-300 text-slate-900 hover:bg-slate-50",
    accent: "bg-emerald-600 text-white hover:bg-emerald-700",
  };
  return (
    <button className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
}
