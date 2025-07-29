import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Logo from "@/components/Logo";
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, MessageSquare, Edit, Calendar } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ModuleDetails = () => {
  const navigate = useNavigate();
  const { moduleId } = useParams();
  const { toast } = useToast();
  const [moduleData, setModuleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModuleData();
  }, [moduleId]);

  const fetchModuleData = async () => {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('id', moduleId)
        .single();

      if (error) throw error;
      
      console.log('Module data fetched:', data); // Debug log
      setModuleData(data);
    } catch (error) {
      console.error('Error fetching module:', error); // Debug log
      toast({
        title: "Error",
        description: "Failed to load module data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';
    
    console.log('Processing YouTube URL:', url); // Debug log
    
    // Handle different YouTube URL formats
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)?.[1];
    const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : '';
    
    console.log('Generated embed URL:', embedUrl); // Debug log
    return embedUrl;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 max-w-md mx-auto">
          <div className="text-center py-8">Loading module...</div>
        </div>
      </div>
    );
  }

  if (!moduleData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 max-w-md mx-auto">
          <div className="text-center py-8">Module not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/user-dashboard')}
            className="p-0"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Button>
          <Logo />
        </div>

        <h2 className="text-xl font-semibold mb-6">Lynq: {moduleData.title}</h2>

        <div className="space-y-4">
          {/* Video Player Section */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">LIVE DATA</h3>
              {moduleData?.file_url ? (
                (() => {
                  const embedUrl = getYouTubeEmbedUrl(moduleData.file_url);
                  console.log('Rendering video with URL:', embedUrl); // Debug log
                  
                  return embedUrl ? (
                    <div className="aspect-video rounded-md overflow-hidden">
                      <iframe
                        src={embedUrl}
                        title="LIVE DATA"
                        className="w-full h-full"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    </div>
                  ) : (
                    <div className="bg-muted aspect-video rounded-md flex items-center justify-center">
                      <p className="text-muted-foreground">Invalid video URL format</p>
                    </div>
                  );
                })()
              ) : (
                <div className="bg-muted aspect-video rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground">No video available</p>
                </div>
              )}
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm">Hindi</Button>
                <Button variant="outline" size="sm">English</Button>
              </div>
            </CardContent>
          </Card>

          {/* Screenshot Section */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Live Data Insights</h3>
              {moduleData?.screenshot_url ? (
                (() => {
                  console.log('Rendering screenshot with URL:', moduleData.screenshot_url); // Debug log
                  
                  return (
                    <div className="aspect-video rounded-md overflow-hidden">
                      <img 
                        src={moduleData.screenshot_url} 
                        alt="Live Data Insights"
                        className="w-full h-full object-cover"
                        onLoad={() => console.log('Screenshot loaded successfully')}
                        onError={(e) => console.error('Screenshot failed to load:', e)}
                      />
                    </div>
                  );
                })()
              ) : (
                <div className="bg-muted aspect-video rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground">No insights available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions Section */}
          <div className="space-y-3">
            <Button 
              className="w-full justify-start"
              onClick={() => {
                // Create a sample PDF download (replace with actual PDF generation)
                const link = document.createElement('a');
                link.href = '/api/generate-pdf-report/' + moduleId;
                link.download = `${moduleData.title}-report.pdf`;
                link.click();
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF Report
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate(`/request-form/new`)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Request New Lynq
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate(`/request-form/adapt/${moduleId}`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Adapt This Lynq
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => window.open('https://calendly.com/your-username', '_blank')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Book a Call
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleDetails;