import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useMenu } from "../../hooks/useMenu";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { isExternal, menuLink } from "../../utils/menuLink";
import { subscribe } from "../../api/newsletter";

/*
  "Night sky" footer — the page drifts from day (beige) into night (navy).
  Link columns: WP Admin → Appearance → Menus → location "Footer (Headless frontend)".
    Top-level items = column titles, their sub-items = the links.
  Text, newsletter, social, trust line: WP Admin → Home Page → Footer (falls back to the defaults below).
*/
const NAVY = "#141C3A";
const PAGE_BG = "#F6F1EA";
const EASE = [0.22, 1, 0.36, 1];

const DEFAULTS = {
  newsletterTitle: "Sleep better, starting tonight",
  newsletterText: "Bedtime rituals, new arrivals and members-only offers. One calm email a week.",
  newsletterOffer: "",
  trust: ["Secure checkout"], // add your real promises in WP Admin (shipping, returns…)
  social: {}, // icons appear once the URLs are filled in WP Admin
  columns: [
    { title: "Shop", links: [["Weighted Blankets", "/collection/weighted-blankets"], ["Sheets", "/collection/sheets"], ["Pillows", "/collection/pillows"], ["Sleep Masks", "/collection/sleep-masks"], ["Shop All", "/collection/all"]] },
    { title: "Help", links: [["Shipping", "/shipping"], ["Returns", "/returns"], ["FAQ", "/faq"], ["Contact Us", "/contact"]] },
    { title: "Company", links: [["Our Story", "/our-story"], ["Blog", "/blog"], ["Personalization", "/personalize"]] },
    { title: "Legal", links: [["Privacy Policy", "/privacy-policy"], ["Terms of Service", "/terms"]] },
  ],
};

export function Footer({ label = "Sleep Bonanza" }) {
  const settings = useSiteSettings();
  // WordPress values win; empty fields keep the defaults
  const wp = settings.footer || {};
  const f = { ...DEFAULTS };
  for (const [k, v] of Object.entries(wp)) {
    const empty = v == null || v === "" || (Array.isArray(v) && !v.length) || (typeof v === "object" && !Array.isArray(v) && !Object.keys(v).length);
    if (!empty) f[k] = v;
  }
  const { items } = useMenu("footer");
  const columns = useMemo(() => {
    const fromWp = (items || []).filter((i) => i.children?.length);
    if (!fromWp.length) return DEFAULTS.columns.map((c) => ({ title: c.title, links: c.links.map(([t, to]) => ({ title: t, to })) }));
    return fromWp.slice(0, 4).map((c) => ({ title: c.title, links: c.children.map((l) => ({ title: l.title, to: menuLink(l), target: l.target })) }));
  }, [items]);
  const trust = Array.isArray(f.trust) ? f.trust : String(f.trust || "").split("\n").filter(Boolean);

  return (
    <footer className="relative overflow-hidden text-white" style={{ background: NAVY, width: "100vw", left: "50%", marginLeft: "-50vw", position: "relative" }}>
      <CloudEdge />
      <Stars />
      <Moon />

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-5 md:px-10 pt-10 md:pt-16">
        {/* newsletter */}
        <Rise className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-10 items-end pb-14 md:pb-20 border-b border-white/10">
          <div className="min-w-0">
            <h2 className="font-serif text-[34px] sm:text-4xl md:text-6xl leading-[1.05] tracking-tight max-w-xl">{f.newsletterTitle}</h2>
            <p className="mt-4 text-white/65 max-w-md">{f.newsletterText}</p>
          </div>
          <Newsletter offer={f.newsletterOffer} />
        </Rise>

        {/* link columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10 py-14">
          {columns.map((c, i) => (
            <Rise key={c.title} delay={0.08 * i}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">{c.title}</p>
              <ul className="mt-5 space-y-3">
                {c.links.map((l) => (
                  <li key={l.title}>
                    <FooterLink to={l.to} target={l.target}>{l.title}</FooterLink>
                  </li>
                ))}
              </ul>
            </Rise>
          ))}
        </div>

        {/* trust + payments */}
        <Rise className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-6 border-y border-white/10">
          <ul className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/75">
            {trust.map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9B8FF]" /> {t}
              </li>
            ))}
          </ul>
          <ul className="flex gap-2" aria-label="Payment methods">
            {["VISA", "Mastercard", "AMEX", "PayPal", "Apple Pay"].map((p) => (
              <li key={p} className="px-2.5 py-1 rounded border border-white/15 text-[10px] font-semibold tracking-wide text-white/70">{p}</li>
            ))}
          </ul>
        </Rise>
      </div>

      {/* giant wordmark */}
      <BigWord text={label} />

      {/* bottom bar */}
      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-5 md:px-10 pb-8 flex flex-col-reverse md:flex-row items-center justify-between gap-4 text-xs text-white/50">
        <p>© {new Date().getFullYear()} {label}. All rights reserved.</p>
        <div className="flex items-center gap-5">
          <Social social={f.social} />
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-white/80 hover:bg-white hover:text-[#141C3A] transition-colors"
          >
            Back to top <span aria-hidden>↑</span>
          </button>
        </div>
      </div>
    </footer>
  );
}

