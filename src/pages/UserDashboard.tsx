import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { User, Session } from '@supabase/supabase-js';

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
      <div className="p-4 max-w-md mx-auto">
        <div className="mb-6">
          <Logo className="mb-2" />
          <h2 className="text-lg text-muted-foreground">Welcome, User!</h2>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold mb-4">Your Modules:</h3>
          
          {loading ? (
            <div className="text-center py-8">Loading modules...</div>
          ) : userModules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No modules assigned yet
            </div>
          ) : (
            userModules.map((assignment) => (
              <Card 
                key={assignment.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/module/${assignment.modules.id}`)}
              >
                <CardContent className="p-4">
                  <h4 className="font-medium">{assignment.modules.title}</h4>
                  {assignment.modules.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {assignment.modules.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}

          {/* Recommendations Section */}
          {recommendations.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Recommendations for New Modules:</h3>
              {recommendations.map((recommendation) => (
                <Card key={recommendation.id} className="mb-4">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-primary">
                      Module Recommendation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{recommendation.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(recommendation.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          <Button 
            variant="outline" 
            className="w-full mt-6"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;