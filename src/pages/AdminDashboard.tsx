import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { useNavigate } from 'react-router-dom';
import { Upload, Users, FileText, Calendar, Settings } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const adminActions = [
    { icon: Upload, label: 'Upload New Module', action: () => {} },
    { icon: Users, label: 'Assign Modules to Users', action: () => {} },
    { icon: FileText, label: 'See Requests', action: () => {} },
    { icon: Settings, label: 'Write Recommendations', action: () => {} },
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
            onClick={() => navigate('/login')}
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;