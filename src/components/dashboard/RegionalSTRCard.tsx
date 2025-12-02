import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { cn } from '@/lib/utils';

interface RegionalSTRItem {
  region: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
}

interface RegionalSTRCardProps {
  data: RegionalSTRItem[];
  selectedRegion?: string;
  onRegionChange?: (region: string) => void;
  className?: string;
}

const trendConfig = {
  up: {
    icon: TrendingUp,
    color: 'text-emerald-500',
  },
  down: {
    icon: TrendingDown,
    color: 'text-rose-500',
  },
  stable: {
    icon: Minus,
    color: 'text-slate-500',
  },
};

const formatValue = (value: number): string => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

export function RegionalSTRCard({
  data,
  selectedRegion = 'global',
  onRegionChange,
  className,
}: RegionalSTRCardProps) {
  const regions = ['global', ...data.map(d => d.region.toLowerCase())];
  const filteredData =
    selectedRegion === 'global'
      ? data
      : data.filter(d => d.region.toLowerCase() === selectedRegion);

  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div
      className={cn(
        'bg-bg-surface border border-border-default rounded-2xl p-4 md:p-5 flex flex-col gap-3 shadow-xs hover:shadow-md transition-shadow',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <h3 className="text-sm md:text-base font-semibold text-text-primary">
            Regional STR
          </h3>
          <span className="text-[11px] text-text-muted">
            Performance by region this quarter
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Region Filter */}
          <select
            value={selectedRegion}
            onChange={e => onRegionChange?.(e.target.value)}
            className="appearance-none bg-bg-surface-hover border border-border-default text-text-secondary text-[11px] md:text-xs rounded-md pl-2 pr-6 py-1 focus:ring-1 focus:ring-brand outline-none cursor-pointer hover:bg-border-default transition-all"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 4px center',
              backgroundSize: '14px',
            }}
          >
            <option value="global">Global</option>
            {data.map(d => (
              <option key={d.region} value={d.region.toLowerCase()}>
                {d.region}
              </option>
            ))}
          </select>

          <InfoTooltip
            label="Regional STR"
            description="Estimated premium value or revenue a trained learner can generate in each region."
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1">
        {filteredData.map((item, index) => {
          const config = trendConfig[item.trend];
          const TrendIcon = config.icon;
          const barWidth = (item.value / maxValue) * 100;

          return (
            <motion.div
              key={item.region}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.01 }}
              className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 hover:bg-bg-surface-hover transition-colors cursor-default"
            >
              {/* Left - Region name + bar */}
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <span className="text-xs md:text-sm font-medium text-text-primary">
                  {item.region}
                </span>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="h-full bg-brand rounded-full"
                  />
                </div>
              </div>

              {/* Right - Value + trend */}
              <div className="flex items-center gap-2">
                <span className="text-sm md:text-base font-bold text-text-primary">
                  {formatValue(item.value)}
                </span>
                <TrendIcon className={cn('w-4 h-4', config.color)} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
