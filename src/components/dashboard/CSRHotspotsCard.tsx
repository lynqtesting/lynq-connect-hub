import { motion } from 'framer-motion';
import { ChevronDown, BarChart3 } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export interface CSRHotspotItem {
  label: string;
  percentage: number;
}

interface CSRHotspotsCardProps {
  items: CSRHotspotItem[];
  selectedRegion?: string;
  onRegionChange?: (region: string) => void;
  className?: string;
}

const regions = ['Global', 'North', 'South', 'East', 'West'];

export function CSRHotspotsCard({ items, selectedRegion = 'Global', onRegionChange, className }: CSRHotspotsCardProps) {
  // Check if data is empty or placeholder
  const hasData = items.length > 0 && !items.every(item => item.label === 'No data' && item.percentage === 0);

  return (
    <div
      className={cn(
        'bg-bg-surface border border-border-default rounded-2xl p-4 sm:p-5 md:p-6 flex flex-col gap-4 shadow-xs hover:shadow-md transition-shadow',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] sm:text-xs uppercase tracking-wider text-text-muted font-medium">
          CSR Hotspots
        </span>
        <div className="flex items-center gap-1.5">
          {/* Region Dropdown */}
          <div className="relative">
            <select
              value={selectedRegion}
              onChange={(e) => onRegionChange?.(e.target.value)}
              className="appearance-none bg-bg-surface-hover border border-border-default text-text-secondary text-[10px] sm:text-xs rounded-lg pl-2 pr-6 py-1 sm:py-1.5 focus:ring-1 focus:ring-brand outline-none cursor-pointer"
            >
              {regions.map((region) => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-text-muted pointer-events-none" />
          </div>
          <InfoTooltip
            label="CSR Hotspots"
            description="Cards/questions where learners got stuck most, so you can improve content and reduce support."
          />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg sm:text-xl font-bold text-text-primary">
        Conversion Stoppers
      </h3>

      {/* Empty State or Items */}
      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <div className="w-16 h-16 rounded-full bg-bg-surface-hover flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-text-muted" />
          </div>
          <p className="text-sm text-text-muted text-center">No hotspot data available yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:gap-4">
          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-text-primary font-medium truncate max-w-[70%]">
                  {item.label}
                </span>
                <span className="text-xs sm:text-sm text-text-secondary font-semibold">
                  {item.percentage}%
                </span>
              </div>
              <Progress 
                value={item.percentage} 
                className="h-2 bg-bg-surface-hover"
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
