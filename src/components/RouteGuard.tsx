import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RouteGuardProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function RouteGuard({ children, requireAdmin = false }: RouteGuardProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && typeof navigate === 'function') {
      if (!user) {
        navigate('/login');
      } else if (requireAdmin) {
        // Check admin status only when required
        const checkAdminStatus = async () => {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('is_admin')
              .eq('user_id', user.id)
              .single();

            if (!profile?.is_admin) {
              toast({
                title: "Access Denied",
                description: "Admin access required",
                variant: "destructive"
              });
              navigate('/lynq-library');
            }
          } catch (error) {
            console.error('Error checking admin status:', error);
            navigate('/lynq-library');
          }
        };
        
        checkAdminStatus();
      }
    }
  }, [user, loading, requireAdmin, navigate, toast]);

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