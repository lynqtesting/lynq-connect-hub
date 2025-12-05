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
        throw error;
      }
      
      if (session) {
        setSession(session);
        setUser(session.user);
        return session;
      }
      
      return null;
    } catch (error) {
      // Clear auth state on refresh failure
      setSession(null);
      setUser(null);
      setIsAdmin(false);
      throw error;
    }
  };

  // Admin check with timeout and retry to avoid blocking UI deadlocks
  const checkAdminWithTimeout = async (userId: string, retries: number = 2): Promise<boolean> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const timeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Role check timeout')), 3000)
        );
        const query = supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle();
        
        const { data, error } = await Promise.race([query, timeout]) as any;
        
        if (error) {
          // Check if it's a network error
          const isNetworkError = error?.message === 'Failed to fetch' || 
                                 error?.message?.includes('NetworkError');
          
          if (isNetworkError && attempt < retries) {
            // Wait before retry with exponential backoff
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
            continue;
          }
          
          return false;
        }
        
        return data?.role === 'admin';
      } catch (e: any) {
        const isNetworkError = e?.message === 'Failed to fetch' || 
                               e?.message?.includes('NetworkError') ||
                               e?.message === 'Role check timeout';
        
        if (isNetworkError && attempt < retries) {
          // Wait before retry with exponential backoff
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        
        return false;
      }
    }
    return false;
  };

  useEffect(() => {
    let mounted = true;

    // Enhanced auth state listener with better error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
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
      }
    );

    // Get initial session without blocking on admin check
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          // Ensure loading doesn't get stuck
          if (mounted) setLoading(false);
          // Try to refresh in the background
          try {
            await refreshSession();
          } catch (refreshError) {
            // Silent fail
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
