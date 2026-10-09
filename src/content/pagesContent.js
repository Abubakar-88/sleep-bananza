// Default text for the Personalize page.
// WP Admin → Personalize Page overrides any field that is filled in there.
export const personalizeDefaults = {
  hero: {
    eyebrow: "",
    title: "Personalization Guide",
    text: "The finishing detail, made yours. Everything you need to know about our custom embroidery.",
    image: null,
  },
  intro: {
    title: "Comfort Is Personal, Now More Than Ever",
    text: "Add a custom embroidered name, phrase or monogram to select pillowcases, blankets and bath pieces, in a variety of complimentary thread colours.",
    ctaLabel: "Start personalizing",
    ctaTo: "/collection/all",
    image: null,
    image2: null,
  },
  gifts: {
    title: "The Most Thoughtful Gifts",
    text: "Add custom embroidery for a gift that already feels like it's theirs, right out of the box.",
    ctaLabel: "Start personalizing",
    ctaTo: "/collection/all",
    image: null,
    image2: null,
  },
  products: {
    title: "Give It A Personal Touch",
    linkLabel: "Shop all",
    linkTo: "/collection/all",
    ids: [],
    tagId: null,
    categoryId: null,
  },
  looks: [],
  howTo: {
    title: "How To Make It Your Own",
    steps: [
      { title: "Select Your Font", image: null },
      { title: "Choose A Thread Color", image: null },
      { title: "Enter Your Text", image: null },
      { title: "Add To Bag", image: null },
    ],
  },
  styles: { title: "", items: [] },
  // Filled in WP Admin → Personalize Page → FAQ (hidden until then)
  faq: { title: "FAQs", items: [] },
};

// WordPress values win; empty ones keep the default.
export function mergePage(defaults, wp) {
  if (!wp || typeof wp !== "object") return defaults;
  const out = Array.isArray(defaults) ? [...defaults] : { ...defaults };
  for (const key of Object.keys(wp)) {
    const d = defaults?.[key];
    const v = wp[key];
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v)) {
      if (v.length) out[key] = v;
    } else if (d && typeof d === "object" && !Array.isArray(d) && typeof v === "object" && !("src" in v)) {
      out[key] = mergePage(d, v);
    } else {
      out[key] = v;
    }
  }
  return out;
}
