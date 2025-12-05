import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Calculate tooltip position based on button location
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const tooltipWidth = 256; // w-64 = 16rem = 256px
    const padding = 16;
    
    // Position below the button
    let top = rect.bottom + 8;
    let left = rect.right - tooltipWidth;
    
    // Prevent tooltip from going off-screen (left)
    if (left < padding) {
      left = padding;
    }
    
    // Prevent tooltip from going off-screen (right)
    if (left + tooltipWidth > window.innerWidth - padding) {
      left = window.innerWidth - tooltipWidth - padding;
    }
    
    // If tooltip would go below viewport, position above button
    if (top + 100 > window.innerHeight) {
      top = rect.top - 100;
    }
    
    setPosition({ top, left });
  }, []);

  // Update position when opening
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
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

  const tooltipContent = (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="fixed z-[9999] w-64 bg-bg-surface border border-border-default rounded-xl px-3 py-2.5 shadow-lg pointer-events-auto"
      style={{ top: position.top, left: position.left }}
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-xs font-semibold text-text-primary mb-1">{label}</p>
      <p className="text-xs text-text-secondary leading-relaxed">{description}</p>
      {/* Small arrow pointing up */}
      <div 
        className="absolute -top-1.5 w-3 h-3 bg-bg-surface border-l border-t border-border-default rotate-45"
        style={{ right: Math.min(Math.max(16, position.left > 100 ? 12 : 200), 232) }}
      />
    </motion.div>
  );

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
        {isOpen && typeof document !== 'undefined' && createPortal(
          tooltipContent,
          document.body
        )}
      </AnimatePresence>
    </div>
  );
}
