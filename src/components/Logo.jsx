import { cn } from '@/lib/cn';

const SIZES = {
  sm: 'text-caption',
  md: 'text-title-lg',
  lg: 'text-display-xl',
};

export default function Logo({ size = 'md', glow = false, theme = 'light', className }) {
  // Crisp white on the dark HUD sidebar, dark ink on light workspaces
  const solidTextColor = theme === 'dark' ? 'text-white' : 'text-neutral-900';

  return (
    <span
      className={cn(
        'inline-flex items-baseline whitespace-nowrap font-display font-bold tracking-wide select-none',
        SIZES[size],
        className,
      )}
    >
      <span className={solidTextColor}>SKILL</span>

      {/* Native Tailwind gradient text — reliable, unlike the custom @utility */}
      <span
        className={cn(
          'bg-linear-to-r from-brand-500 via-accent-violet to-accent-fuchsia bg-clip-text text-transparent',
          glow && 'drop-shadow-[0_0_12px_rgba(139,92,246,0.5)]',
        )}
      >
        SYNC_AI
      </span>
    </span>
  );
}