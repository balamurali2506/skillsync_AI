import { motion } from 'framer-motion';
import { PAGE_TRANSITION } from '@/lib/motion';

export default function PageTransition({ children }) {
  return (
    <motion.div
      initial={PAGE_TRANSITION.initial}
      animate={PAGE_TRANSITION.animate}
      exit={PAGE_TRANSITION.exit}
      transition={PAGE_TRANSITION.animate.transition}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );
}