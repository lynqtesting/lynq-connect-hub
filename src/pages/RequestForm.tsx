import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuthPersistence } from "@/hooks/useAuthPersistence";

interface RequestFormProps {
  type: 'new' | 'adapt';
}

const RequestForm = ({ type }: RequestFormProps) => {
  const navigate = useNavigate();
  const { moduleId } = useParams();
  const { toast: showToast } = useToast();
  const { user, loading } = useAuthPersistence();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reason: '',
    duration: '1'
  });

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
  }, [user]);

  const fetchRecommendations = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('recommendations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecommendations(data || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const handleRecommendationSelect = (recommendation: any) => {
    setFormData({
      title: `Request: ${recommendation.content.split('\n')[0] || 'New Lynq'}`,
      description: recommendation.content,
      reason: 'Based on admin recommendation',
      duration: '1'
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      showToast({
        title: "Error",
        description: "Please log in to submit a request",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }
    
    try {
      const requestData = {
        user_id: user.id,
        module_id: moduleId || null,
        request_type: type,
        title: formData.title,
        description: formData.description + (formData.reason ? `\n\nReason: ${formData.reason}` : ''),
        status: 'pending',
        duration: parseInt(formData.duration)
      };

      const { error, data } = await supabase
        .from('requests')
        .insert(requestData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Send email notification
      try {
        await supabase.functions.invoke('send-request-notification', {
          body: {
            requestId: data.id,
            userId: user.id,
            moduleId: moduleId || null,
            requestType: type,
            title: formData.title,
            description: formData.description + (formData.reason ? `\n\nReason: ${formData.reason}` : ''),
            duration: parseInt(formData.duration),
            createdAt: data.created_at
          }
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't block the user flow if email fails
      }

      showToast({
        title: "Success",
        description: `${type === 'new' ? 'New module' : 'Adaptation'} request submitted!`
      });
      
      navigate('/user-dashboard');
    } catch (error) {
      console.error('Full error:', error);
      showToast({
        title: "Error",
        description: `Failed to submit request: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold">Loading...</div>
          <div className="text-sm text-muted-foreground">Checking authentication...</div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="p-0"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {type === 'new' ? 'Request New Lynq' : 'Adapt This Lynq'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Lynq Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={type === 'adapt' ? `Adaptation for Lynq ${moduleId}` : 'Enter lynq title'}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">What do you want changed?</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what you need..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Why/Follow-up?</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Additional details..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Lynq Duration (minutes)</Label>
                <Select value={formData.duration} onValueChange={(value) => setFormData({ ...formData, duration: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 minute</SelectItem>
                    <SelectItem value="2">2 minutes</SelectItem>
                    <SelectItem value="3">3 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-muted/50 rounded-md">
                <p className="text-xs text-muted-foreground">
                  ⏱️ <strong>Timeline:</strong> Each Lynq creation takes 5 working days post approval
                </p>
              </div>

              <Button type="submit" className="w-full">
                Submit Request
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recommendations Section - Amazon-style separate containers */}
        {recommendations.length > 0 && (
          <div className="mt-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Based on the feedback coming from your audience, we would recommend these lynqs
              </h2>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  ⚠️ Kindly note that creation of a lynq takes 5 working days post approval
                </p>
              </div>
            </div>
            
            {/* Each recommendation as a completely separate container */}
            <div className="space-y-6">
              {recommendations.map((recommendation, index) => (
                <div key={recommendation.id} className="w-full">
                  {/* Individual recommendation container */}
                  <Card className="group hover:shadow-xl transition-all duration-300 border-2 border-border hover:border-primary/40 bg-gradient-to-br from-card to-card/80">
                    <CardContent className="p-0">
                      {/* Header section */}
                      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-6 py-4 border-b border-border">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">🎯</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-foreground">
                              Recommended Lynq #{index + 1}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Personalized for your learning journey
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Content section */}
                      <div className="p-6">
                        <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg p-4 mb-4">
                          <h4 className="font-semibold text-foreground text-base mb-2">
                            📝 Recommendation Details:
                          </h4>
                          <p className="text-sm text-foreground leading-relaxed">
                            {recommendation.content}
                          </p>
                        </div>
                        
                        {/* Meta information */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1 bg-secondary/20 px-2 py-1 rounded-full">
                              📅 {new Date(recommendation.created_at).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1 bg-secondary/20 px-2 py-1 rounded-full">
                              ⏱️ Est. {Math.floor(Math.random() * 3) + 1} min
                            </span>
                            <span className="flex items-center gap-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                              ✨ Trending
                            </span>
                          </div>
                        </div>
                        
                        {/* Action section */}
                        <div className="flex items-center gap-3">
                          <Button 
                            onClick={() => handleRecommendationSelect(recommendation)}
                            className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            🚀 Create this Lynq
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="px-4 py-3 border-2 hover:bg-secondary/10"
                          >
                            📋 Preview
                          </Button>
                        </div>
                        
                        <p className="text-xs text-muted-foreground text-center mt-3 italic">
                          "Click 'Create this Lynq' to auto-fill the form above with these details"
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestForm;