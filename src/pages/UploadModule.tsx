import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload } from 'lucide-react';

const UploadModule = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    contentType: 'youtube' as 'youtube' | 'file',
    youtubeUrl: '',
    file: null as File | null,
    screenshot: null as File | null,
    pdfReport: null as File | null
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
    }
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, screenshot: file }));
    }
  };

  const handlePdfReportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, pdfReport: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || (formData.contentType === 'file' && !formData.file) || (formData.contentType === 'youtube' && !formData.youtubeUrl)) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let publicUrl = '';
      let fileType = 'video';

      if (formData.contentType === 'youtube') {
        publicUrl = formData.youtubeUrl;
        fileType = 'video';
      } else if (formData.file) {
        // Upload file to storage
        const fileExt = formData.file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('modules')
          .upload(fileName, formData.file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl: filePublicUrl } } = supabase.storage
          .from('modules')
          .getPublicUrl(fileName);
        
        publicUrl = filePublicUrl;
        fileType = formData.file.type.includes('video') ? 'video' : 
                  formData.file.type.includes('image') ? 'image' : 'document';
      }

      // Upload screenshot if provided
      let screenshotUrl = null;
      if (formData.screenshot) {
        const screenshotExt = formData.screenshot.name.split('.').pop();
        const screenshotFileName = `screenshot_${Date.now()}.${screenshotExt}`;
        
        const { error: screenshotUploadError } = await supabase.storage
          .from('screenshots')
          .upload(screenshotFileName, formData.screenshot);

        if (screenshotUploadError) throw screenshotUploadError;

        const { data: { publicUrl: screenshotPublicUrl } } = supabase.storage
          .from('screenshots')
          .getPublicUrl(screenshotFileName);
        
        screenshotUrl = screenshotPublicUrl;
      }

      // Upload PDF report if provided
      let pdfReportUrl = null;
      if (formData.pdfReport) {
        const pdfExt = formData.pdfReport.name.split('.').pop();
        const pdfFileName = `report_${Date.now()}.${pdfExt}`;
        
        const { error: pdfUploadError } = await supabase.storage
          .from('reports')
          .upload(pdfFileName, formData.pdfReport);

        if (pdfUploadError) throw pdfUploadError;

        const { data: { publicUrl: pdfPublicUrl } } = supabase.storage
          .from('reports')
          .getPublicUrl(pdfFileName);
        
        pdfReportUrl = pdfPublicUrl;
      }

      // Create module record
      const { error: dbError } = await supabase
        .from('modules')
        .insert({
          title: formData.title,
          description: formData.description,
          file_url: publicUrl,
          screenshot_url: screenshotUrl,
          pdf_report_url: pdfReportUrl,
          file_type: fileType
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Lynq uploaded successfully"
      });

      navigate('/admin-dashboard');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload lynq",
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
          onClick={() => navigate('/admin-dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="mr-2 h-5 w-5" />
              Upload New Lynq
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Lynq title"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Lynq description"
                />
              </div>

              <div>
                <Label>Content Type *</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="contentType"
                      checked={formData.contentType === 'youtube'}
                      onChange={() => setFormData(prev => ({ ...prev, contentType: 'youtube' }))}
                    />
                    <span>YouTube Video</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="contentType"
                      checked={formData.contentType === 'file'}
                      onChange={() => setFormData(prev => ({ ...prev, contentType: 'file' }))}
                    />
                    <span>File Upload</span>
                  </label>
                </div>
              </div>

              {formData.contentType === 'youtube' ? (
                <div>
                  <Label htmlFor="youtubeUrl">YouTube URL *</Label>
                  <Input
                    id="youtubeUrl"
                    type="url"
                    value={formData.youtubeUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="file">File *</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    accept="video/*,image/*,.pdf,.doc,.docx"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="screenshot">Live Data Insights</Label>
                <Input
                  id="screenshot"
                  type="file"
                  onChange={handleScreenshotChange}
                  accept="image/*"
                />
              </div>

              <div>
                <Label htmlFor="pdfReport">PDF Report (Connect to User)</Label>
                <Input
                  id="pdfReport"
                  type="file"
                  onChange={handlePdfReportChange}
                  accept=".pdf"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Uploading...' : 'Upload Lynq'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UploadModule;