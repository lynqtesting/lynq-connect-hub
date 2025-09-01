import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, Clock, AlertTriangle } from 'lucide-react';

interface ConnectionHealthIndicatorProps {
  status: 'connected' | 'reconnecting' | 'offline';
  isOnline?: boolean;
  lastSyncTime?: Date;
  pendingOperations?: number;
  onRetry?: () => void;
}

export function ConnectionHealthIndicator({
  status,
  isOnline = true,
  lastSyncTime,
  pendingOperations = 0,
  onRetry
}: ConnectionHealthIndicatorProps) {
  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        text: 'Offline',
        variant: 'destructive' as const,
        description: 'No internet connection'
      };
    }

    switch (status) {
      case 'connected':
        return {
          icon: Wifi,
          text: 'Connected',
          variant: 'default' as const,
          description: 'Real-time sync active'
        };
      case 'reconnecting':
        return {
          icon: RefreshCw,
          text: 'Reconnecting',
          variant: 'secondary' as const,
          description: 'Attempting to reconnect'
        };
      case 'offline':
        return {
          icon: AlertTriangle,
          text: 'Connection Lost',
          variant: 'destructive' as const,
          description: 'Unable to sync changes'
        };
      default:
        return {
          icon: Clock,
          text: 'Unknown',
          variant: 'secondary' as const,
          description: 'Status unknown'
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <div className="flex items-center gap-2 text-sm">
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className={`h-3 w-3 ${status === 'reconnecting' ? 'animate-spin' : ''}`} />
        {config.text}
      </Badge>
      
      {pendingOperations > 0 && (
        <Badge variant="outline" className="text-xs">
          {pendingOperations} pending
        </Badge>
      )}
      
      {(status === 'offline' || status === 'reconnecting') && onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry}>
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      )}
      
      {lastSyncTime && status === 'connected' && (
        <span className="text-xs text-muted-foreground">
          Last sync: {lastSyncTime.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}