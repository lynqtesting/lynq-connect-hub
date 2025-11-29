import { ReactNode, useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);

  // Always call hooks unconditionally
  const pullProgress = useTransform(y, [0, pullThreshold], [0, 1]);
  const indicatorOpacity = useTransform(y, [0, 30], [0, 1]);
  const indicatorScale = useTransform(y, [0, pullThreshold], [0.8, 1]);

  // Only enable pull-to-refresh on mobile
  if (!isMobile) {
    return <>{children}</>;
  }

  const handleDragStart = () => {
    // Only allow pull-to-refresh when scrolled to top
    const scrollTop = containerRef.current?.scrollTop || window.scrollY;
    if (scrollTop > 5) {
      return false;
    }
    if (refreshState !== 'idle') {
      return false;
    }
  };

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Only allow downward drag
    if (info.offset.y < 0) {
      y.set(0);
      return;
    }

    // Apply elastic resistance
    const dragY = Math.min(info.offset.y, maxPull);
    const resistance = 1 - (dragY / maxPull) * 0.5;
    y.set(dragY * resistance);

    // Update state based on pull distance
    if (dragY > pullThreshold && refreshState !== 'ready') {
      setRefreshState('ready');
    } else if (dragY <= pullThreshold && refreshState === 'ready') {
      setRefreshState('pulling');
    }
  };

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > pullThreshold && refreshState === 'ready') {
      // Trigger refresh
      setRefreshState('refreshing');
      y.set(pullThreshold);

      try {
        await onRefresh();
        setRefreshState('completed');
        setTimeout(() => {
          y.set(0);
          setRefreshState('idle');
        }, 500);
      } catch (error) {
        console.error('Refresh failed:', error);
        y.set(0);
        setRefreshState('idle');
      }
    } else {
      // Snap back
      y.set(0);
      setRefreshState('idle');
    }
  };

  const getIndicatorContent = () => {
    switch (refreshState) {
      case 'pulling':
        return (
          <div className="flex flex-col items-center gap-1">
            <motion.div
              style={{ opacity: indicatorOpacity, scale: indicatorScale }}
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
    <motion.div
      ref={containerRef}
      className="relative overflow-hidden"
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      style={{ 
        y,
        touchAction: 'pan-y',
      }}
    >
      {/* Pull-to-refresh indicator */}
      <motion.div
        style={{ opacity: indicatorOpacity }}
        className="absolute top-0 left-0 right-0 flex items-center justify-center h-16 -mt-16 z-10"
      >
        {getIndicatorContent()}
      </motion.div>

      {/* Content */}
      {children}
    </motion.div>
  );
}
