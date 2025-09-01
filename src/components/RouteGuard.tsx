import { ReactNode, useEffect } from 'react';
import { useAuthPersistence } from '@/hooks/useAuthPersistence';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RouteGuardProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function RouteGuard({ children, requireAdmin = false }: RouteGuardProps) {
  const { user, loading, isAdmin } = useAuthPersistence();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && typeof navigate === 'function') {
      if (!user) {
        navigate('/login');
      } else if (requireAdmin && !isAdmin) {
        toast({
          title: "Access Denied",
          description: "Admin access required",
          variant: "destructive"
        });
        navigate('/lynq-library');
      }
    }
  }, [user, loading, requireAdmin, isAdmin, navigate, toast]);

  const authLoading = loading;

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