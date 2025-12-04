import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { cn } from '@/lib/utils';

export interface ObjectionItem {
  label: string;
  count: number;
  priority?: 'High' | 'Medium' | 'Low';
}

interface TopClientObjectionsCardProps {
  items: ObjectionItem[];
  maxCount?: number;
  className?: string;
  selectedRegion?: string;
  onRegionChange?: (region: string) => void;
}

const priorityColors = {
  High: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
  Medium: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  Low: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
};

export function TopClientObjectionsCard({ 
  items, 
  maxCount, 
  className,
  selectedRegion = 'global',
  onRegionChange,
}: TopClientObjectionsCardProps) {
  const calculatedMax = maxCount || Math.max(...items.map(item => item.count), 1);
  
  // Check if data is empty or placeholder
  const hasData = items.length > 0 && !items.every(item => item.label === 'No objections data' && item.count === 0);

  return (
    <div
      className={cn(
        'bg-bg-surface border border-border-default rounded-2xl p-4 md:p-5 flex flex-col gap-4 shadow-xs hover:shadow-md transition-shadow',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm sm:text-base font-semibold text-text-primary">
          Top Client Objections
        </span>
        <div className="flex items-center gap-2">
          {onRegionChange && (
            <select
              value={selectedRegion}
              onChange={(e) => onRegionChange(e.target.value)}
              className="text-xs bg-bg-surface border border-border-default rounded-lg px-2 py-1 text-text-secondary appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="global">Global</option>
              <option value="north">North</option>
              <option value="south">South</option>
              <option value="east">East</option>
              <option value="west">West</option>
            </select>
          )}
          <InfoTooltip
            label="Top Client Objections"
            description="Ranking of the most frequent client objections, helping you refine enablement and responses."
          />
        </div>
      </div>

      {/* Empty State or Items */}
      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <div className="w-16 h-16 rounded-full bg-bg-surface-hover flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-text-muted" />
          </div>
          <p className="text-sm text-text-muted text-center">No objections data available yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex flex-col gap-1.5"
            >
              {/* Top row: Label and Priority Badge */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-primary font-medium">
                  {item.label}
                </span>
                {item.priority && (
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    priorityColors[item.priority]
                  )}>
                    {item.priority}
                  </span>
                )}
              </div>
              
              {/* Mentions count */}
              <span className="text-xs text-text-muted">
                {item.count.toLocaleString()} mentions this month
              </span>
              
              {/* Progress bar */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(item.count / calculatedMax) * 100}%` }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="h-1.5 bg-sky-400 dark:bg-sky-500 rounded-full"
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
