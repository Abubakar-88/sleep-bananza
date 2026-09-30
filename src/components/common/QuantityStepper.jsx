export function QuantityStepper({ quantity, disabled, onDecrease, onIncrease, size = "md" }) {
  const dims = size === "sm" ? "w-7 h-7" : "w-9 h-9";
  return (
    <div className="flex items-center border border-slate-300 rounded-md w-fit">
      <button
        type="button"
        onClick={onDecrease}
        disabled={disabled}
        className={`${dims} flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed`}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="w-9 text-center text-sm font-medium select-none">{quantity}</span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={disabled}
        className={`${dims} flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed`}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}