import { Flame } from 'lucide-react';
import { cn } from '@/lib/cn';

export default function StreakFlame({ streak, size = 20, className }) {
  const active = streak > 0;
  return (
    <Flame
      size={size}
      fill={active ? 'currentColor' : 'none'}
      className={cn(active ? 'text-fuchsia-500 animate-flicker' : 'text-neutral-400', className)}
    />
  );
}