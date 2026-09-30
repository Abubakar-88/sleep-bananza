export function Loader({ label = "Loading..." }) {
  return (
    <div className="flex items-center justify-center py-16 text-slate-500">
      <span className="animate-pulse">{label}</span>
    </div>
  );
}
