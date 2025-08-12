import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, UserPlus } from 'lucide-react';

const FUNCTION_URL = 'https://swipchvhpwdomewoxivp.functions.supabase.co/create-user';

const CreateUser = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    domain: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      toast({
        title: "Missing information",
        description: "Please provide both username and password.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        toast({
          title: "Not authenticated",
          description: "You must be logged in as an admin to create users.",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          username: formData.username.trim(),
          password: formData.password,
          domain: (formData.domain || "example.com").trim()
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || 'Failed to create user');
      }

      toast({
        title: "Success",
        description: "User created successfully",
        duration: 4000
      });
      alert(`✅ User created with email: ${result?.email || (formData.username.trim().toLowerCase() + '@' + (formData.domain || 'example.com').trim())}`);

      setFormData({ username: '', password: '', domain: '' });
    } catch (error: any) {
      console.error('Create user error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create user",
        variant: "destructive"
      });
      alert(`❌ Error: ${error?.message || "Failed to create user"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/admin-dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="mr-2 h-5 w-5" />
                Create New User (Admin)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Enter username"
                    autoComplete="username"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password"
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <Label htmlFor="domain">Domain (optional)</Label>
                  <Input
                    id="domain"
                    type="text"
                    value={formData.domain}
                    onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                    placeholder="example.com"
                    autoComplete="off"
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Email is auto-generated as username@
                  {formData.domain?.trim() || "example.com"} and pre-verified.
                </p>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating...' : 'Create User'}
                </Button>
              </form>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateUser;