/* ---------- pieces ---------- */

function Rise({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 1, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

function FooterLink({ to = "/", target, children }) {
  const cls = "group relative inline-block text-[15px] text-white/85 hover:text-white transition-colors";
  const line = <span className="absolute left-0 -bottom-0.5 h-px w-full origin-left scale-x-0 bg-white/70 transition-transform duration-500 group-hover:scale-x-100" />;
  if (isExternal(to)) {
    return (
      <a href={to} target={target || "_blank"} rel="noreferrer" className={cls}>
        {children}
        {line}
      </a>
    );
  }
  return (
    <Link to={to} className={cls}>
      {children}
      {line}
    </Link>
  );
}

function Newsletter({ offer }) {
  const [email, setEmail] = useState("");
  const [trap, setTrap] = useState(""); // hidden field: only bots fill it
  const [state, setState] = useState("idle"); // idle | sending | done | error
  const [message, setMessage] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setMessage("Please enter a valid email.");
      return setState("error");
    }
    setState("sending");
    try {
      await subscribe(email.trim(), { source: "footer", website: trap }); // WP Admin → Subscribers
      setState("done");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Something went wrong, please try again.");
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="font-serif text-2xl md:text-3xl text-white/90">
        Sweet dreams ✨ <span className="block mt-2 text-sm font-sans text-white/60">You’re on the list.</span>
      </motion.p>
    );
  }

  return (
    <form onSubmit={submit} className="w-full min-w-0">
      <input type="text" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} className="hidden" aria-hidden name="website" />
      {offer && <p className="mb-3 text-sm text-[#C9B8FF]">{offer}</p>}
      <div className={`flex items-center rounded-full bg-white/[0.07] border ${state === "error" ? "border-red-300/70" : "border-white/15"} focus-within:border-white/50 transition-colors p-1.5`}>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === "error") setState("idle");
          }}
          placeholder="Your email address"
          aria-label="Email address"
          className="flex-1 bg-transparent px-4 py-2.5 text-white placeholder-white/40 outline-none min-w-0"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="shrink-0 rounded-full bg-white text-[#141C3A] text-sm font-semibold px-4 sm:px-6 py-2.5 transition-transform hover:scale-[1.03] disabled:opacity-60"
        >
          {state === "sending" ? "…" : "Subscribe"}
        </button>
      </div>
      <p className="mt-3 text-[11px] text-white/40">{state === "error" ? message : "Unsubscribe anytime."}</p>
    </form>
  );
}

