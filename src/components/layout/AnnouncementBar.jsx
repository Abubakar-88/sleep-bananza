import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useSiteSettings } from "../../hooks/useSiteSettings";

// Top selling headline — text comes from WP Admin → Home Page → "Announcement bar".
// One message per line; several lines rotate every 4 seconds.
export function AnnouncementBar() {
  const { announcement } = useSiteSettings();
  const messages = announcement?.messages || [];
  const link = announcement?.link || "";
  const [i, setI] = useState(0);

  useEffect(() => {
    if (messages.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % messages.length), 4000);
    return () => clearInterval(t);
  }, [messages.length]);

  if (!messages.length) return null;
  const text = messages[i % messages.length];

  const content = (
    <AnimatePresence mode="wait">
      <motion.span
        key={i}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35 }}
        className="block truncate"
      >
        {text}
      </motion.span>
    </AnimatePresence>
  );

  const cls = "flex items-center justify-center h-9 px-4 text-center text-[13px] md:text-sm font-semibold text-white bg-[#0E2A4F] overflow-hidden";
  if (!link) return <div className={cls}>{content}</div>;
  return /^https?:\/\//i.test(link) ? (
    <a href={link} className={`${cls} hover:underline`}>{content}</a>
  ) : (
    <Link to={link} className={`${cls} hover:underline`}>{content}</Link>
  );
}