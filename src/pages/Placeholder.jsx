import { StatCardSkeleton, ChartSkeleton } from '@/components/ui/Skeleton';

export default function Placeholder({ title }) {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="font-display text-display-xl font-bold text-neutral-900 uppercase">{title}</h1>
        <p className="text-body text-neutral-500 mt-2">Loading module data...</p>
      </div>
      
      {/* Showcasing Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      
      <ChartSkeleton />
    </div>
  );
}