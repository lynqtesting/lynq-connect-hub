import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";

const UserDashboard = () => {
  const navigate = useNavigate();
  const [userModules, setUserModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserModules();
  }, []);

  const fetchUserModules = async () => {
    try {
      // Get current user from localStorage (simple auth)
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        navigate('/login');
        return;
      }

      const userData = JSON.parse(currentUser);
      
      // Fetch assigned modules for this user
      const { data: assignments, error } = await supabase
        .from('user_module_assignments')
        .select(`
          id,
          module_id,
          modules (
            id,
            title,
            description,
            file_url,
            screenshot_url
          )
        `)
        .eq('user_id', userData.id);

      if (error) throw error;

      setUserModules(assignments || []);
    } catch (error) {
      console.error('Error fetching modules:', error);
    } finally {
      setLoading(false);
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
          
          <Button 
            variant="outline" 
            className="w-full mt-6"
            onClick={() => navigate('/login')}
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;