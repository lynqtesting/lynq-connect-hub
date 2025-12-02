import { motion } from 'framer-motion';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { cn } from '@/lib/utils';

interface CSRHotspotItem {
  module: string;
  escalations: number;
  severity: 'high' | 'medium' | 'low';
}

interface CSRHotspotsCardProps {
  items: CSRHotspotItem[];
  className?: string;
}

const severityStyles = {
  high: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300',
  medium: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  low: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300',
};

const severityLabels = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export function CSRHotspotsCard({ items, className }: CSRHotspotsCardProps) {
  const hasHighAttention = items.some(item => item.severity === 'high');

  return (
    <div
      className={cn(
        'bg-bg-surface border border-border-default rounded-2xl p-4 md:p-5 flex flex-col gap-3 shadow-xs hover:shadow-md transition-shadow',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm md:text-base font-semibold text-text-primary">
            CSR Hotspots
          </h3>
          {hasHighAttention && (
            <span className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-[10px] font-medium px-2 py-0.5 rounded-full">
              High Attention
            </span>
          )}
        </div>
        <InfoTooltip
          label="CSR Hotspots"
          description="Regions and topics generating the highest CSR load, so you can reduce repeated support and escalations."
        />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1">
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.01 }}
            className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 hover:bg-bg-surface-hover transition-colors cursor-default"
          >
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs md:text-sm font-medium text-text-primary truncate">
                {item.module}
              </span>
              <span className="text-[11px] text-text-muted">
                {item.escalations} escalations this week
              </span>
            </div>
            <span
              className={cn(
                'text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap',
                severityStyles[item.severity]
              )}
            >
              {severityLabels[item.severity]}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
