import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User, Session } from '@supabase/supabase-js';
import { BookOpen, BarChart3, LibraryBig, LogOut } from "lucide-react";

const UserDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userModules, setUserModules] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate('/login');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate('/login');
        return;
      }
      
      fetchUserModules(session.user.id);
      fetchRecommendations(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // SEO: set page title
  useEffect(() => {
    document.title = "LYNQ Access & Data Dashboard";
  }, []);

  const fetchUserModules = async (userId: string) => {
    try {
      console.log('UserDashboard: Fetching modules for auth user ID:', userId);
      
      // Fetch assigned modules for this user
      const { data: assignments, error } = await supabase
        .from('user_module_assignments')
        .select(`
          id,
          module_id,
          user_id,
          modules (
            id,
            title,
            description,
            file_url,
            screenshot_url
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      console.log('UserDashboard: Found assignments:', assignments);
      setUserModules(assignments || []);
    } catch (error) {
      console.error('Error fetching modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('recommendations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRecommendations(data || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear local state
      setUser(null);
      setSession(null);
      setUserModules([]);
      setRecommendations([]);
      
      // Navigate to login
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Logout Failed",
        description: "Could not log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 pb-8">
        {/* Header / Hero */}
        <section className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-accent/5 to-background p-5 mt-6 mb-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight">LYNQ Access & Data Dashboard</h1>
              <p className="text-xs text-muted-foreground">Your assigned LYNQs and recommendations</p>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <div className="text-[11px] text-muted-foreground">Assigned LYNQs</div>
              <div className="text-2xl font-extrabold">{userModules.length}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <div className="text-[11px] text-muted-foreground">Recommendations</div>
              <div className="text-2xl font-extrabold">{recommendations.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Assigned Modules */}
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">Assigned LYNQs</h2>
          {loading ? (
            <div className="text-center py-8">Loading modules...</div>
          ) : userModules.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="p-6 text-center">
                <div className="text-sm text-muted-foreground">No modules assigned yet</div>
                <Button variant="outline" className="mt-3" onClick={() => navigate('/lynq-library')}>
                  <LibraryBig className="h-4 w-4 mr-2" /> Browse LYNQ Library
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {userModules.map((assignment) => (
                <Card
                  key={assignment.id}
                  className="cursor-pointer transition-shadow hover:shadow-md hover-scale rounded-2xl"
                  onClick={() => navigate(`/module/${assignment.modules.id}`)}
                >
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="size-9 rounded-xl bg-muted grid place-items-center border">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium leading-tight">{assignment.modules.title}</div>
                      {assignment.modules.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {assignment.modules.description}
                        </p>
                      )}
                    </div>
                    <Button size="sm" variant="outline">Open</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Recommendations Section */}
        {recommendations.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-muted-foreground mb-2">Recommendations</h2>
            <div className="space-y-3">
              {recommendations.map((recommendation) => (
                <Card key={recommendation.id} className="rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-primary">Module Recommendation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{recommendation.content}</p>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      {new Date(recommendation.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Footer Actions */}
        <div className="mt-8 grid grid-cols-2 gap-3">
          <Button variant="outline" className="w-full" onClick={() => navigate('/lynq-library')}>
            <LibraryBig className="h-4 w-4 mr-2" /> Library
          </Button>
          <Button variant="destructive" className="w-full" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;