import { motion } from 'framer-motion';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { cn } from '@/lib/utils';

interface DropoffRateCardProps {
  rate: number;
  className?: string;
}

export function DropoffRateCard({ rate, className }: DropoffRateCardProps) {
  const getStatusText = () => {
    if (rate < 20) return 'Excellent retention';
    if (rate < 40) return 'Good retention';
    if (rate < 60) return 'Moderate dropoff';
    return 'Needs attention';
  };

  const getBarColor = () => {
    if (rate < 20) return 'bg-emerald-500';
    if (rate < 40) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div
      className={cn(
        'bg-bg-surface border border-border-default rounded-2xl p-4 md:p-5 flex flex-col gap-3 shadow-xs hover:shadow-md transition-shadow',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
          Dropoff Rate
        </span>
        <InfoTooltip
          label="Dropoff Rate"
          description="Percentage of learners who started the module but didn't complete it."
        />
      </div>

      {/* Value */}
      <h3 className="text-2xl sm:text-3xl font-extrabold text-text-primary">
        {rate.toFixed(1)}%
      </h3>

      {/* Visual bar indicator */}
      <div className="h-2 bg-bg-surface-hover rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(rate, 100)}%` }}
          transition={{ duration: 0.5 }}
          className={cn('h-full rounded-full', getBarColor())}
        />
      </div>

      {/* Status text */}
      <p className="text-xs text-text-muted">
        {getStatusText()}
      </p>
    </div>
  );
}
