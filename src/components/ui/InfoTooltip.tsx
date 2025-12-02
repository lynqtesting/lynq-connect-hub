import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfoTooltipProps {
  label: string;
  description: string;
  className?: string;
}

export function InfoTooltip({ label, description, className }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={cn('relative inline-flex', className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Info about ${label}`}
        aria-expanded={isOpen}
        className="w-4 h-4 text-text-muted hover:text-text-secondary cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-brand/50 rounded"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
      >
        <Info className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 z-50 w-64 bg-bg-surface border border-border-default rounded-xl px-3 py-2.5 shadow-lg"
          >
            <p className="text-xs font-semibold text-text-primary mb-1">{label}</p>
            <p className="text-xs text-text-secondary leading-relaxed">{description}</p>
            {/* Small arrow pointing up */}
            <div className="absolute -top-1.5 right-3 w-3 h-3 bg-bg-surface border-l border-t border-border-default rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
