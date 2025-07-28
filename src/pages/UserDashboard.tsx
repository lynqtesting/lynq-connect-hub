import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
  const navigate = useNavigate();

  // Mock data - will be replaced with Supabase data
  const userModules = [
    { id: 1, name: 'Axis Bank Module 1' },
    { id: 2, name: 'Axis Bank Module 2' },
    { id: 3, name: 'Axis Bank Module 3' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 max-w-md mx-auto">
        <div className="mb-6">
          <Logo className="mb-2" />
          <h2 className="text-lg text-muted-foreground">Welcome, User!</h2>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold mb-4">Your Modules:</h3>
          
          {userModules.map((module) => (
            <Card 
              key={module.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/module/${module.id}`)}
            >
              <CardContent className="p-4">
                <h4 className="font-medium">{module.name}</h4>
              </CardContent>
            </Card>
          ))}
          
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