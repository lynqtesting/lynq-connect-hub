import { motion } from 'framer-motion';
import { AlertTriangle, HelpCircle, Info as InfoIcon } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { cn } from '@/lib/utils';

interface ConfusionItem {
  label: string;
  metricLabel: string;
  severity: 'high' | 'medium' | 'low';
}

interface ConfusionAreasCardProps {
  items: ConfusionItem[];
  className?: string;
}

const severityConfig = {
  high: {
    icon: AlertTriangle,
    color: 'text-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-900/20',
  },
  medium: {
    icon: HelpCircle,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
  },
  low: {
    icon: InfoIcon,
    color: 'text-indigo-500',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
  },
};

export function ConfusionAreasCard({ items, className }: ConfusionAreasCardProps) {
  return (
    <div
      className={cn(
        'bg-bg-surface border border-border-default rounded-2xl p-3 sm:p-4 md:p-5 flex flex-col gap-3 shadow-xs hover:shadow-md transition-shadow',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs sm:text-sm md:text-base font-semibold text-text-primary">
          Conversion Stoppers
        </h3>
        <InfoTooltip
          label="Conversion Stoppers"
          description="Topics where learners struggle the most, based on low scores, retries, or help signals that block conversions."
        />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1">
        {items.map((item, index) => {
          const config = severityConfig[item.severity];
          const Icon = config.icon;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.01 }}
              className="flex items-center justify-between gap-2 sm:gap-3 rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 hover:bg-bg-surface-hover transition-colors cursor-default"
            >
              {/* Left side - Icon + Text */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className={cn('p-1 sm:p-1.5 rounded-lg flex-shrink-0', config.bg)}>
                  <Icon className={cn('w-3 h-3 sm:w-3.5 sm:h-3.5', config.color)} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] sm:text-xs md:text-sm font-medium text-text-primary truncate">
                    {item.label}
                  </span>
                </div>
              </div>

              {/* Right side - Metric badge */}
              <span className="text-[9px] sm:text-[10px] md:text-[11px] font-semibold text-text-secondary bg-bg-surface-hover px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg whitespace-nowrap">
                {item.metricLabel}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Optional decoration */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: 80 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="h-1 rounded-full bg-brand/20 mt-1"
      />
    </div>
  );
}
