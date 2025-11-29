import { Skeleton } from '@/components/ui/skeleton';

interface MetricCardSkeletonProps {
  colSpan?: string;
}

export function MetricCardSkeleton({ colSpan = 'col-span-2 md:col-span-2 lg:col-span-3' }: MetricCardSkeletonProps) {
  return (
    <div className={`${colSpan} bg-bg-surface border border-border-default rounded-3xl p-5 md:p-6`}>
      <div className="space-y-3">
        {/* Title */}
        <Skeleton className="h-3 w-24" />
        
        {/* Value */}
        <Skeleton className="h-8 md:h-10 w-20" />
        
        {/* Trend Badge */}
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}
