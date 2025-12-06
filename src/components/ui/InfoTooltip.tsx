import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface InfoTooltipProps {
  label: string;
  description: string;
  className?: string;
}

/**
 * InfoTooltip - Uses Radix Tooltip with Portal for proper stacking
 * Renders tooltip to document.body to escape transformed parent contexts
 */
export function InfoTooltip({ label, description, className }: InfoTooltipProps) {
  return (
    <div className={cn('relative inline-flex', className)}>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`Info about ${label}`}
            className="w-4 h-4 text-text-muted hover:text-text-secondary cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-brand/50 rounded flex-shrink-0"
          >
            <Info className="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          align="center" 
          sideOffset={8}
          className="max-w-xs"
        >
          <p className="text-xs font-semibold text-popover-foreground mb-1">{label}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
