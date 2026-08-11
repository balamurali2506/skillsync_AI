import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

const VARIANTS = {
  primary: 'bg-gradient-brand text-white shadow-glow',
  secondary: 'border border-neutral-200 bg-white text-neutral-700 shadow-soft',
  ghost: 'text-neutral-600 hover:bg-neutral-100',
  dark: 'border border-neutral-700 bg-neutral-900 text-white',
};

const SIZES = {
  sm: 'px-3.5 py-2 text-caption',
  md: 'px-5 py-2.5 text-body',
  lg: 'px-6 py-3 text-body',
};

export default function Button({ variant = 'primary', size = 'md', className, children, ...props }) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-wide transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant], SIZES[size], className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}