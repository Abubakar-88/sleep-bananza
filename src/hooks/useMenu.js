import { useEffect, useState } from "react";
import { getMenu } from "../api/menu";

// Menus rarely change: fetch once per session, reuse everywhere (header, footer, mobile)
const cache = new Map();

export function useMenu(location = "primary") {
  const [state, setState] = useState(() => ({
    items: cache.get(location) || [],
    loading: !cache.has(location),
    error: null,
  }));

  useEffect(() => {
    if (cache.has(location)) return;
    let alive = true;
    getMenu(location)
      .then((items) => {
        cache.set(location, items || []);
        if (alive) setState({ items: items || [], loading: false, error: null });
      })
      .catch((error) => {
        if (error?.response?.status === 404) {
          console.warn(`Menu "${location}" is not assigned in WordPress (Appearance → Menus → Manage Locations).`);
        } else {
          console.error("Menu failed to load:", error);
        }
        if (alive) setState({ items: [], loading: false, error });
      });
    return () => {
      alive = false;
    };
  }, [location]);

  return state;
}
