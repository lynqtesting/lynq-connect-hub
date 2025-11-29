import { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  colSpan?: string;
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
  colSpan = 'col-span-2 md:col-span-2 lg:col-span-3',
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
    <div
      className={`${colSpan} bg-bg-surface border border-border-default rounded-3xl p-5 md:p-6 shadow-xs hover:shadow-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3 md:mb-4">
        <div className="flex items-center gap-2">
          <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-text-muted">
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
          <h3 className="text-2xl md:text-4xl font-extrabold text-text-primary">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs md:text-sm text-text-muted mt-1">{subtitle}</p>
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
        <div className="mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-brand to-brand-glow opacity-80" />
      )}
    </div>
  );
}
