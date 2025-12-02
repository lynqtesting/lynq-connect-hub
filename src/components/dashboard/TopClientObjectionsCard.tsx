import { motion } from 'framer-motion';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { cn } from '@/lib/utils';

interface ObjectionItem {
  label: string;
  count: number;
  priority: 'high' | 'medium' | 'low';
}

interface TopClientObjectionsCardProps {
  items: ObjectionItem[];
  maxCount?: number;
  className?: string;
}

const priorityStyles = {
  high: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300',
  medium: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  low: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300',
};

const priorityLabels = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export function TopClientObjectionsCard({ items, maxCount, className }: TopClientObjectionsCardProps) {
  const calculatedMax = maxCount || Math.max(...items.map(item => item.count), 1);

  return (
    <div
      className={cn(
        'bg-bg-surface border border-border-default rounded-2xl p-4 md:p-5 flex flex-col gap-3 shadow-xs hover:shadow-md transition-shadow',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm md:text-base font-semibold text-text-primary">
          Top Client Objections
        </h3>
        <InfoTooltip
          label="Top Client Objections"
          description="Ranking of the most frequent client objections, helping you refine enablement and responses."
        />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2">
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.01 }}
            className="flex flex-col gap-1.5 rounded-xl px-3 py-2 hover:bg-bg-surface-hover transition-colors cursor-default"
          >
            {/* Top row */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs md:text-sm font-medium text-text-primary truncate flex-1">
                {item.label}
              </span>
              <span
                className={cn(
                  'text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap',
                  priorityStyles[item.priority]
                )}
              >
                {priorityLabels[item.priority]}
              </span>
            </div>
            
            {/* Frequency text */}
            <span className="text-[11px] text-text-muted">
              {item.count} mentions this month
            </span>
            
            {/* Frequency bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(item.count / calculatedMax) * 100}%` }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="h-full bg-brand rounded-full"
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
