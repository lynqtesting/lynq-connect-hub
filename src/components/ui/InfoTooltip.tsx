import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MobileTooltip } from '@/components/ui/mobile-tooltip';
import { useIsMobile } from '@/hooks/use-mobile';

interface InfoTooltipProps {
  label: string;
  description: string;
  className?: string;
}

/**
 * InfoTooltip - Uses Radix Tooltip on desktop, MobileTooltip on mobile
 * 44x44px touch target for mobile accessibility
 */
export function InfoTooltip({ label, description, className }: InfoTooltipProps) {
  const isMobile = useIsMobile();

  // Shared trigger with 44x44px touch target (negative margin keeps visual size)
  const triggerContent = (
    <button
      type="button"
      aria-label={`Info about ${label}`}
      className="w-11 h-11 -m-3.5 flex items-center justify-center 
                 text-text-muted hover:text-text-secondary 
                 active:scale-95 active:bg-bg-surface-hover/50 
                 rounded-lg transition-all touch-manipulation"
    >
      <Info className="w-4 h-4 flex-shrink-0" />
    </button>
  );

  if (isMobile) {
    return (
      <div className={cn('relative inline-flex', className)}>
        <MobileTooltip
          trigger={triggerContent}
          label={label}
          description={description}
        />
      </div>
    );
  }

  return (
    <div className={cn('relative inline-flex', className)}>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          {triggerContent}
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
