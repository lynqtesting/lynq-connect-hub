
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, UserPlus } from 'lucide-react';

type CreatedUser = {
  email: string;
  username: string;
  password: string;
};

const CreateUser = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // New validation: require password AND either email or username
    if (!formData.password || (!formData.email && !formData.username)) {
      toast({
        title: "Missing information",
        description: "Please provide a password and either an email or a username.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('create_user_admin', {
        // Pass empty strings through — the function handles normalization
        user_email: formData.email?.trim() || null,
        user_password: formData.password,
        user_username: formData.username?.trim() || null
      });

      if (error) throw error;

      const returned = (data as any) || {};
      const effectiveEmail =
        typeof returned.email === 'string' && returned.email.length > 0
          ? returned.email
          : (formData.email?.trim() || `${(formData.username || '').trim()}@local.user`);
      const effectiveUsername =
        typeof returned.username === 'string' && returned.username.length > 0
          ? returned.username
          : (formData.username?.trim() || formData.email.split('@')[0]);

      setCreatedUser({
        email: effectiveEmail,
        username: effectiveUsername,
        password: formData.password
      });

      toast({
        title: "Success",
        description: "User created successfully! Credentials are displayed below.",
        duration: 5000
      });

      // Reset form but keep showing credentials
      setFormData({ email: '', username: '', password: '' });
    } catch (error: any) {
      console.error('Create user error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create user",
        variant: "destructive"
      });
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
              Create New User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address or leave blank"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  If left blank, an internal email like username@local.user will be generated.
                </p>
              </div>

              <div>
                <Label htmlFor="username">Username (Optional)</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter username (will use email prefix if empty)"
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
                  required
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Note: Provide at least one of Email or Username (Password is required).
              </p>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating...' : 'Create User'}
              </Button>
            </form>

            {createdUser && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">User Created Successfully!</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Email:</span> 
                    <span className="ml-2 font-mono bg-white px-2 py-1 rounded border">{createdUser.email}</span>
                  </div>
                  <div>
                    <span className="font-medium">Username:</span> 
                    <span className="ml-2 font-mono bg-white px-2 py-1 rounded border">{createdUser.username}</span>
                  </div>
                  <div>
                    <span className="font-medium">Password:</span> 
                    <span className="ml-2 font-mono bg-white px-2 py-1 rounded border">{createdUser.password}</span>
                  </div>
                </div>
                <p className="text-xs text-green-700 mt-2">
                  ⚠️ Copy these credentials now - they cannot be retrieved later!
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={() => setCreatedUser(null)}
                >
                  Clear Credentials
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateUser;
