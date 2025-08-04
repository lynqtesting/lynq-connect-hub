import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X } from "lucide-react";

interface RequestLynqModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RequestLynqModal = ({ open, onOpenChange }: RequestLynqModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 1,
    request_type: 'new',
    quantity: 1,
    category: 'Product'
  });
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const fetchRecommendations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's module assignments first
      const { data: assignments, error: assignmentsError } = await supabase
        .from('user_module_assignments')
        .select('module_id')
        .eq('user_id', user.id);

      if (assignmentsError) throw assignmentsError;

      if (assignments && assignments.length > 0) {
        const moduleIds = assignments.map(a => a.module_id);
        
        const { data, error } = await supabase
          .from('recommendations')
          .select(`
            *,
            modules (
              id,
              title
            )
          `)
          .in('module_id', moduleIds);

        if (error) throw error;
        setRecommendations(data || []);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const handleRecommendationSelect = (recommendation: any) => {
    setFormData(prev => ({
      ...prev,
      title: recommendation.content,
      description: `Based on recommendation for: ${recommendation.modules?.title || 'Unknown Module'}`
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (userId: string) => {
    const uploadedFiles = [];
    
    for (const file of attachedFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('recommendation-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('recommendation-files')
        .getPublicUrl(fileName);

      uploadedFiles.push({
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type
      });
    }
    
    return uploadedFiles;
  };

  useEffect(() => {
    if (open) {
      fetchRecommendations();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // First create the request
      const { data: requestData, error: requestError } = await supabase
        .from('requests')
        .insert([{
          ...formData,
          user_id: user.id
        }])
        .select()
        .single();

      if (requestError) throw requestError;

      // Create a recommendation with the request details and category
      const { data: recommendationData, error: recommendationError } = await supabase
        .from('recommendations')
        .insert({
          content: `Category: ${formData.category}\n\nRequest: ${formData.title}\n\nDescription: ${formData.description}`,
          user_id: user.id
        })
        .select()
        .single();

      if (recommendationError) throw recommendationError;

      // Upload files if any
      if (attachedFiles.length > 0) {
        const uploadedFiles = await uploadFiles(user.id);
        
        // Save file records
        for (const fileData of uploadedFiles) {
          const { error: fileError } = await supabase
            .from('recommendation_files')
            .insert({
              recommendation_id: recommendationData.id,
              ...fileData
            });
          
          if (fileError) throw fileError;
        }
      }

      toast({
        title: "Success",
        description: "Your lynq request has been submitted successfully!"
      });

      // Reset form and close modal
      setFormData({ title: '', description: '', duration: 1, request_type: 'new', quantity: 1, category: 'Product' });
      setAttachedFiles([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request New Lynq</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="duration">Duration (minutes)</Label>
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
            <Label htmlFor="quantity">Number of Lynqs</Label>
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

          {/* Category Selection */}
          <div>
            <Label htmlFor="category">Category *</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Product">Product</SelectItem>
                <SelectItem value="Compliance">Compliance</SelectItem>
                <SelectItem value="Customer Awareness">Customer Awareness</SelectItem>
                <SelectItem value="Soft Skills">Soft Skills</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          <div>
            <Label htmlFor="files">Attach Files (optional)</Label>
            <div className="space-y-2">
              <Input
                id="files"
                type="file"
                onChange={handleFileChange}
                multiple
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                className="cursor-pointer"
              />
              {attachedFiles.length > 0 && (
                <div className="space-y-1">
                  {attachedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                      <div className="flex items-center space-x-2">
                        <Upload className="h-4 w-4" />
                        <span className="text-sm font-medium">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {recommendations.length > 0 && (
            <div className="space-y-3">
              <Label>Recommendations</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {recommendations.map((recommendation) => (
                  <div
                    key={recommendation.id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleRecommendationSelect(recommendation)}
                  >
                    <div className="text-sm font-medium">
                      {recommendation.modules?.title || 'General Recommendation'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {recommendation.content}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Click on a recommendation to use it as your lynq request
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="flex-1"
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || uploading} 
              className="flex-1"
            >
              {uploading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RequestLynqModal;