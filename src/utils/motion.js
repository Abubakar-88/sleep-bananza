// Shared Framer Motion variants so every page/animation in the store moves
// with the same easing and timing — keeps transitions feeling consistent
// instead of every page inventing its own numbers.

export const EASE = [0.16, 1, 0.3, 1]; // smooth "ease-out-expo"-ish curve

// Whole-page entrance: fade + slight rise. Wrap each page's root element.
export const pageFade = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.45, ease: EASE } },
};

// Grid container: staggers its children in one after another.
export const staggerContainer = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

// Individual grid item (product card): fade + rise, used with staggerContainer.
export const staggerItem = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

// Simple fade-up for standalone blocks (headings, summaries, sidebars).
export const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.85, ease: EASE } },
};

// Crossfade for swapping content in place (gallery main image, tab panels).
export const crossFade = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: EASE } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.4, ease: EASE } },
};

// Micro tap/hover feedback for buttons (Add to Cart, thumbnails, etc).
export const tapScale = { whileTap: { scale: 0.96 } };
export const hoverLift = { whileHover: { y: -2 }, whileTap: { scale: 0.97 } };