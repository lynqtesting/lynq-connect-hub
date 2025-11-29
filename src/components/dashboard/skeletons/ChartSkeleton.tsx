import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

interface ChartSkeletonProps {
  colSpan?: string;
  height?: string;
}

export function ChartSkeleton({ colSpan = 'col-span-2 md:col-span-4 lg:col-span-8', height = 'h-[200px]' }: ChartSkeletonProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${colSpan} bg-bg-surface border border-border-default rounded-2xl p-6`}
    >
      <div className="space-y-4">
        <Skeleton className="h-5 w-48" />
        <div className={`${height} flex items-end justify-between gap-2`}>
          {[...Array(7)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${40 + Math.random() * 60}%` }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className="flex-1"
            >
              <Skeleton className="h-full" />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
