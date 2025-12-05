import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, UserPlus } from 'lucide-react';
import { z } from 'zod';

const FUNCTION_URL = 'https://swipchvhpwdomewoxivp.functions.supabase.co/create-user';

// Validation schema
const createUserSchema = z.object({
  username: z.string().trim()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be less than 50 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores and hyphens"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters"),
  domain: z.string().trim().max(100, "Domain must be less than 100 characters").optional()
});

const CreateUser = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    domain: ''
  });
  const [errors, setErrors] = useState<{ username?: string; password?: string; domain?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate input
    const result = createUserSchema.safeParse({
      username: formData.username,
      password: formData.password,
      domain: formData.domain || undefined
    });

    if (!result.success) {
      const fieldErrors: { username?: string; password?: string; domain?: string } = {};
      result.error.errors.forEach(err => {
        if (err.path[0] === 'username') fieldErrors.username = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
        if (err.path[0] === 'domain') fieldErrors.domain = err.message;
      });
      setErrors(fieldErrors);
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
          username: result.data.username,
          password: result.data.password,
          domain: (result.data.domain || "example.com")
        })
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData?.error || 'Failed to create user');
      }

      toast({
        title: "Success",
        description: "User created successfully",
        duration: 4000
      });
      alert(`✅ User created with email: ${responseData?.email || (result.data.username.toLowerCase() + '@' + (result.data.domain || 'example.com'))}`);

      setFormData({ username: '', password: '', domain: '' });
    } catch (error: any) {
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
                    className={errors.username ? 'border-destructive' : ''}
                  />
                  {errors.username && <p className="text-xs text-destructive mt-1">{errors.username}</p>}
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password (min 8 characters)"
                    autoComplete="new-password"
                    className={errors.password ? 'border-destructive' : ''}
                  />
                  {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
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
                    className={errors.domain ? 'border-destructive' : ''}
                  />
                  {errors.domain && <p className="text-xs text-destructive mt-1">{errors.domain}</p>}
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
