import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<Session | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function EnhancedAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Enhanced session refresh
  const refreshSession = async (): Promise<Session | null> => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh error:', error);
        throw error;
      }
      
      if (session) {
        setSession(session);
        setUser(session.user);
        return session;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to refresh session:', error);
      // Clear auth state on refresh failure
      setSession(null);
      setUser(null);
      setIsAdmin(false);
      throw error;
    }
  };

  // Secure admin status fetching using user_roles table
  const fetchAdminStatus = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching admin status:', error);
        return false;
      }
      
      return data !== null; // User has admin role
    } catch (error) {
      console.error('Admin status fetch failed:', error);
      return false;
    }
  };

  // Admin check with timeout to avoid blocking UI deadlocks
  const checkAdminWithTimeout = async (userId: string): Promise<boolean> => {
    try {
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Role check timeout')), 3000));
      const query = supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      const { data, error } = await Promise.race([query, timeout]) as any;
      if (error) {
        console.error('Admin status error:', error);
        return false;
      }
      return data?.role === 'admin';
    } catch (e) {
      console.error('Admin status failed:', e);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Enhanced auth state listener with better error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        console.log('Auth state change:', event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);

        // Flip loading off immediately to avoid blocking UI
        setLoading(false);

        if (session?.user) {
          // Defer role check to prevent deadlocks
          setTimeout(async () => {
            const adminStatus = await checkAdminWithTimeout(session.user!.id);
            if (mounted) setIsAdmin(adminStatus);
          }, 0);
        } else {
          setIsAdmin(false);
        }

        // Handle session events
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          if (mounted) {
            setUser(null);
            setSession(null);
            setIsAdmin(false);
          }
        }
      }
    );

    // Get initial session without blocking on admin check
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Initial session error:', error);
          // Ensure loading doesn't get stuck
          if (mounted) setLoading(false);
          // Try to refresh in the background
          try {
            await refreshSession();
          } catch (refreshError) {
            console.error('Session refresh failed:', refreshError);
          }
          return;
        }

        if (mounted) {
          setSession(session ?? null);
          setUser(session?.user ?? null);
          setLoading(false); // Important: do not await role checks
        }

        if (session?.user) {
          // Defer role check to keep UI responsive
          setTimeout(async () => {
            const adminStatus = await checkAdminWithTimeout(session.user!.id);
            if (mounted) setIsAdmin(adminStatus);
          }, 0);
        } else {
          if (mounted) setIsAdmin(false);
        }
      } catch (error) {
        console.error('Failed to get initial session:', error);
        if (mounted) setLoading(false);
      }
    };

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Enhanced sign out with proper cleanup
  const signOut = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      // Clear all auth state
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      
      toast({
        title: "Success",
        description: "Logged out successfully"
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast({
        title: "Error",
        description: "Failed to log out properly",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      isAdmin, 
      loading, 
      signOut, 
      refreshSession 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthPersistence() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthPersistence must be used within an EnhancedAuthProvider');
  }
  return context;
}