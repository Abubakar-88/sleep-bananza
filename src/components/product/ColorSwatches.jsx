import { colorToHex } from "../../utils/colorMap";

// options: [{ name, slug }] — slug is what WooCommerce variations match
// against, name is what's shown in the tooltip and used to guess the hex color.
export function ColorSwatches({ options, activeSlug, onSelect, size = "sm" }) {
  const dim = size === "sm" ? "w-5 h-5" : "w-7 h-7";
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.slug}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect(opt.slug);
          }}
          className={`${dim} rounded-full border-2 transition-all duration-150 ${
            activeSlug === opt.slug
              ? "border-slate-900 scale-110"
              : "border-white ring-1 ring-slate-200 hover:ring-slate-400 hover:scale-105"
          }`}
          style={{ backgroundColor: colorToHex(opt.name) }}
          title={opt.name}
          aria-label={opt.name}
        />
      ))}
    </div>
  );
}