function Social({ social = {} }) {
  const icons = {
    instagram: <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5.5-1.5h.01" />,
    pinterest: <path d="M12 3a9 9 0 0 0-3.3 17.4c-.1-.8 0-1.8.2-2.6l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.9 0 1.3.6 1.3 1.4 0 .9-.5 2.1-.8 3.3-.2 1 .5 1.8 1.5 1.8 1.8 0 3-2.3 3-5 0-2-1.4-3.6-3.9-3.6-2.9 0-4.6 2.1-4.6 4.4 0 .8.2 1.4.6 1.8" />,
    tiktok: <path d="M14 3v11.5a3.5 3.5 0 1 1-3-3.46M14 3c.5 2.5 2.3 4 5 4" />,
    facebook: <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8Z" />,
  };
  return (
    <ul className="flex items-center gap-3">
      {Object.entries(social)
        .filter(([k, url]) => url && icons[k])
        .map(([k, url]) => (
          <li key={k}>
            <a href={url} target="_blank" rel="noreferrer" aria-label={k} className="grid place-items-center w-9 h-9 rounded-full border border-white/15 text-white/75 hover:text-white hover:border-white/60 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                {icons[k]}
              </svg>
            </a>
          </li>
        ))}
    </ul>
  );
}

/* Clouds melting from the page colour into the night sky (mirror of the hero) */
function CloudEdge() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-20, 30]);
  // [left %, width vw, height vw]
  const puffs = [[-6, 26, 12], [12, 30, 14], [33, 24, 11], [50, 32, 15], [70, 26, 12], [86, 30, 14]];
  return (
    <div ref={ref} className="relative h-24 md:h-36 overflow-hidden" aria-hidden>
      <div className="absolute inset-x-0 top-0 h-1/2" style={{ background: `linear-gradient(180deg, ${PAGE_BG}, rgba(246,241,234,0))` }} />
      <motion.div className="absolute inset-x-0 top-0" style={reduce ? undefined : { y }}>
        {puffs.map(([x, w, h], i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${x}%`,
              top: `-${h * 0.55}vw`,
              width: `${w}vw`,
              height: `${h}vw`,
              background: `radial-gradient(closest-side, ${PAGE_BG}, rgba(246,241,234,.9) 60%, rgba(246,241,234,0))`,
              filter: "blur(3px)",
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}

function Stars() {
  const reduce = useReducedMotion();
  // fixed positions so they don't jump between renders
  const stars = useMemo(
    () => Array.from({ length: 46 }, (_, i) => ({ x: (i * 37.3) % 100, y: 8 + ((i * 53.7) % 80), s: i % 7 === 0 ? 2.5 : i % 3 === 0 ? 1.6 : 1.1, d: (i % 9) * 0.6 })),
    []
  );
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      {stars.map((st, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-white"
          style={{ left: `${st.x}%`, top: `${st.y}%`, width: st.s, height: st.s }}
          animate={reduce ? { opacity: 0.5 } : { opacity: [0.15, 0.9, 0.15] }}
          transition={{ duration: 3 + (i % 5), delay: st.d, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function Moon() {
  return (
    <motion.div
      aria-hidden
      className="absolute right-[6%] top-20 md:top-44 w-10 h-10 md:w-24 md:h-24 rounded-full pointer-events-none"
      style={{ background: "radial-gradient(circle at 35% 35%, #FFF8E6, #E9DDBF 60%, #CDBF9E)", boxShadow: "0 0 60px 18px rgba(255,244,214,.18)" }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 1.6, ease: EASE }}
    >
      <span className="absolute inset-0 rounded-full" style={{ background: NAVY, transform: "translate(32%, -16%) scale(0.95)" }} />
    </motion.div>
  );
}

/* Huge brand name: letters rise one by one when it scrolls into view */
function BigWord({ text }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  return (
    <div ref={ref} className="relative z-10 px-3 pt-10 pb-6 select-none" aria-hidden>
      <p className="font-serif leading-[0.85] tracking-[-0.04em] text-center whitespace-nowrap" style={{ fontSize: "clamp(56px, 15.5vw, 280px)" }}>
        {Array.from(text).map((ch, i) => (
          <span key={i} className="inline-block overflow-hidden align-bottom">
            <motion.span
              className="inline-block bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(180deg, rgba(255,255,255,.95) 0%, rgba(201,184,255,.55) 100%)" }}
              initial={{ y: "105%" }}
              animate={inView ? { y: "0%" } : {}}
              transition={{ duration: 1, ease: EASE, delay: i * 0.045 }}
            >
              {ch === " " ? " " : ch}
            </motion.span>
          </span>
        ))}
      </p>
    </div>
  );
}