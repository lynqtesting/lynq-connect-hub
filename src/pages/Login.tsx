import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Logo from "@/components/Logo";
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { User, Session } from '@supabase/supabase-js';
import { Sparkles, Lock, ArrowRight } from "lucide-react";
import { z } from "zod";

// Validation schemas
const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required")
});

const signupSchema = z.object({
  username: z.string().trim().max(50, "Username must be less than 50 characters").optional(),
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100, "Password must be less than 100 characters")
});

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string; username?: string }>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  // Helper function to check admin status with timeout and error handling
  const checkAdminAndRedirect = async (userId: string) => {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Role check timeout')), 3000)
      );
      
      const queryPromise = supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      if (error) {
        // Default to non-admin on error
        navigate('/lynq-library');
        return;
      }
      
      if (data?.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/lynq-library');
      }
    } catch (err) {
      // Default to non-admin on timeout/error
      navigate('/lynq-library');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to defer the async operation
          setTimeout(() => {
            checkAdminAndRedirect(session.user.id);
          }, 0);
        } else {
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Redirect authenticated users
        setTimeout(() => {
          checkAdminAndRedirect(session.user.id);
        }, 0);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // SEO: set page title
  useEffect(() => {
    document.title = "LYNQ – Access your data in minutes";
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate input
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach(err => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: result.data.email,
      password: result.data.password,
    });

    if (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate input
    const result = signupSchema.safeParse({ username: username || undefined, email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string; username?: string } = {};
      result.error.errors.forEach(err => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
        if (err.path[0] === 'username') fieldErrors.username = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username: result.data.username || result.data.email.split('@')[0]
        }
      }
    });

    if (error) {
      toast({
        title: "Sign Up Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Please check your email to confirm your account",
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-primary/10 via-accent/5 to-background flex items-center justify-center p-4">
      <main className="w-full max-w-md">
        <header className="text-center mb-6 animate-fade-in">
          <div className="inline-flex items-center justify-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <span className="font-extrabold tracking-tight">LYNQ</span>
          </div>
          <h1 className="text-xl font-extrabold mt-1">Access your data in minutes</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in or create an account to view your LYNQ dashboard.</p>
        </header>

        <Card className="rounded-3xl border border-border bg-card/90 backdrop-blur animate-scale-in">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-base font-semibold">Secure Login</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="animate-fade-in">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={`w-full ${errors.email ? 'border-destructive' : ''}`}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={`w-full ${errors.password ? 'border-destructive' : ''}`}
                    />
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>
                  <Button type="submit" className="w-full hover-scale" disabled={loading}>
                    <Lock className="h-4 w-4 mr-2" />
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="animate-fade-in">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-username">Username (Optional)</Label>
                    <Input
                      id="signup-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`w-full ${errors.username ? 'border-destructive' : ''}`}
                    />
                    {errors.username && <p className="text-xs text-destructive">{errors.username}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={`w-full ${errors.email ? 'border-destructive' : ''}`}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={`w-full ${errors.password ? 'border-destructive' : ''}`}
                    />
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>
                  <Button type="submit" className="w-full hover-scale" disabled={loading}>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Login;
