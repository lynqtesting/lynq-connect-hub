import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuthPersistence } from "@/hooks/useAuthPersistence";

const TweakRequestForm = () => {
  const navigate = useNavigate();
  const { moduleId } = useParams();
  const [searchParams] = useSearchParams();
  const questionId = searchParams.get('questionId');
  const { toast } = useToast();
  const { user } = useAuthPersistence();
  
  const [formData, setFormData] = useState({
    notes: ''
  });
  const [module, setModule] = useState<any>(null);
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (moduleId) {
      fetchModuleAndQuestion();
    }
  }, [moduleId, questionId]);

  const fetchModuleAndQuestion = async () => {
    try {
      // Fetch module details
      const { data: moduleData, error: moduleError } = await supabase
        .from('modules')
        .select('id, title')
        .eq('id', moduleId)
        .single();

      if (moduleError) throw moduleError;
      setModule(moduleData);

      // Fetch question details if questionId exists
      if (questionId) {
        const { data: questionData, error: questionError } = await supabase
          .from('tweakable_questions')
          .select('id, title')
          .eq('id', questionId)
          .single();

        if (questionError) throw questionError;
        setQuestion(questionData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load form data",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to submit a request",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('tweak_requests')
        .insert({
          user_id: user.id,
          module_id: moduleId,
          question_id: questionId,
          notes: formData.notes,
          title: question?.title || 'Tweak Request'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tweak request submitted successfully"
      });

      navigate(`/module/${moduleId}`);
    } catch (error) {
      console.error('Error submitting tweak request:', error);
      toast({
        title: "Error",
        description: "Failed to submit tweak request",
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
          onClick={() => navigate(`/module/${moduleId}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Module
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Submit Tweak Request</CardTitle>
            {module && (
              <p className="text-sm text-muted-foreground">
                Module: {module.title}
              </p>
            )}
            {question && (
              <p className="text-sm text-muted-foreground">
                Topic: {question.title}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  Notes or Comments (Optional)
                </label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Share any specific feedback, suggestions, or materials you'd like to include..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Tweak Request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TweakRequestForm;