import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Minus, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cardHoverVariants } from '@/lib/animations';

interface TrendBadge {
  value: number;
  direction: 'up' | 'down' | 'neutral';
}

interface MetricCardProps {
  title: string;
  value?: string | number;
  subtitle?: string;
  trend?: TrendBadge;
  info?: string;
  headerAction?: ReactNode;
  showDecoration?: boolean;
  children?: ReactNode;
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  info,
  headerAction,
  showDecoration = false,
  children,
  className = '',
}: MetricCardProps) {
  const getTrendColor = (direction: 'up' | 'down' | 'neutral') => {
    if (direction === 'up') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400';
    if (direction === 'down') return 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400';
    return 'bg-bg-surface-hover text-text-secondary';
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'neutral') => {
    if (direction === 'up') return <ArrowUpRight className="h-3 w-3" />;
    if (direction === 'down') return <ArrowDownRight className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  return (
    <motion.div
      variants={cardHoverVariants}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      className={`relative z-0 h-full min-w-0 bg-bg-surface border border-border-default rounded-3xl p-4 sm:p-5 md:p-6 shadow-xs hover:shadow-md transition-shadow duration-200 ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3 md:mb-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-text-muted leading-tight">
            {title}
          </p>
          {info && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-text-muted hover:text-text-secondary transition-colors">
                    <Info className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">{info}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {headerAction && <div>{headerAction}</div>}
      </div>

      {/* Value */}
      {value !== undefined && (
        <div className="mb-2">
          <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-text-primary">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-text-muted mt-1">{subtitle}</p>
          )}
        </div>
      )}

      {/* Trend Badge */}
      {trend && (
        <div className="mt-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${getTrendColor(trend.direction)}`}
          >
            {getTrendIcon(trend.direction)}
            {Math.abs(trend.value)}%
          </span>
        </div>
      )}

      {/* Custom Content */}
      {children && <div className="mt-4">{children}</div>}

      {/* Decoration Line */}
      {showDecoration && (
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: 96 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-4 h-1 rounded-full bg-gradient-to-r from-brand to-brand-glow opacity-80" 
        />
      )}
    </motion.div>
  );
}
