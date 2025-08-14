import { ReactNode } from 'react';
import { useRequireAuth, useRequireAdmin } from '@/hooks/useAuth';

interface RouteGuardProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function RouteGuard({ children, requireAdmin = false }: RouteGuardProps) {
  // Always call both hooks to avoid hook order issues
  const authResult = useRequireAuth();
  const adminResult = useRequireAdmin();
  
  // Use the appropriate result based on requireAdmin flag
  const { loading: authLoading } = requireAdmin ? adminResult : authResult;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold">Loading...</div>
          <div className="text-sm text-muted-foreground">Verifying access...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}