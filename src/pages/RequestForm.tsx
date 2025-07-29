import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    reason: ''
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

      const requestData = {
        user_id: userData.id,
        module_id: moduleId || null,
        request_type: type,
        title: formData.title,
        description: formData.description + (formData.reason ? `\n\nReason: ${formData.reason}` : ''),
        status: 'pending'
      };

      const { error } = await supabase
        .from('requests')
        .insert(requestData);

      if (error) throw error;

      showToast({
        title: "Success",
        description: `${type === 'new' ? 'New module' : 'Adaptation'} request submitted!`
      });
      
      navigate('/user-dashboard');
    } catch (error) {
      showToast({
        title: "Error",
        description: "Failed to submit request",
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

        {/* Recommended Lynqs Section - Prominent like Amazon */}
        {recommendations.length > 0 && (
          <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
                🌟 Recommended for You
              </CardTitle>
              <p className="text-sm text-muted-foreground">Based on your learning journey</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendations.map((recommendation) => (
                <div key={recommendation.id} className="p-4 bg-card rounded-lg border border-primary/10 hover:border-primary/30 transition-colors shadow-sm">
                  <p className="font-medium text-sm mb-2 text-foreground">{recommendation.content}</p>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      Suggested on {new Date(recommendation.created_at).toLocaleDateString()}
                    </p>
                    <Button variant="outline" size="sm" className="text-xs">
                      Learn More
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

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

              <Button type="submit" className="w-full">
                Submit Request
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RequestForm;