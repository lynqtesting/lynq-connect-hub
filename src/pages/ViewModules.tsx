import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, FileText, Video, Image, Edit, RefreshCw, AlertCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useModuleFetching } from '@/hooks/useModuleFetching';

const ViewModules = () => {
  const navigate = useNavigate();
  const { modules, loading, error, isEmpty, refetch } = useModuleFetching();

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
            <p className="text-muted-foreground">Loading modules...</p>
          </div>
          
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">All Lynqs</h1>
              <p className="text-muted-foreground">
                {error ? 'Error loading modules' : `Total: ${modules.length} lynqs`}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={refetch}>
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {isEmpty && !error ? (
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