export function StarRating({ rating = 0, count, size = "sm" }) {
  const filled = Math.round(Number(rating) || 0);
  const dim = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className={`flex items-center gap-1 ${dim}`}>
      <div className="flex text-amber-400 tracking-tighter">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i}>{i <= filled ? "★" : "☆"}</span>
        ))}
      </div>
      {count != null && count > 0 && <span className="text-slate-400">({count})</span>}
    </div>
  );
}