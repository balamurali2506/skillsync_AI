import { motion, AnimatePresence } from 'framer-motion';

export default function TickUp({ value, className }) {
  return (
    <span className={`inline-block overflow-hidden ${className || ''}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -14, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          className="inline-block tabular-nums"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}