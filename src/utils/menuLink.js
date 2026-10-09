// Turns a WordPress menu item into a React Router path.
// Matches this app's routes: /collection/:slug, /product/:id, /:pageSlug
const WP_ORIGIN = String(import.meta.env.VITE_WP_API_URL || "").replace(/\/+$/, "");

export function menuLink(item) {
  if (!item) return "/";
  if (item.object === "product_cat" && item.slug) return `/collection/${item.slug}`;
  if (item.object === "product") return `/product/${item.object_id}`;
  if (item.object === "page" && item.slug) return `/${item.slug}`;
  if (item.object === "post" && item.slug) return `/blog/${item.slug}`;

  // Custom links: keep links to this site internal, leave other sites as-is
  let url = item.url || "/";
  if (WP_ORIGIN && url.startsWith(WP_ORIGIN)) url = url.slice(WP_ORIGIN.length) || "/";
  if (typeof window !== "undefined" && url.startsWith(window.location.origin)) {
    url = url.slice(window.location.origin.length) || "/";
  }
  // WordPress shop/category URLs typed as custom links → app routes
  url = url.replace(/^\/product-category\/(?:.*\/)?([^/]+)\/?$/, "/collection/$1");
  if (/^\/shop\/?$/.test(url)) url = "/collection/all";
  return url;
}

export const isExternal = (to) => /^https?:\/\//i.test(to);
export const hasClass = (item, cls) => (item?.classes || []).includes(cls);
