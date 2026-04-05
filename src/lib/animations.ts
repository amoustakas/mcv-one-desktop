// MCV One — Animation Utilities (FutureState Design Language)
// Framer Motion variants and presets for consistent micro-interactions

export const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

export const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  },
};

export const hoverLift = {
  whileHover: { y: -4, transition: { duration: 0.2 } },
};

export const tapScale = {
  whileTap: { scale: 0.97, transition: { duration: 0.1 } },
};

export const slideInRight = {
  hidden: { x: '100%', opacity: 0 },
  show: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
};

export const slideInLeft = {
  hidden: { x: '-100%', opacity: 0 },
  show: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  },
};
