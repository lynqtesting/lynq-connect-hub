import { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileTooltipProps {
  trigger: ReactNode;
  label: string;
  description: string;
  className?: string;
}

/**
 * MobileTooltip - Custom tap-to-toggle tooltip for mobile devices
 * Uses portal rendering and explicit touch handlers for reliable behavior
 */
export function MobileTooltip({ trigger, label, description, className }: MobileTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Calculate tooltip position relative to trigger
  const updatePosition = () => {
    if (!triggerRef.current) return;
    
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 256; // max-w-64 = 16rem = 256px
    
    // Position above the trigger, centered horizontally
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    let top = rect.top - 8; // 8px gap above trigger
    
    // Keep within viewport bounds
    const padding = 12;
    if (left < padding) left = padding;
    if (left + tooltipWidth > window.innerWidth - padding) {
      left = window.innerWidth - tooltipWidth - padding;
    }
    
    setPosition({ top, left });
  };

  // Toggle on tap
  const handleTap = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(prev => !prev);
  };

  // Close on outside tap
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: TouchEvent | MouseEvent) => {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !tooltipRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    // Small delay to prevent immediate close on the same tap
    const timer = setTimeout(() => {
      document.addEventListener('touchstart', handleClickOutside, { passive: true });
      document.addEventListener('mousedown', handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = () => setIsOpen(false);
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    
    return () => window.removeEventListener('scroll', handleScroll, { capture: true });
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <>
      <div
        ref={triggerRef}
        onClick={handleTap}
        onTouchEnd={handleTap}
        className={className}
        role="button"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        {trigger}
      </div>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={tooltipRef}
              initial={{ opacity: 0, y: 4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.96 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                top: position.top,
                left: position.left,
                transform: 'translateY(-100%)',
                zIndex: 99999,
              }}
              className="max-w-64 px-3 py-2 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg"
              role="tooltip"
            >
              <p className="text-xs font-semibold mb-1">{label}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
              
              {/* Arrow pointing down */}
              <div 
                className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 
                           bg-popover border-r border-b border-border 
                           rotate-45"
              />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

