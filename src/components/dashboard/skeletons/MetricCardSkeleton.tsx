import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

interface MetricCardSkeletonProps {
  colSpan?: string;
}

export function MetricCardSkeleton({ colSpan = 'col-span-2 md:col-span-2 lg:col-span-3' }: MetricCardSkeletonProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${colSpan} bg-bg-surface border border-border-default rounded-3xl p-5 md:p-6`}
    >
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 md:h-10 w-20" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </motion.div>
  );
}
