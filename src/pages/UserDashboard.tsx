import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User, Session } from '@supabase/supabase-js';
import { BookOpen, BarChart3, LibraryBig, LogOut, Send } from "lucide-react";

const UserDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userModules, setUserModules] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [tweakableQuestions, setTweakableQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  
  // Request form state
  const [requestForm, setRequestForm] = useState({
    title: '',
    description: '',
    type: ''
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);

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
      fetchTweakableQuestions();
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

  const fetchTweakableQuestions = async () => {
    try {
      // TODO: Enable after types are updated
      // const { data, error } = await supabase
      //   .from('tweakable_questions')
      //   .select('*')
      //   .eq('is_active', true)
      //   .order('created_at', { ascending: false });

      // if (error) throw error;
      // setTweakableQuestions(data || []);
      setTweakableQuestions([]);
    } catch (error) {
      console.error('Error fetching tweakable questions:', error);
    }
  };

  const handleCreateAdaptiveRequest = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('requests')
        .insert({
          user_id: user.id,
          request_type: 'adaptive',
          title: 'Adaptive LYNQ Request',
          description: 'User requested a new adaptive LYNQ module',
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Request sent",
        description: "Your adaptive LYNQ request has been submitted successfully.",
      });
    } catch (error) {
      console.error('Error creating adaptive request:', error);
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTweakRequest = async (questionId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('tweak_requests')
        .insert({
          user_id: user.id,
          question_id: questionId,
          note: 'User submitted a tweak request',
        });

      if (error) throw error;

      toast({
        title: "Tweak request sent",
        description: "Your tweak request has been submitted successfully.",
      });
    } catch (error) {
      console.error('Error creating tweak request:', error);
      toast({
        title: "Error",
        description: "Failed to submit tweak request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitRequest = async () => {
    if (!user || !requestForm.title || !requestForm.type) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setSubmittingRequest(true);
    try {
      const { error } = await supabase
        .from('requests')
        .insert({
          user_id: user.id,
          request_type: requestForm.type,
          title: requestForm.title,
          description: requestForm.description || '',
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Request submitted",
        description: "Your request has been sent to the admin team for review.",
      });

      // Reset form
      setRequestForm({ title: '', description: '', type: '' });
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingRequest(false);
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
      setTweakableQuestions([]);
      
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

        {/* Adaptive LYNQ Requests Section */}
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">Adaptive LYNQs</h2>
          <Card className="rounded-2xl">
            <CardContent className="p-6 text-center">
              <div className="size-12 rounded-2xl bg-primary/10 grid place-items-center mx-auto mb-3">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Create Custom LYNQ</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Request a personalized LYNQ module tailored to your needs
              </p>
              <Button 
                className="w-full" 
                onClick={handleCreateAdaptiveRequest}
              >
                Create Now
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Submit Request Section */}
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">Submit Request</h2>
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Request Type</label>
                  <Select value={requestForm.type} onValueChange={(value) => setRequestForm({...requestForm, type: value})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select request type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adaptive">Adaptive Request</SelectItem>
                      <SelectItem value="tweak">Tweak Request</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input 
                    placeholder="Enter request title"
                    value={requestForm.title}
                    onChange={(e) => setRequestForm({...requestForm, title: e.target.value})}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea 
                    placeholder="Describe your request in detail"
                    value={requestForm.description}
                    onChange={(e) => setRequestForm({...requestForm, description: e.target.value})}
                    className="mt-1"
                    rows={3}
                  />
                </div>
                
                <Button 
                  onClick={handleSubmitRequest}
                  disabled={submittingRequest || !requestForm.title || !requestForm.type}
                  className="w-full"
                >
                  {submittingRequest ? (
                    "Submitting..."
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Tweakable Questions Section */}
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">Tweakable Questions</h2>
          {tweakableQuestions.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="p-6 text-center">
                <div className="text-sm text-muted-foreground">No questions available. Check back soon.</div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tweakableQuestions.map((question) => (
                <Card key={question.id} className="rounded-2xl">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{question.title}</h3>
                        {question.category && (
                          <p className="text-xs text-muted-foreground mt-1">{question.category}</p>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleTweakRequest(question.id)}
                      >
                        Submit Tweak
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

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