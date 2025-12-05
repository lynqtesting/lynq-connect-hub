import { ReactNode, useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  pullThreshold?: number;
  maxPull?: number;
}

type RefreshState = 'idle' | 'pulling' | 'ready' | 'refreshing' | 'completed';

export function PullToRefresh({
  children,
  onRefresh,
  pullThreshold = 80,
  maxPull = 150,
}: PullToRefreshProps) {
  const isMobile = useIsMobile();
  const [refreshState, setRefreshState] = useState<RefreshState>('idle');
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);

  // Only enable pull-to-refresh on mobile
  if (!isMobile) {
    return <>{children}</>;
  }

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only start pull if at top of scroll and not already refreshing
    if (window.scrollY <= 5 && refreshState === 'idle') {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    }
  }, [refreshState]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPullingRef.current || refreshState !== 'idle') return;

    const currentY = e.touches[0].clientY;
    const delta = currentY - startYRef.current;

    // Only handle downward pull when at top
    if (delta > 0 && window.scrollY <= 5) {
      // Apply elastic resistance
      const resistance = 1 - (delta / maxPull) * 0.5;
      const distance = Math.min(delta * resistance, maxPull);
      
      setPullDistance(distance);
      
      if (distance > pullThreshold) {
        setRefreshState('ready');
      } else if (distance > 10) {
        setRefreshState('pulling');
      }
      
      // Prevent default scroll when pulling
      if (distance > 10) {
        e.preventDefault();
      }
    }
  }, [refreshState, maxPull, pullThreshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;

    if (refreshState === 'ready') {
      setRefreshState('refreshing');
      setPullDistance(pullThreshold);

      try {
        await onRefresh();
        setRefreshState('completed');
        setTimeout(() => {
          setPullDistance(0);
          setRefreshState('idle');
        }, 500);
      } catch (error) {
        console.error('Refresh failed:', error);
        setPullDistance(0);
        setRefreshState('idle');
      }
    } else {
      setPullDistance(0);
      setRefreshState('idle');
    }
  }, [refreshState, pullThreshold, onRefresh]);

  // Attach native touch event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use passive: false only for touchmove to allow preventDefault
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const getIndicatorContent = () => {
    switch (refreshState) {
      case 'pulling':
        return (
          <div className="flex flex-col items-center gap-1">
            <motion.div
              style={{ opacity: pullDistance / pullThreshold, scale: 0.8 + (pullDistance / pullThreshold) * 0.2 }}
              className="text-text-muted"
            >
              <Loader2 className="h-5 w-5" />
            </motion.div>
            <span className="text-xs text-text-muted">Pull to refresh</span>
          </div>
        );
      case 'ready':
        return (
          <div className="flex flex-col items-center gap-1">
            <motion.div
              animate={{ rotate: 180 }}
              className="text-brand"
            >
              <Loader2 className="h-5 w-5" />
            </motion.div>
            <span className="text-xs text-brand font-medium">Release to refresh</span>
          </div>
        );
      case 'refreshing':
        return (
          <div className="flex flex-col items-center gap-1">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="text-brand"
            >
              <Loader2 className="h-5 w-5" />
            </motion.div>
            <span className="text-xs text-brand font-medium">Refreshing...</span>
          </div>
        );
      case 'completed':
        return (
          <div className="flex flex-col items-center gap-1">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-emerald-500"
            >
              <Check className="h-5 w-5" />
            </motion.div>
            <span className="text-xs text-emerald-500 font-medium">Refreshed!</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Pull-to-refresh indicator */}
      <AnimatePresence>
        {pullDistance > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, height: pullDistance }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center overflow-hidden"
          >
            {getIndicatorContent()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content - renders normally without drag interference */}
      {children}
    </div>
  );
}
