import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import Logo from "@/components/Logo";
import RequestLynqModal from "@/components/RequestLynqModal";
import AdaptLynqModal from "@/components/AdaptLynqModal";
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, MessageSquare, Edit, Calendar, Maximize2, Info } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ModuleDetails = () => {
  const navigate = useNavigate();
  const { moduleId } = useParams();
  const { toast } = useToast();
  const [moduleData, setModuleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [adaptModalOpen, setAdaptModalOpen] = useState(false);

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

        <h2 className="text-2xl font-bold mb-6">Lynq: {moduleData.title}</h2>

        <div className="space-y-4">
          {/* Quick Actions Section - Move to Top */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Quick Actions</h3>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                      <Info className="h-4 w-4" />
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent side="left" className="w-72">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Quick Actions Help</p>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p><strong>Download:</strong> Get the PDF report for this module</p>
                        <p><strong>Request:</strong> Ask for a new Lynq module</p>
                        <p><strong>Adapt:</strong> Modify this existing Lynq</p>
                        <p><strong>Book Call:</strong> Schedule a consultation</p>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
              <TooltipProvider>
                <div className="grid grid-cols-2 gap-4 sm:flex sm:justify-around sm:items-center">
                  <div className="flex flex-col items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline"
                          size="lg"
                          className="h-16 w-16 rounded-full flex-col gap-1 p-2 touch-manipulation"
                          onClick={async () => {
                          if (moduleData?.pdf_report_url) {
                            try {
                              // Direct download approach
                              const link = document.createElement('a');
                              link.href = moduleData.pdf_report_url;
                              link.download = `${moduleData.title}-report.pdf`;
                              link.target = '_blank';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              
                              toast({
                                title: "Success",
                                description: "PDF report download started"
                              });
                            } catch (error) {
                              console.error('Error downloading PDF:', error);
                              // Fallback - open in new tab
                              window.open(moduleData.pdf_report_url, '_blank');
                              toast({
                                title: "Opening PDF",
                                description: "PDF opened in new tab"
                              });
                            }
                          } else {
                            toast({
                              title: "No Report Available",
                              description: "PDF report has not been uploaded for this lynq",
                              variant: "destructive"
                            });
                          }
                        }}
                      >
                          <Download className="h-6 w-6" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm font-medium">Download PDF Report</p>
                      </TooltipContent>
                    </Tooltip>
                    <span className="text-xs text-center font-medium">Download</span>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline"
                          size="lg"
                          className="h-16 w-16 rounded-full flex-col gap-1 p-2 touch-manipulation"
                          onClick={() => setRequestModalOpen(true)}
                        >
                          <MessageSquare className="h-6 w-6" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm font-medium">Request New Lynq</p>
                      </TooltipContent>
                    </Tooltip>
                    <span className="text-xs text-center font-medium">Request</span>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline"
                          size="lg"
                          className="h-16 w-16 rounded-full flex-col gap-1 p-2 touch-manipulation"
                          onClick={() => setAdaptModalOpen(true)}
                        >
                          <Edit className="h-6 w-6" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm font-medium">Adapt This Lynq</p>
                      </TooltipContent>
                    </Tooltip>
                    <span className="text-xs text-center font-medium">Adapt</span>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline"
                          size="lg"
                          className="h-16 w-16 rounded-full flex-col gap-1 p-2 touch-manipulation"
                          onClick={() => window.open('https://calendly.com/your-username', '_blank')}
                        >
                          <Calendar className="h-6 w-6" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm font-medium">Book a Call</p>
                      </TooltipContent>
                    </Tooltip>
                    <span className="text-xs text-center font-medium">Book Call</span>
                  </div>
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>

          {/* Video Player Section - Compact */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">LIVE DATA</h3>
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                        <Info className="h-4 w-4" />
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent side="top" className="w-80">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Live Data Metrics</p>
                        <p className="text-xs text-muted-foreground">
                          This is the live data metrics getting tracked, coming from your employees 
                          after the lynqs are distributed in your organisation.
                        </p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </div>
                {moduleData?.file_url && getYouTubeEmbedUrl(moduleData.file_url) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setVideoModalOpen(true)}
                    className="p-1 h-8 w-8"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {moduleData?.file_url ? (
                (() => {
                  const embedUrl = getYouTubeEmbedUrl(moduleData.file_url);
                  console.log('Rendering video with URL:', embedUrl); // Debug log
                  
                  return embedUrl ? (
                    <div 
                      className="aspect-video rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setVideoModalOpen(true)}
                    >
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

          {/* Screenshot Section - Taller for better visibility */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold">Data Performance</h3>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                      <Info className="h-4 w-4" />
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent side="top" className="w-80">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Data Performance Insights</p>
                      <p className="text-xs text-muted-foreground">
                        The data being interpreted and deduced to showcase product perceptions 
                        and consumer insights on your product through your employees.
                      </p>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
              {moduleData?.screenshot_url ? (
                (() => {
                  console.log('Rendering screenshot with URL:', moduleData.screenshot_url); // Debug log
                  
                  return (
                     <div className="aspect-[16/9] rounded-lg overflow-hidden border">
                       <img 
                         src={moduleData.screenshot_url} 
                         alt="Data Performance Insights"
                         className="w-full h-full object-cover"
                         onLoad={() => console.log('Screenshot loaded successfully')}
                         onError={(e) => console.error('Screenshot failed to load:', e)}
                       />
                     </div>
                  );
                })()
              ) : (
                 <div className="bg-muted aspect-[16/9] rounded-lg flex items-center justify-center border">
                   <p className="text-muted-foreground">No performance data available</p>
                 </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Video Modal */}
        <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
          <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0">
            <DialogHeader className="p-4 pb-2">
              <DialogTitle>Lynq: {moduleData?.title}</DialogTitle>
            </DialogHeader>
            <div className="px-4 pb-4">
              {moduleData?.file_url && (
                <div className="aspect-video rounded-md overflow-hidden">
                  <iframe
                    src={getYouTubeEmbedUrl(moduleData.file_url)}
                    title="LIVE DATA - Full Size"
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Request New Lynq Modal */}
        <RequestLynqModal 
          open={requestModalOpen} 
          onOpenChange={setRequestModalOpen}
        />

        {/* Adapt Lynq Modal */}
        <AdaptLynqModal 
          open={adaptModalOpen} 
          onOpenChange={setAdaptModalOpen}
          moduleId={moduleId || ''}
          moduleTitle={moduleData?.title || ''}
        />
      </div>
    </div>
  );
};

export default ModuleDetails;