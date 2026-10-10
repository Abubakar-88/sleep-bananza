// Home page copy & optional images.
// Everything product-related (products, categories, prices, ratings, reviews)
// comes live from the WooCommerce Store API. This file only holds marketing copy.
// Any image left empty ("") falls back automatically to a product/category image
// from WooCommerce, so the page always renders with real store data.

export const homeContent = {
  hero: {
    badge: "New",
    titleLines: ["Sleep deeper.", "Wake up lighter."],
    subtitle:
      "Weighted blankets, sound machines and sleep essentials, designed to quiet the mind and calm the body.",
    ctaLabel: "Shop Collection",
    ctaTo: "/shop",
    image: "", // e.g. "https://your-cdn.com/hero.jpg" (wide lifestyle photo, 2400px+)
    // WP Admin → Home Page → Hero → "Hero effect": clouds_water | clouds | classic
    effect: "clouds_water",
  },

  productTabs: {
    eyebrow: "Made for rest",
    title: "The easier way to",
    titleEmphasis: "sleep well",
  },

  // WP Admin → Home Page → "Sleep steps" (scroll story). Empty photos use store product photos.
  sleepSteps: {
    eyebrow: "Better sleep in 4 steps",
    title: "Your new night routine",
    steps: [
      { title: "Dim the lights", text: "An hour before bed, switch to warm, low light so your body knows the day is ending.", image: null },
      { title: "Quiet the room", text: "Soft, steady sound covers the sudden noises that pull you out of deep sleep.", image: null },
      { title: "Get comfortable", text: "Breathable bedding and gentle weight help your body settle and stay asleep.", image: null },
      { title: "Wake up gently", text: "Let light, not an alarm blast, bring you back in the morning.", image: null },
    ],
  },

  bestsellers: {
    title: "Shop our bestsellers",
  },

  // Optional press logos (text). Leave empty until you have real press coverage.
  press: [],

  bannerOne: {
    eyebrow: "New arrival",
    title: "Meet your new bedtime ritual",
    text: "Soft light, calming sound and the comfort of gentle weight, all in one wind-down routine.",
    ctaLabel: "Shop Now",
    ctaTo: "/shop",
    image: "",
  },

  // WP Admin → Home Page → "Shop the Look". Hidden until an image is set there.
  shopTheLook: {
    eyebrow: "Our most-loved pieces",
    title: "Shop the Look",
    text: "Everything you see, ready for your bedroom.",
    ctaLabel: "Shop the Collection",
    ctaTo: "/collection/all",
    image: null,
    hotspots: [],
  },

  science: {
    title: "Designed for rest, built around your routine",
    text: "Every product is chosen to help you fall asleep faster, stay asleep longer and wake up better.",
    linkLabel: "Shop All",
    linkTo: "/shop",
  },

  statsSplit: {
    title: "Feeling better starts with better sleep",
    text: "Small changes to your bedroom make a big difference. Here's what our customers say so far.",
    ctaLabel: "Shop Best Sellers",
    ctaTo: "/shop",
    image: "",
    // Optional: replace the live rating stats with your own verified survey numbers, e.g.
    // stats: [{ value: 85, suffix: "%", label: "report better sleep after 2 weeks" }]
    stats: null,
  },

  reviews: {
    eyebrow: "Reviews",
    titleSuffix: "happy sleepers",
  },

  bannerTwo: {
    eyebrow: "Gift ready",
    title: "The gift of a good night",
    text: "Ready-to-wrap sleep bundles for everyone on your list.",
    ctaLabel: "Shop Bundles",
    ctaTo: "/shop",
    image: "",
  },

  benefits: {
    title: "Three ways to a deeper sleep",
    subtitle: "Pick the part of your routine you want to improve first.",
    items: [
      { title: "Calm", text: "Gentle, even weight that helps the body settle.", linkLabel: "Shop Blankets" },
      { title: "Quiet", text: "Soothing sound and soft light to switch the mind off.", linkLabel: "Shop Sound & Light" },
      { title: "Comfort", text: "Soft, breathable essentials that keep you cool all night.", linkLabel: "Shop Essentials" },
    ],
  },

  ugc: {
    eyebrow: "In real bedrooms",
    title: "Sleeping better, at home",
    // Optional: your own customer / Instagram photos. Empty = product gallery images.
    images: [],
  },
};
