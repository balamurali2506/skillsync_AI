// Shared motion constants — every component references these.
// CSS-side equivalents live in styles/tokens.css.

export const DURATION = { fast: 0.15, base: 0.3, slow: 0.5 };

export const EASE = {
  outExpo:  [0.16, 1, 0.3, 1],
  outQuart: [0.25, 1, 0.5, 1],
  spring:   [0.34, 1.56, 0.64, 1], // slight overshoot
};

export const SPRING = {
  snappy: { type: 'spring', stiffness: 420, damping: 30 },
  soft:   { type: 'spring', stiffness: 260, damping: 26 },
  pop:    { type: 'spring', stiffness: 500, damping: 22 }, // achievements ✦
};

// Page transitions — wired to AnimatePresence in Phase 1.
// Enter + exit together stay under 250ms per the brief.
export const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: EASE.outQuart } },
  exit:    { opacity: 0, y: -6, transition: { duration: DURATION.fast, ease: 'easeIn' } },
};

// Reusable entrance variant
export const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0,
    transition: { duration: DURATION.base, ease: EASE.outExpo, delay } },
});

// Stagger pair (used for skill chips, table rows, card grids)
export const staggerContainer = (gap = 0.06) => ({
  animate: { transition: { staggerChildren: gap } },
});
export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0,
    transition: { duration: DURATION.base, ease: EASE.outExpo } },
};