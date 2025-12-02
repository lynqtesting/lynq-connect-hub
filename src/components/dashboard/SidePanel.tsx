import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function SidePanel({ isOpen, onClose, title, children }: SidePanelProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 200 
            }}
            className="fixed inset-y-0 right-0 w-full sm:w-[500px] md:w-[600px] lg:w-[700px] bg-bg-surface border-l border-border-default shadow-2xl z-50 flex flex-col"
          >
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-bg-surface/90 backdrop-blur-md border-b border-border-default px-4 sm:px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-text-primary truncate pr-4">{title}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hover:bg-bg-surface-hover shrink-0 h-10 w-10"
                aria-label="Close panel"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
