import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";
import { useParams } from 'react-router-dom';

interface TweakRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionId: string;
  questionTitle: string;
}

const TweakRequestModal: React.FC<TweakRequestModalProps> = ({ 
  open, 
  onOpenChange,
  questionId,
  questionTitle
}) => {
  const { toast } = useToast();
  const { moduleId } = useParams();
  const [tweakContent, setTweakContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!tweakContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter your tweak request content.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to submit a tweak request.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('tweak_requests')
        .insert({
          user_id: user.id,
          module_id: moduleId,
          question_id: questionId,
          title: questionTitle,
          notes: tweakContent,
        });

      if (error) throw error;

      toast({
        title: "Tweak request sent",
        description: "Your tweak request has been submitted!"
      });

      // Reset form and close modal
      setTweakContent('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting tweak request:', error);
      toast({
        title: "Error",
        description: "Failed to submit tweak request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setTweakContent('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Submit Tweak Request</DialogTitle>
          <DialogDescription>
            Share materials or notes to refine: <strong>{questionTitle}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium">Your Request</label>
            <Textarea 
              placeholder="Describe what you'd like to tweak or improve about this topic..."
              value={tweakContent}
              onChange={(e) => setTweakContent(e.target.value)}
              className="mt-1"
              rows={6}
            />
          </div>
        </div>
        
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={handleCancel} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading || !tweakContent.trim()}
            className="flex-1"
          >
            {loading ? (
              "Submitting..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Tweak
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TweakRequestModal;