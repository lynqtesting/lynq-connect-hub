import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { useNavigate } from 'react-router-dom';
import { Upload, Users, FileText, Calendar, Settings, Eye } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Success",
        description: "Logged out successfully"
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive"
      });
    }
  };

  const adminActions = [
    { icon: Upload, label: 'Upload New Module', action: () => navigate('/upload-module') },
    { icon: Eye, label: 'View All Modules', action: () => navigate('/view-modules') },
    { icon: Users, label: 'Create New User', action: () => navigate('/create-user') },
    { icon: Eye, label: 'View All Users', action: () => navigate('/view-users') },
    { icon: Users, label: 'Assign Modules to Users', action: () => navigate('/assign-modules') },
    { icon: FileText, label: 'See Requests', action: () => navigate('/view-requests') },
    { icon: Settings, label: 'Write Recommendations', action: () => navigate('/write-recommendations') },
    { icon: Calendar, label: 'Update Calendly Link', action: () => {} },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 max-w-md mx-auto">
        <div className="mb-6">
          <Logo className="mb-2" />
          <h2 className="text-lg text-muted-foreground">Welcome, Admin!</h2>
        </div>

        <div className="space-y-4">
          {adminActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-left p-0 h-auto"
                    onClick={action.action}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {action.label}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
          
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

export default AdminDashboard;