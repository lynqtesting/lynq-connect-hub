import { motion } from 'framer-motion';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { cn } from '@/lib/utils';

interface LearningProgressData {
  completed: number;
  inProgress: number;
  notStarted: number;
}

interface LearningProgressCardProps {
  data: LearningProgressData;
  className?: string;
}

export function LearningProgressCard({ data, className }: LearningProgressCardProps) {
  const total = data.completed + data.inProgress + data.notStarted;
  const hasData = total > 0;

  const completedPercent = hasData ? (data.completed / total) * 100 : 0;
  const inProgressPercent = hasData ? (data.inProgress / total) * 100 : 0;
  const notStartedPercent = hasData ? (data.notStarted / total) * 100 : 0;

  return (
    <div
      className={cn(
        'bg-bg-surface border border-border-default rounded-2xl p-4 md:p-5 flex flex-col gap-4 shadow-xs hover:shadow-md transition-shadow',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm sm:text-base font-semibold text-text-primary">
          Learning Progress
        </span>
        <InfoTooltip
          label="Learning Progress"
          description="Distribution of learners across completion stages: Completed, In Progress, and Not Started."
        />
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <p className="text-sm text-text-muted text-center">No progress data available</p>
        </div>
      ) : (
        <>
          {/* Stacked horizontal bar */}
          <div className="h-5 flex rounded-full overflow-hidden bg-bg-surface-hover">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completedPercent}%` }}
              transition={{ duration: 0.5, delay: 0 }}
              className="h-full bg-emerald-500"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${inProgressPercent}%` }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="h-full bg-amber-500"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${notStartedPercent}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-full bg-slate-400 dark:bg-slate-500"
            />
          </div>

          {/* Legend with counts */}
          <div className="flex flex-wrap justify-between gap-2 text-xs">
            <span className="flex items-center gap-1.5 text-text-secondary">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              Completed ({data.completed.toLocaleString()})
            </span>
            <span className="flex items-center gap-1.5 text-text-secondary">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              In Progress ({data.inProgress.toLocaleString()})
            </span>
            <span className="flex items-center gap-1.5 text-text-secondary">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
              Not Started ({data.notStarted.toLocaleString()})
            </span>
          </div>
        </>
      )}
    </div>
  );
}
