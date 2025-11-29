import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  progress?: number;
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, progress, className }: StatCardProps) {
  return (
    <Card className={`bg-card border-border hover:shadow-lg transition-all ${className}`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              {title}
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground truncate">
              {value}
            </h3>
          </div>
          {Icon && (
            <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex-shrink-0">
              <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
          )}
        </div>

        {progress !== undefined && (
          <div className="space-y-2">
            <Progress value={progress} className="h-1.5 sm:h-2" />
          </div>
        )}

        {trend && (
          <div className="flex items-center gap-1 text-xs mt-2">
            <span className={trend.positive ? 'text-green-500' : 'text-red-500'}>
              {trend.positive ? '↗' : '↘'} {Math.abs(trend.value)}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
