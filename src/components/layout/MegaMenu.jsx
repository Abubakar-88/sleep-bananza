import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useMenu } from "../../hooks/useMenu";
import { hasClass, isExternal, menuLink } from "../../utils/menuLink";

/*
  Mega menu — the menu itself comes from WordPress (Appearance → Menus).
  Two panel layouts are picked automatically per top-level item:

  1) COLUMNS  (top item has sub-items that themselves have sub-items)
     e.g. Shop All → [Weighted Blankets → (Cotton, Kids…)], [Pillows → (…)] …
     → groups spread over 3 columns + a feature image card on the right.

  2) CARDS    (top item has only plain sub-items)
     e.g. Weighted Blankets → Cotton, TENCEL, Kids, Queen…
     → link list on the left + up to 3 image cards on the right.
*/

const EASE = [0.22, 1, 0.36, 1];
const FULL_BLEED = { width: "100vw", position: "relative", left: "50%", marginLeft: "-50vw" };

export function MegaMenu({ location = "primary" }) {
  const { items, loading } = useMenu(location);
  const [openId, setOpenId] = useState(null);
  const timer = useRef(null);
  const { pathname, search } = useLocation();

  // close on navigation and on Escape
  useEffect(() => setOpenId(null), [pathname, search]);
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpenId(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  // small hover-intent delays so the panel doesn't flicker when the mouse passes by
  const open = (id) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpenId(id), openId ? 0 : 90);
  };
  const scheduleClose = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpenId(null), 160);
  };

  const active = items.find((i) => i.id === openId && i.children?.length);

  return (
    <nav
      aria-label="Main"
      className="hidden lg:block z-40"
      style={FULL_BLEED}
      onMouseLeave={scheduleClose}
      onMouseEnter={() => clearTimeout(timer.current)}
    >
      <div className="bg-[#DFE6F0]">
        <ul className="flex items-center justify-center gap-x-8 xl:gap-x-10 h-14 px-6">
          {loading
            ? Array.from({ length: 7 }).map((_, i) => (
                <li key={i} className="h-3 w-20 rounded-full bg-white/70 animate-pulse" />
              ))
            : items.map((item) => (
                <TopItem
                  key={item.id}
                  item={item}
                  isOpen={item.id === openId}
                  onOpen={() => (item.children?.length ? open(item.id) : scheduleClose())}
                />
              ))}
        </ul>
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="absolute left-0 right-0 top-full bg-white rounded-b-3xl shadow-[0_30px_60px_-20px_rgba(29,42,77,0.25)]"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="mx-auto max-w-[1600px] px-6 xl:px-8 py-8"
              >
                {isColumnsLayout(active) ? <ColumnsPanel item={active} /> : <CardsPanel item={active} />}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

const isColumnsLayout = (item) => item.children.some((c) => c.children?.length);

// ---------- Top bar item ----------
function TopItem({ item, isOpen, onOpen }) {
  const hasPanel = item.children?.length > 0;
  const highlight = hasClass(item, "menu-highlight");
  return (
    <li onMouseEnter={onOpen} className="relative flex items-center gap-2">
      <AppLink
        to={menuLink(item)}
        target={item.target}
        onFocus={onOpen}
        aria-haspopup={hasPanel ? "true" : undefined}
        aria-expanded={hasPanel ? isOpen : undefined}
        className={`group relative py-4 text-[15px] font-medium whitespace-nowrap ${
          highlight ? "text-[#D2453B]" : "text-[#1D2A4D]"
        }`}
      >
        {item.title}
        <span
          className={`absolute left-0 right-0 bottom-3 h-[2px] rounded-full bg-current origin-left transition-transform duration-300 ${
            isOpen ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
          }`}
        />
      </AppLink>
      {item.badge && <Badge text={item.badge} dark />}
    </li>
  );
}

// ---------- Layout 1: grouped columns + feature card ----------
function ColumnsPanel({ item }) {
  const featureChild = item.children.find((c) => hasClass(c, "mega-feature"));
  const groups = item.children.filter((c) => c !== featureChild);
  const feature = featureChild || (item.image ? item : null);
  const columns = useMemo(() => splitIntoColumns(groups, 3), [groups]);

  return (
    <div className={`grid gap-0 ${feature ? "grid-cols-[1fr_1fr_1fr_1.25fr]" : "grid-cols-3"}`}>
      {columns.map((col, ci) => (
        <Stagger key={ci} className={`px-6 first:pl-0 ${ci > 0 ? "border-l border-[#E6EAF1]" : ""}`}>
          {col.map((group) => (
            <StaggerItem key={group.id} className="mb-8 last:mb-0">
              <AppLink to={menuLink(group)} className="text-[17px] font-semibold text-[#1D2A4D] hover:underline underline-offset-4">
                {group.title}
              </AppLink>
              <ul className="mt-4 space-y-3">
                {group.children.map((link) => (
                  <li key={link.id}>
                    <MenuLinkRow item={link} />
                  </li>
                ))}
              </ul>
            </StaggerItem>
          ))}
          {ci === 0 && (
            <StaggerItem className="mt-8">
              <ShopAllButton item={item} label="Shop all collections" />
            </StaggerItem>
          )}
        </Stagger>
      ))}

      {feature && (
        <div className="pl-6 border-l border-[#E6EAF1]">
          <FeatureCard item={feature} />
        </div>
      )}
    </div>
  );
}

// ---------- Layout 2: link list + image cards ----------
function CardsPanel({ item }) {
  const leaves = item.children;
  const forced = leaves.filter((c) => hasClass(c, "mega-card"));
  const cards = (forced.length ? forced : leaves.filter((c) => c.image)).slice(0, 3);

  return (
    <div className={`grid ${cards.length ? "grid-cols-[minmax(240px,1fr)_3fr]" : "grid-cols-1"} gap-0`}>
      <div className="flex flex-col justify-between pr-8">
        <Stagger>
          <ul className="space-y-3">
            {leaves.map((link) => (
              <StaggerItem as="li" key={link.id}>
                <MenuLinkRow item={link} />
              </StaggerItem>
            ))}
          </ul>
        </Stagger>
        <div className="mt-10">
          <ShopAllButton item={item} label={`Shop all ${item.title}`} />
        </div>
      </div>

      {cards.length > 0 && (
        <Stagger className="grid grid-cols-3 gap-6 pl-8 border-l border-[#E6EAF1]">
          {cards.map((card) => (
            <StaggerItem key={card.id}>
              <ImageCard item={card} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}

// ---------- Pieces ----------
function MenuLinkRow({ item }) {
  return (
    <AppLink
      to={menuLink(item)}
      target={item.target}
      className="inline-flex items-center gap-2 text-[15px] text-[#4A5878] hover:text-[#1D2A4D] transition-colors"
    >
      <span className="relative after:absolute after:left-0 after:-bottom-0.5 after:h-px after:w-full after:bg-current after:scale-x-0 after:origin-left after:transition-transform after:duration-300 hover:after:scale-x-100">
        {item.title}
      </span>
      {item.badge && <Badge text={item.badge} dark={hasClass(item, "badge-dark")} />}
    </AppLink>
  );
}

function Badge({ text, dark = false }) {
  return (
    <span
      className={`text-[10px] leading-none font-semibold px-2 py-1 rounded-full whitespace-nowrap ${
        dark ? "bg-[#1D2A4D] text-white" : "bg-[#E6EBF3] text-[#4A5878]"
      }`}
    >
      {text}
    </span>
  );
}

function ShopAllButton({ item, label }) {
  return (
    <AppLink
      to={menuLink(item)}
      className="inline-flex items-center px-6 py-3 rounded-full bg-[#DFE6F0] text-[#1D2A4D] text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-[#1D2A4D] hover:text-white"
    >
      {label}
    </AppLink>
  );
}

function MenuImage({ image, className, sizes }) {
  if (!image?.src) return <div className={`${className} bg-[#EEF1F6]`} />;
  return (
    <img
      src={image.src}
      srcSet={image.srcset || undefined}
      sizes={image.srcset ? sizes : undefined}
      alt={image.alt || ""}
      loading="lazy"
      decoding="async"
      className={`${className} object-cover transition-transform duration-700 ease-out group-hover:scale-105`}
    />
  );
}

function ImageCard({ item }) {
  return (
    <AppLink to={menuLink(item)} className="group block">
      <div className="relative overflow-hidden rounded-2xl aspect-[10/9]">
        <MenuImage image={item.image} className="w-full h-full" sizes="20vw" />
        {item.badge && (
          <span className="absolute top-3 left-3 bg-white/95 text-[#1D2A4D] text-sm font-medium px-3.5 py-1.5 rounded-full">
            {item.badge}
          </span>
        )}
      </div>
      <p className="mt-3 text-[16px] font-semibold text-[#1D2A4D]">{item.title}</p>
      {item.description && <p className="mt-1 text-[13px] text-[#5B6478] line-clamp-2">{item.description}</p>}
    </AppLink>
  );
}

function FeatureCard({ item }) {
  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, ease: EASE }}>
      <AppLink to={menuLink(item)} className="group block">
        <div className="overflow-hidden rounded-2xl aspect-[10/9]">
          <MenuImage image={item.image} className="w-full h-full" sizes="28vw" />
        </div>
        <p className="mt-4 text-[17px] font-semibold text-[#1D2A4D]">{item.title}</p>
        {item.description && <p className="mt-1 text-[13px] text-[#5B6478]">{item.description}</p>}
      </AppLink>
    </motion.div>
  );
}

function AppLink({ to, target, children, ...rest }) {
  if (isExternal(to)) {
    return (
      <a href={to} target={target || undefined} rel={target === "_blank" ? "noopener noreferrer" : undefined} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to} {...rest}>
      {children}
    </Link>
  );
}

// stagger the links/cards in when a panel opens
const staggerParent = { hidden: {}, show: { transition: { staggerChildren: 0.035 } } };
const staggerChild = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } } };
function Stagger({ children, className = "" }) {
  return (
    <motion.div variants={staggerParent} initial="hidden" animate="show" className={className}>
      {children}
    </motion.div>
  );
}
function StaggerItem({ children, className = "", as = "div" }) {
  const M = as === "li" ? motion.li : motion.div;
  return (
    <M variants={staggerChild} className={className}>
      {children}
    </M>
  );
}

// balance groups over N columns by number of links
function splitIntoColumns(groups, n) {
  const cols = Array.from({ length: n }, () => ({ weight: 0, items: [] }));
  for (const g of groups) {
    const target = cols.reduce((a, b) => (b.weight < a.weight ? b : a));
    target.items.push(g);
    target.weight += 2 + (g.children?.length || 0);
  }
  return cols.map((c) => c.items).filter((c) => c.length);
}

// =====================================================================
// Mobile: hamburger + slide-in drawer with accordions (same WP menu)
// =====================================================================
export function MobileMenu({ location = "primary" }) {
  const { items } = useMenu(location);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState({});
  const { pathname, search } = useLocation();

  useEffect(() => setOpen(false), [pathname, search]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const toggle = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 text-[#1D2A4D]"
      >
        <span className="block w-5 h-0.5 bg-current rounded" />
        <span className="block w-5 h-0.5 bg-current rounded" />
        <span className="block w-5 h-0.5 bg-current rounded" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-[#1D2A4D]/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-[88%] max-w-sm bg-white overflow-y-auto"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <div className="flex items-center justify-between px-5 h-14 border-b border-[#E6EAF1]">
                <span className="font-semibold text-[#1D2A4D]">Menu</span>
                <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="text-2xl text-[#1D2A4D]">
                  ×
                </button>
              </div>
              <ul className="px-5 py-2">
                {items.map((item) => (
                  <MobileItem key={item.id} item={item} depth={0} expanded={expanded} toggle={toggle} />
                ))}
              </ul>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileItem({ item, depth, expanded, toggle }) {
  const hasChildren = item.children?.length > 0;
  const isOpen = !!expanded[item.id];
  return (
    <li className={depth === 0 ? "border-b border-[#EEF1F6]" : ""}>
      <div className={`flex items-center justify-between ${depth === 0 ? "py-3.5" : "py-2"}`}>
        <AppLink
          to={menuLink(item)}
          className={`flex items-center gap-2 ${
            depth === 0
              ? `text-base font-semibold ${hasClass(item, "menu-highlight") ? "text-[#D2453B]" : "text-[#1D2A4D]"}`
              : depth === 1 && hasChildren
              ? "text-[15px] font-semibold text-[#1D2A4D]"
              : "text-[15px] text-[#4A5878]"
          }`}
        >
          {item.title}
          {item.badge && <Badge text={item.badge} dark={depth === 0 || hasClass(item, "badge-dark")} />}
        </AppLink>
        {hasChildren && (
          <button
            type="button"
            aria-label={isOpen ? `Collapse ${item.title}` : `Expand ${item.title}`}
            aria-expanded={isOpen}
            onClick={() => toggle(item.id)}
            className="w-8 h-8 flex items-center justify-center text-[#1D2A4D]"
          >
            <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.2 }} className="text-xl leading-none">
              +
            </motion.span>
          </button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {hasChildren && isOpen && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="overflow-hidden pl-3 pb-2"
          >
            {item.children.map((child) => (
              <MobileItem key={child.id} item={child} depth={depth + 1} expanded={expanded} toggle={toggle} />
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
}
