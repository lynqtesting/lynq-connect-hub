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

interface RequestFormProps {
  type: 'new' | 'adapt';
}

const RequestForm = ({ type }: RequestFormProps) => {
  const navigate = useNavigate();
  const { moduleId } = useParams();
  const { toast: showToast } = useToast();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reason: '',
    duration: '1'
  });

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) return;

      const userData = JSON.parse(currentUser);
      
      const { data, error } = await supabase
        .from('recommendations')
        .select('*')
        .eq('user_id', userData.id)
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
    
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        showToast({
          title: "Error",
          description: "Please log in to submit a request",
          variant: "destructive"
        });
        return;
      }

      const userData = JSON.parse(currentUser);
      console.log('User data:', userData);
      console.log('Form data:', formData);

      const requestData = {
        user_id: userData.id,
        module_id: moduleId || null,
        request_type: type,
        title: formData.title,
        description: formData.description + (formData.reason ? `\n\nReason: ${formData.reason}` : ''),
        status: 'pending',
        duration: parseInt(formData.duration)
      };

      console.log('Request data to be inserted:', requestData);

      const { error, data } = await supabase
        .from('requests')
        .insert(requestData)
        .select();

      console.log('Supabase response:', { error, data });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
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

        {/* Recommended Lynqs Section - Placed below the form */}
        <Card className="mt-6 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
              🌟 Recommended for You
            </CardTitle>
            <p className="text-sm text-muted-foreground">Based on your learning journey</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.length > 0 ? (
              recommendations.map((recommendation) => (
                <div key={recommendation.id} className="p-4 bg-card rounded-lg border border-primary/10 hover:border-primary/30 transition-colors shadow-sm">
                  <p className="font-medium text-sm mb-2 text-foreground">{recommendation.content}</p>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      Suggested on {new Date(recommendation.created_at).toLocaleDateString()}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => handleRecommendationSelect(recommendation)}
                    >
                      Create the Lynq
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 bg-card rounded-lg border border-primary/10">
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recommendations available yet. Check back later for personalized suggestions!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RequestForm;