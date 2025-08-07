import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Logo from "@/components/Logo";
import RequestLynqModal from "@/components/RequestLynqModal";
import AdaptLynqModal from "@/components/AdaptLynqModal";
import { DataDashboard } from "@/components/DataDashboard";
import { GraphAnalyzer } from "@/components/GraphAnalyzer";
import { InteractiveGraph } from "@/components/InteractiveGraph";
import { AudioOverview } from "@/components/AudioOverview";
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, MessageSquare, Edit, Calendar, Info, ExternalLink, BarChart3 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ModuleDetails = () => {
  const navigate = useNavigate();
  const { moduleId } = useParams();
  const { toast } = useToast();
  const [moduleData, setModuleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [adaptModalOpen, setAdaptModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'audio'>('analysis');

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

        <h2 className="text-2xl font-bold mb-4">Lynq: {moduleData.title}</h2>

        {/* View Module Button */}
        {moduleData?.module_link && (
          <Button
            onClick={() => window.open(moduleData.module_link, '_blank')}
            className="w-full mb-6 bg-primary hover:bg-primary/90"
            size="lg"
          >
            <ExternalLink className="h-5 w-5 mr-2" />
            View Lynq
          </Button>
        )}

        <div className="space-y-4">
          {/* Quick Actions Section - Move to Top */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Quick Actions</h3>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-1 h-6 w-6 touch-manipulation">
                      <Info className="h-4 w-4 text-blue-500" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent side="left" className="w-64 bg-blue-50 border-blue-200 z-50">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-blue-900">Quick Actions Help</p>
                      <div className="text-xs text-blue-700 space-y-1">
                        <p><strong>Request:</strong> Generating a new lynq based on the previous feedback.</p>
                        <p><strong>Adapt:</strong> You can adapt the data coming from the lynqs by asking follow up questions to your sales force on the Lynqs.</p>
                        <p><strong>Book a call:</strong> Book an interpretation call to understand your lynqs better.</p>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
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
                          onClick={() => window.open('https://calendly.com/ishanibehl-kea/30min', '_blank')}
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

          {/* Interactive Analysis Section */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">LIVE DATA ANALYSIS</h3>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-1 h-6 w-6 touch-manipulation">
                        <Info className="h-4 w-4 text-blue-500" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent side="top" className="w-64 bg-blue-50 border-blue-200 z-50">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-blue-900">Live Analysis</p>
                        <p className="text-xs text-blue-700">
                          Real-time analysis of key objections and investment aspects from your lynq data.
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>

              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'analysis' | 'audio')}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="analysis">Key Objections</TabsTrigger>
                  <TabsTrigger value="audio">Audio Overview</TabsTrigger>
                </TabsList>
                
                <TabsContent value="analysis" className="space-y-6 mt-0">
                  <InteractiveGraph data={{
                    type: "bar",
                    title: "Confusion Areas Analysis",
                    metrics: [
                      { label: "Cost Objection", value: 65, color: "#ef4444" },
                      { label: "Investment Confusion", value: 35, color: "#f59e0b" },
                      { label: "Premium Too High", value: 45, color: "#f87171" },
                      { label: "Poor Value Perception", value: 38, color: "#fca5a5" },
                      { label: "Health & Wealth Mix", value: 28, color: "#fde68a" },
                      { label: "Fund Performance", value: 22, color: "#fbbf24" }
                    ]
                  }} />
                  
                  {/* Follow-up Questions Section */}
                  {moduleData?.followup_questions_url && (
                    <div className="space-y-4 animate-fade-in" style={{ animationDelay: '600ms' }}>
                      <h3 className="text-xl font-semibold text-foreground">Generated Questions</h3>
                      <div className="rounded-lg border border-border overflow-hidden shadow-lg">
                        <img 
                          src={moduleData.followup_questions_url} 
                          alt="Generated follow-up questions"
                          className="w-full h-auto"
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="audio" className="mt-0">
                  <AudioOverview englishAudioUrl={moduleData?.english_audio_url} />
                </TabsContent>
              </Tabs>

              {/* Follow-up Questions Section */}
              {moduleData?.followup_questions_url && (
                  <div className="mt-8 space-y-4 animate-fade-in" style={{ animationDelay: '600ms' }}>
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-foreground mb-2">Follow-up Questions to Tweak Lynqs</h3>
                      <div className="w-20 h-1 bg-primary mx-auto rounded-full"></div>
                    </div>
                    <div className="animate-fade-in">
                      <img 
                        src={moduleData.followup_questions_url} 
                        alt="Follow-up Questions to Tweak Lynqs"
                        className="w-full h-auto rounded-lg"
                      />
                    </div>
                  </div>
              )}
            </CardContent>
          </Card>

          {/* Data Performance Section */}
          <DataDashboard />
        </div>


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