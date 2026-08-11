import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

const CONFIG = {
  positive: { label: 'Positive', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  neutral:  { label: 'Neutral',  cls: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500' },
  negative: { label: 'Negative', cls: 'bg-rose-50 text-rose-700 border-rose-200',          dot: 'bg-rose-500' },
};

export default function SentimentBadge({ sentiment }) {
  const c = CONFIG[sentiment];
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-caption font-semibold', c.cls)}
    >
      <motion.span
        className={cn('h-1.5 w-1.5 rounded-full', c.dot)}
        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      />
      {c.label}
    </motion.span>
  );
}