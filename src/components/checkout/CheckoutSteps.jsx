const STEPS = [
  { id: 1, label: "Billing" },
  { id: 2, label: "Shipping" },
  { id: 3, label: "Payment" },
];

export function CheckoutSteps({ current }) {
  return (
    <div className="flex items-center justify-center gap-3 md:gap-8">
      {STEPS.map((step, idx) => (
        <div key={step.id} className="flex items-center gap-3 md:gap-8">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                step.id <= current
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-400 border border-slate-300"
              }`}
            >
              {step.id < current ? "✓" : step.id}
            </div>
            <span
              className={`text-xs font-medium ${
                step.id <= current ? "text-slate-900" : "text-slate-400"
              }`}
            >
              {step.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div
              className={`w-10 md:w-20 h-px ${
                step.id < current ? "bg-emerald-600" : "bg-slate-300"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}