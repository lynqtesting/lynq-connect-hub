import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

interface RequestLynqModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RequestLynqModal: React.FC<RequestLynqModalProps> = ({ 
  open, 
  onOpenChange
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: ''
  });

  // Check if there's a pre-selected adaptive idea
  useEffect(() => {
    if (open) {
      const selectedIdea = localStorage.getItem('selectedAdaptiveIdea');
      if (selectedIdea) {
        try {
          const idea = JSON.parse(selectedIdea);
          setFormData(prev => ({
            ...prev,
            type: 'adaptive',
            title: `Request: ${idea.title}`,
            description: `Based on: ${idea.description}\n\nMy specific request: `
          }));
          localStorage.removeItem('selectedAdaptiveIdea');
        } catch (error) {
          console.error('Error parsing selected idea:', error);
        }
      }
    }
  }, [open]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.title || !formData.type) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
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
          description: "You must be logged in to submit a request.",
          variant: "destructive",
        });
        return;
      }

      const { data: requestData, error } = await supabase
        .from('requests')
        .insert({
          user_id: user.id,
          request_type: formData.type,
          title: formData.title,
          description: formData.description || '',
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Send email notification
      try {
        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-request-notification', {
          body: {
            requestId: requestData.id,
            userId: user.id,
            requestType: formData.type,
            title: formData.title,
            description: formData.description,
            createdAt: requestData.created_at
          }
        });
        
        console.log('Email notification result:', { emailData, emailError });
        
        if (emailError) {
          console.error('Email notification failed:', emailError);
          toast({
            title: "Request submitted",
            description: "Request saved successfully, but email notification failed. Admin will still see your request.",
            variant: "destructive",
          });
        }
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        toast({
          title: "Request submitted", 
          description: "Request saved successfully, but email notification failed. Admin will still see your request.",
          variant: "destructive",
        });
      }

      toast({
        title: formData.type === 'adaptive' ? "Request sent" : "Request submitted", 
        description: formData.type === 'adaptive' 
          ? "Your adaptive LYNQ request has been submitted!"
          : "Your request has been sent to the admin team for review."
      });

      // Reset form and close modal
      setFormData({ title: '', description: '', type: '' });
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ title: '', description: '', type: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Submit Request</DialogTitle>
          <DialogDescription>
            Fill out the form below to submit your request to the admin team.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium">Request Type *</label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => setFormData({...formData, type: value})}
            >
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
            <label className="text-sm font-medium">Title *</label>
            <Input 
              placeholder="Enter request title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="mt-1"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea 
              placeholder="Describe your request in detail"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="mt-1"
              rows={4}
            />
          </div>
        </div>
        
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={handleCancel} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading || !formData.title || !formData.type}
            className="flex-1"
          >
            {loading ? (
              "Submitting..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Request
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestLynqModal;