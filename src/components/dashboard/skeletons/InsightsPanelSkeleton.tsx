import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

export function InsightsPanelSkeleton() {
  return (
    <div className="col-span-2 md:col-span-4 lg:col-span-8 bg-bg-surface border border-border-default rounded-2xl p-6 min-h-[250px]">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-3"
          >
            <Skeleton className="w-6 h-6 rounded-full shrink-0" />
            <Skeleton className="h-4 w-full" />
          </motion.div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-border-subtle">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-5 w-3/4" />
      </div>
    </div>
  );
}
