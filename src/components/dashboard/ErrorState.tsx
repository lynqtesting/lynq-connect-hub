import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  fullPage?: boolean;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We encountered an error while loading your data. Please try again.',
  onRetry,
  fullPage = false,
}: ErrorStateProps) {
  const content = (
    <Alert variant="destructive" className="border-destructive/50">
      <AlertCircle className="h-5 w-5" />
      <AlertTitle className="text-lg font-semibold mb-2">{title}</AlertTitle>
      <AlertDescription className="space-y-4">
        <p className="text-sm">{message}</p>
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="gap-2 border-destructive/30 hover:border-destructive hover:bg-destructive/10"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <div className="w-full max-w-md">{content}</div>
      </div>
    );
  }

  return content;
}
