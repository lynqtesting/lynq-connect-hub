import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RealtimeStatusIndicatorProps {
  connectionStatus: 'connected' | 'reconnecting' | 'offline';
  syncing: boolean;
  queueSize: number;
  onRetry?: () => void;
}

export function RealtimeStatusIndicator({ 
  connectionStatus, 
  syncing, 
  queueSize, 
  onRetry 
}: RealtimeStatusIndicatorProps) {
  const getStatusConfig = () => {
    if (connectionStatus === 'offline') {
      return {
        icon: <WifiOff className="h-3 w-3" />,
        text: 'Offline',
        variant: 'destructive' as const,
        description: 'Changes will be saved when connection is restored'
      };
    }
    
    if (connectionStatus === 'reconnecting' || syncing) {
      return {
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
        text: syncing ? 'Syncing...' : 'Reconnecting...',
        variant: 'secondary' as const,
        description: queueSize > 0 ? `${queueSize} changes queued` : 'Saving changes'
      };
    }
    
    return {
      icon: <Wifi className="h-3 w-3" />,
      text: 'Connected',
      variant: 'default' as const,
      description: 'All changes saved'
    };
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center gap-2">
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.text}
      </Badge>
      
      {queueSize > 0 && (
        <Badge variant="outline" className="text-xs">
          {queueSize} pending
        </Badge>
      )}
      
      {connectionStatus === 'offline' && onRetry && (
        <Button
          onClick={onRetry}
          size="sm"
          variant="outline"
          className="h-6 px-2 text-xs"
        >
          <AlertCircle className="h-3 w-3 mr-1" />
          Retry
        </Button>
      )}
      
      <div className="text-xs text-muted-foreground">
        {config.description}
      </div>
    </div>
  );
}