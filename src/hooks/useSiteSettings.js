import { useEffect, useState } from "react";
import { getHomeSettings } from "../api/homeSettings";

// WP Admin → Home Page settings, fetched once per visit and shared (header + home page)
let cache = null;
let pending = null;

export function loadSiteSettings() {
  if (cache) return Promise.resolve(cache);
  if (!pending) {
    pending = getHomeSettings()
      .then((data) => (cache = data || {}))
      .catch((e) => {
        console.warn("Site settings not loaded:", e?.message);
        return (cache = {});
      });
  }
  return pending;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState(cache);
  useEffect(() => {
    let alive = true;
    loadSiteSettings().then((s) => alive && setSettings(s));
    return () => {
      alive = false;
    };
  }, []);
  return settings || {};
}