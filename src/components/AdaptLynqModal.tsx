import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AdaptLynqModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
  moduleTitle: string;
}

const AdaptLynqModal = ({ open, onOpenChange, moduleId, moduleTitle }: AdaptLynqModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: `Adapted: ${moduleTitle}`,
    description: '',
    duration: 1,
    request_type: 'adapt',
    quantity: 1
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('requests')
        .insert([{
          ...formData,
          user_id: user.id,
          module_id: moduleId
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your adaptation request has been submitted successfully!"
      });

      // Reset form and close modal
      setFormData({ 
        title: `Adapted: ${moduleTitle}`, 
        description: '', 
        duration: 1, 
        request_type: 'adapt',
        quantity: 1
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting adaptation request:', error);
      toast({
        title: "Error",
        description: "Failed to submit adaptation request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[90vw]">
        <DialogHeader>
          <DialogTitle>Adapt This Lynq</DialogTitle>
        </DialogHeader>
        <div className="mb-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Original: <span className="font-medium">{moduleTitle}</span>
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="adapt-title">New Title</Label>
            <Input
              id="adapt-title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="adapt-description">What changes would you like?</Label>
            <Textarea
              id="adapt-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              placeholder="Describe how you'd like to adapt this lynq..."
            />
          </div>

          <div>
            <Label htmlFor="adapt-duration">Duration (minutes)</Label>
            <Select value={formData.duration.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, duration: parseInt(value) }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 minute</SelectItem>
                <SelectItem value="2">2 minutes</SelectItem>
                <SelectItem value="3">3 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="adapt-quantity">Number of Lynqs</Label>
            <Select value={formData.quantity.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, quantity: parseInt(value) }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 lynq</SelectItem>
                <SelectItem value="2">2 lynqs</SelectItem>
                <SelectItem value="3">3 lynqs</SelectItem>
                <SelectItem value="4">4 lynqs</SelectItem>
                <SelectItem value="5">5 lynqs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Submitting..." : "Submit Adaptation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdaptLynqModal;