import { cn } from '@/lib/cn';

export function Skeleton({ className, ...props }) {
  return <div className={cn('skeleton', className)} {...props} />;
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-card space-y-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-card space-y-6">
      <Skeleton className="h-6 w-48" />
      <div className="flex items-end gap-4 h-48">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="w-full" style={{ height: `${Math.random() * 60 + 20}%` }} />
        ))}
      </div>
    </div>
  );
}