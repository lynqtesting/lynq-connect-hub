import { motion } from 'framer-motion';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { cn } from '@/lib/utils';

export interface ObjectionItem {
  label: string;
  count: number;
}

interface TopClientObjectionsCardProps {
  items: ObjectionItem[];
  maxCount?: number;
  selectedRegion?: string;
  onRegionChange?: (region: string) => void;
  className?: string;
}

const regions = ['Global', 'North', 'South', 'East', 'West'];

export function TopClientObjectionsCard({ 
  items, 
  maxCount, 
  selectedRegion = 'Global', 
  onRegionChange, 
  className 
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
      <div className="flex items-center justify-between">
        <span className="text-[10px] sm:text-xs uppercase tracking-wider text-text-muted font-medium">
          Top Client Objections
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
        <div className="flex flex-col gap-3">
          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3"
            >
              {/* Label */}
              <span className="text-xs sm:text-sm text-text-primary font-medium min-w-fit max-w-[40%] leading-tight">
                {item.label}
              </span>
              
              {/* Direct Bar - No background wrapper */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(item.count / calculatedMax) * 100}%` }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="h-5 bg-[#F5A0A0] dark:bg-rose-400/80 rounded-md"
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}