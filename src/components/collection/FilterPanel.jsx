import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SORTS } from "../../hooks/useCollection";
import { swatchColor } from "./CollectionProductCard";

const EASE = [0.22, 1, 0.36, 1];

/*
  Left filter column (desktop) / drawer content (mobile).
  Options come from WooCommerce: sub-categories, product attributes (Color, Size, Material…)
  with product counts, and the price range of the collection.
*/
export function FilterPanel({ filters, onChange, options, categories = [], swatches = {} }) {
  const toggleIn = (arr, v) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div className="text-[13px] text-[#1D2A4D]">
      <Group title="Sort by" defaultOpen>
        {SORTS.map((s) => (
          <label key={s.id} className="flex items-center gap-2.5 py-1.5 cursor-pointer">
            <input
              type="radio"
              name="sort"
              checked={filters.sort === s.id}
              onChange={() => onChange({ sort: s.id === "recommended" ? null : s.id })}
              className="accent-[#1D2A4D]"
            />
            {s.label}
          </label>
        ))}
      </Group>

      {categories.length > 0 && (
        <Group title="Category" active={filters.cats.length} defaultOpen={filters.cats.length > 0}>
          {categories.map((c) => (
            <Check
              key={c.slug}
              label={c.name}
              count={c.count}
              checked={filters.cats.includes(c.slug)}
              onChange={() => onChange({ cat: toggleIn(filters.cats, c.slug).join(",") || null })}
            />
          ))}
        </Group>
      )}

      {options.attributes.map((a) => {
        const selected = filters.attrs[a.taxonomy] || [];
        const isColor = /colou?r/i.test(`${a.taxonomy} ${a.name}`);
        return (
          <Group key={a.taxonomy} title={a.name} active={selected.length} defaultOpen={selected.length > 0}>
            {isColor ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 pt-1">
                {a.terms.map((t) => {
                  const on = selected.includes(t.slug);
                  return (
                    <button
                      key={t.slug}
                      type="button"
                      onClick={() => onChange({ [a.taxonomy]: toggleIn(selected, t.slug).join(",") || null })}
                      className={`flex items-center gap-2 text-left py-0.5 ${on ? "font-semibold" : ""}`}
                      aria-pressed={on}
                    >
                      <span
                        className={`w-4 h-4 rounded-full shrink-0 ring-1 ${on ? "ring-2 ring-[#1D2A4D] ring-offset-2" : "ring-black/15"}`}
                        style={{ background: swatchColor(a.taxonomy, t, swatches) || "#d9d4cc" }}
                      />
                      <span className="truncate">{t.name}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              a.terms.map((t) => (
                <Check
                  key={t.slug}
                  label={t.name}
                  count={t.count}
                  checked={selected.includes(t.slug)}
                  onChange={() => onChange({ [a.taxonomy]: toggleIn(selected, t.slug).join(",") || null })}
                />
              ))
            )}
          </Group>
        );
      })}

      {options.price && options.price.max > options.price.min && (
        <Group title="Price" active={filters.min || filters.max ? 1 : 0} defaultOpen={Boolean(filters.min || filters.max)}>
          <PriceRange price={options.price} min={filters.min} max={filters.max} onApply={(min, max) => onChange({ min, max })} />
        </Group>
      )}

      <Group title="Availability" active={(filters.instock ? 1 : 0) + (filters.sale ? 1 : 0)} defaultOpen={filters.instock || filters.sale}>
        <Check label="In stock" checked={filters.instock} onChange={() => onChange({ instock: filters.instock ? null : "1" })} />
        <Check label="On sale" checked={filters.sale} onChange={() => onChange({ sale: filters.sale ? null : "1" })} />
      </Group>
    </div>
  );
}

function Group({ title, children, defaultOpen = false, active = 0 }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#1D2A4D]/10">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="w-full flex items-center justify-between py-3.5 text-left">
        <span className="font-medium">
          {title}
          {active > 0 && <span className="ml-1.5 text-[11px] text-[#5B6478]">({active})</span>}
        </span>
        <motion.svg animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m6 9 6 6 6-6" />
        </motion.svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Check({ label, count, checked, onChange }) {
  return (
    <label className="flex items-center gap-2.5 py-1.5 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="accent-[#1D2A4D] w-3.5 h-3.5" />
      <span className="flex-1">{label}</span>
      {count != null && <span className="text-[11px] text-[#5B6478]">{count}</span>}
    </label>
  );
}

function PriceRange({ price, min, max, onApply }) {
  const [lo, setLo] = useState(min);
  const [hi, setHi] = useState(max);
  useEffect(() => {
    setLo(min);
    setHi(max);
  }, [min, max]);

  const field = "w-full border border-[#1D2A4D]/20 bg-white px-2 py-1.5 pl-5 text-[13px] focus:outline-none focus:border-[#1D2A4D]";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onApply(lo === "" ? null : String(lo), hi === "" ? null : String(hi));
      }}
      className="pt-1"
    >
      <div className="flex items-center gap-2">
        <label className="relative flex-1">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#5B6478]">{price.symbol}</span>
          <input type="number" min="0" inputMode="numeric" placeholder={String(price.min)} value={lo} onChange={(e) => setLo(e.target.value)} className={field} aria-label="Minimum price" />
        </label>
        <span className="text-[#5B6478]">–</span>
        <label className="relative flex-1">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#5B6478]">{price.symbol}</span>
          <input type="number" min="0" inputMode="numeric" placeholder={String(price.max)} value={hi} onChange={(e) => setHi(e.target.value)} className={field} aria-label="Maximum price" />
        </label>
      </div>
      <button type="submit" className="mt-3 w-full border border-[#1D2A4D] py-2 text-[11px] font-semibold uppercase tracking-[0.15em] hover:bg-[#1D2A4D] hover:text-white transition-colors">
        Apply
      </button>
    </form>
  );
}
