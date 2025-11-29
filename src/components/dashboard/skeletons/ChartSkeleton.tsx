import { Skeleton } from '@/components/ui/skeleton';

interface ChartSkeletonProps {
  colSpan?: string;
  height?: string;
}

export function ChartSkeleton({ colSpan = 'col-span-2 md:col-span-4 lg:col-span-8', height = 'h-[200px]' }: ChartSkeletonProps) {
  return (
    <div className={`${colSpan} bg-bg-surface border border-border-default rounded-2xl p-6`}>
      <div className="space-y-4">
        {/* Title */}
        <Skeleton className="h-5 w-48" />
        
        {/* Chart Area */}
        <div className={`${height} flex items-end justify-between gap-2`}>
          {[...Array(7)].map((_, i) => (
            <Skeleton 
              key={i} 
              className="flex-1" 
              style={{ height: `${40 + Math.random() * 60}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
