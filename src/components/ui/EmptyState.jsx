import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import Button from './Button';

export default function EmptyState({ icon: Icon, title, description, action, onAction, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className={cn('flex flex-col items-center justify-center rounded-3xl bg-white p-12 text-center shadow-card', className)}
    >
      <motion.div
        animate={{ y: [0, -8, 0], scale: [1, 1.03, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand-soft text-brand-500"
      >
        <Icon size={32} />
      </motion.div>
      <h3 className="mt-5 text-title font-semibold">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-body text-neutral-500">{description}</p>}
      {action && <Button onClick={onAction} className="mt-5">{action}</Button>}
    </motion.div>
  );
}