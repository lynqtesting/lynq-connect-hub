import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Edit Module Component for Lynqs
const EditModule = () => {
  const navigate = useNavigate();
  const { moduleId } = useParams();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    fileUrl: '',
    fileType: 'video'
  });
  
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [pdfReport, setPdfReport] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (moduleId) {
      fetchModuleData();
    }
  }, [moduleId]);

  const fetchModuleData = async () => {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('id', moduleId)
        .single();

      if (error) throw error;

      setFormData({
        title: data.title || '',
        description: data.description || '',
        fileUrl: data.file_url || '',
        fileType: data.file_type || 'video'
      });
    } catch (error) {
      console.error('Error fetching module:', error);
      toast({
        title: "Error",
        description: "Failed to load lynq data",
        variant: "destructive"
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshot(e.target.files[0]);
    }
  };

  const handlePdfReportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfReport(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File, bucket: string, folder: string = '') => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let screenshotUrl = null;
      let pdfReportUrl = null;

      // Upload new screenshot if provided
      if (screenshot) {
        screenshotUrl = await uploadFile(screenshot, 'screenshots');
      }

      // Upload new PDF report if provided
      if (pdfReport) {
        pdfReportUrl = await uploadFile(pdfReport, 'reports');
      }

      // Update module data
      const updateData: any = {
        title: formData.title,
        description: formData.description,
        file_url: formData.fileUrl,
        file_type: formData.fileType,
        updated_at: new Date().toISOString()
      };

      if (screenshotUrl) {
        updateData.screenshot_url = screenshotUrl;
      }

      if (pdfReportUrl) {
        updateData.pdf_report_url = pdfReportUrl;
      }

      const { error } = await supabase
        .from('modules')
        .update(updateData)
        .eq('id', moduleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lynq updated successfully!",
      });

      navigate('/view-modules');
    } catch (error) {
      console.error('Error updating module:', error);
      toast({
        title: "Error",
        description: "Failed to update lynq",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center py-8">Loading lynq data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/view-modules')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Lynqs
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Edit Lynq</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Lynq Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter lynq title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your lynq content"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="fileUrl">Video/Content URL</Label>
                <Input
                  id="fileUrl"
                  name="fileUrl"
                  type="url"
                  value={formData.fileUrl}
                  onChange={handleInputChange}
                  placeholder="https://youtube.com/watch?v=..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="screenshot">Update Live Data Insights (Optional)</Label>
                <Input
                  id="screenshot"
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Upload a new screenshot to replace the current one
                </p>
              </div>

              <div>
                <Label htmlFor="pdfReport">Update PDF Report (Optional)</Label>
                <Input
                  id="pdfReport"
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfReportChange}
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Upload a new PDF report to replace the current one
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Update Lynq
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditModule;