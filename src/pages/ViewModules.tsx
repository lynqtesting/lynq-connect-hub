import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Eye, FileText, Video, Image, Edit } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface Module {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_type: string;
  screenshot_url: string;
  created_at: string;
}

const ViewModules = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setModules(data || []);
    } catch (error) {
      console.error('Error fetching modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileTypeIcon = (fileType: string) => {
    if (fileType === 'video') return Video;
    if (fileType === 'image') return Image;
    return FileText;
  };

  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <p>Loading modules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/admin-dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold">All Lynqs</h1>
          <p className="text-muted-foreground">Total: {modules.length} lynqs</p>
        </div>

        {modules.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No lynqs uploaded yet.</p>
              <Button 
                onClick={() => navigate('/upload-module')}
                className="mt-4"
              >
                Upload First Lynq
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {modules.map((module) => {
              const FileIcon = getFileTypeIcon(module.file_type);
              return (
                <Card key={module.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="flex items-center">
                        <FileIcon className="mr-2 h-5 w-5" />
                        {module.title}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="secondary">
                          {module.file_type}
                        </Badge>
                        {isYouTubeUrl(module.file_url) && (
                          <Badge variant="outline">YouTube</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {module.description && (
                      <p className="text-muted-foreground mb-4">{module.description}</p>
                    )}
                    
                    <div className="flex gap-2 mb-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(module.file_url, '_blank')}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Content
                      </Button>
                      
                      {module.screenshot_url && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(module.screenshot_url, '_blank')}
                        >
                          <Image className="mr-2 h-4 w-4" />
                          View Screenshot
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/edit-module/${module.id}`)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(module.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewModules;