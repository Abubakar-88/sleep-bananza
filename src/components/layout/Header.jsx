import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "../../hooks/useCart";
import { AnnouncementBar } from "./AnnouncementBar";
import { MegaMenu, MobileMenu } from "./MegaMenu";
import { useMenu } from "../../hooks/useMenu";
import { hasClass, isExternal, menuLink } from "../../utils/menuLink";

/*
  Header layout (Bearaby style):
  [ pill · small link ]          [ LOGO ]          [ BLOG · OUR STORY · search · account · cart ]
  [                    mega menu band (WordPress "primary" menu)                      ]

  Left and right text links also come from WordPress (Appearance → Menus):
    - "Header Left Links (Headless frontend)"   e.g. Take the Quiz (CSS class: pill), 7x This Week Only
    - "Header Right Links (Headless frontend)"  e.g. Blog, Our Story
*/

const SITE_NAME = "Sleep Bonanza";
const LOGO_SRC = ""; // optional: "/logo.svg" — leave empty to show SITE_NAME as text

export function Header() {
  const { items: leftLinks } = useMenu("header_left");
  const { items: rightLinks } = useMenu("header_right");
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-shadow duration-300 ${scrolled ? "shadow-[0_6px_20px_-12px_rgba(29,42,77,0.35)]" : ""}`}
    >
      <AnnouncementBar />
      <div className="bg-[#F6F1EA]">
        <div className="relative mx-auto max-w-[1600px] h-16 md:h-[72px] px-4 md:px-6 grid grid-cols-[1fr_auto_1fr] items-center">
          {/* Left */}
          <div className="flex items-center gap-3 md:gap-6 min-w-0">
            <MobileMenu />
            <nav aria-label="Header left" className="hidden lg:flex items-center gap-6">
              {leftLinks.map((item) => (
                <HeaderLink key={item.id} item={item} />
              ))}
            </nav>
          </div>

          {/* Center logo */}
          <Link to="/" className="justify-self-center" aria-label={`${SITE_NAME} home`}>
            {LOGO_SRC ? (
              <img src={LOGO_SRC} alt={SITE_NAME} className="h-7 md:h-8 w-auto" />
            ) : (
              <span className="text-[22px] md:text-[26px] font-semibold tracking-tight text-[#1D2A4D]">{SITE_NAME}</span>
            )}
          </Link>

          {/* Right */}
          <div className="flex items-center justify-end gap-4 md:gap-6">
            <nav aria-label="Header right" className="hidden lg:flex items-center gap-6">
              {rightLinks.map((item) => (
                <HeaderLink key={item.id} item={item} />
              ))}
            </nav>
            <button
              type="button"
              aria-label="Search"
              onClick={() => setSearchOpen((v) => !v)}
              className="hidden sm:flex text-[#1D2A4D] hover:opacity-70 transition-opacity"
            >
              <SearchIcon />
            </button>
            <Link to="/account" aria-label="Account" className="text-[#1D2A4D] hover:opacity-70 transition-opacity">
              <UserIcon />
            </Link>
            <CartButton />
          </div>

          <AnimatePresence>{searchOpen && <SearchBar onClose={() => setSearchOpen(false)} />}</AnimatePresence>
        </div>
      </div>

      <MegaMenu />
    </header>
  );
}

function HeaderLink({ item }) {
  const to = menuLink(item);
  const pill = hasClass(item, "pill");
  const cls = pill
    ? "px-6 py-3 rounded-full bg-[#DFE6F0] text-[#1D2A4D] text-xs font-semibold uppercase tracking-wider hover:bg-[#1D2A4D] hover:text-white transition-colors"
    : "text-[#1D2A4D] text-xs font-semibold uppercase tracking-wider hover:opacity-70 transition-opacity";
  if (isExternal(to)) {
    return (
      <a href={to} target={item.target || undefined} rel={item.target === "_blank" ? "noopener noreferrer" : undefined} className={cls}>
        {item.title}
      </a>
    );
  }
  return (
    <Link to={to} className={cls}>
      {item.title}
    </Link>
  );
}

// Slide-down search field. Goes to /collection/all?search=… (adjust if your search route differs)
function SearchBar({ onClose }) {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const ref = useRef(null);
  useEffect(() => ref.current?.focus(), []);

  return (
    <motion.form
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      onSubmit={(e) => {
        e.preventDefault();
        if (!q.trim()) return;
        navigate(`/collection/all?search=${encodeURIComponent(q.trim())}`);
        onClose();
      }}
      className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[min(560px,92vw)] z-50 flex items-center gap-2 bg-white rounded-full shadow-xl border border-[#E6EAF1] pl-5 pr-2 py-2"
    >
      <SearchIcon />
      <input
        ref={ref}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        placeholder="Search sleep products…"
        className="flex-1 bg-transparent outline-none text-sm text-[#1D2A4D] placeholder:text-[#9AA1B2]"
      />
      <button type="submit" className="px-4 py-2 rounded-full bg-[#1D2A4D] text-white text-xs font-semibold">
        Search
      </button>
    </motion.form>
  );
}

// Cart icon with item-count badge (reads the WooCommerce cart from CartContext)
function CartButton() {
  const { cart } = useCart();
  const count = Number(cart?.items_count || 0);
  return (
    <Link to="/cart" aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`} className="relative text-[#1D2A4D] hover:opacity-70 transition-opacity">
      <CartSvg />
      {count > 0 && (
        <motion.span
          key={count}
          initial={{ scale: 0.6 }}
          animate={{ scale: 1 }}
          className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[#1D2A4D] text-white text-[10px] font-bold leading-[18px] text-center"
        >
          {count > 99 ? "99+" : count}
        </motion.span>
      )}
    </Link>
  );
}

const CartSvg = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 4h2.2l2.1 10.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 8H6.1" />
    <circle cx="9.5" cy="19.5" r="1.3" />
    <circle cx="17" cy="19.5" r="1.3" />
  </svg>
);

const SearchIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);
const UserIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </svg>
);