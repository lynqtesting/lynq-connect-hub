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

  useEffect(() => {
    let mounted = true;

    // Enhanced auth state listener with better error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state change:', event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user && mounted) {
          // Fetch admin status with proper error handling
          try {
            const adminStatus = await fetchAdminStatus(session.user.id);
            if (mounted) {
              setIsAdmin(adminStatus);
            }
          } catch (error) {
            console.error('Failed to fetch admin status:', error);
            if (mounted) {
              setIsAdmin(false);
            }
          }
        } else {
          if (mounted) {
            setIsAdmin(false);
          }
        }
        
        if (mounted) {
          setLoading(false);
        }

        // Handle session expiration
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

    // Get initial session with enhanced error handling
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Initial session error:', error);
          // Try to refresh if initial session fails
          try {
            await refreshSession();
          } catch (refreshError) {
            console.error('Session refresh failed:', refreshError);
            if (mounted) {
              setLoading(false);
            }
          }
          return;
        }

        if (session && mounted) {
          setSession(session);
          setUser(session.user);
          
          // Fetch admin status
          try {
            const adminStatus = await fetchAdminStatus(session.user.id);
            if (mounted) {
              setIsAdmin(adminStatus);
            }
          } catch (error) {
            console.error('Failed to fetch admin status:', error);
            if (mounted) {
              setIsAdmin(false);
            }
          }
        }
        
        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to get initial session:', error);
        if (mounted) {
          setLoading(false);
        }
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