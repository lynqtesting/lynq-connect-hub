import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Plus, Minus } from 'lucide-react';

const UploadModule = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    moduleLink: '',
    file: null as File | null,
    audioOverview: null as File | null,
    category: 'Product',
    tweakingTopics: ''
  });

  // Analytics fields for client dashboard linkage
  const [kpis, setKpis] = useState({ completion: 0, engagement: 0, opening: 0, rating: 0, learners: 0 });
  const [summaryText, setSummaryText] = useState('');
  const [confusionParameters, setConfusionParameters] = useState([{ label: '', percent: 0 }]);
  const [perceptionParameters, setPerceptionParameters] = useState([{ label: '', percent: 0 }]);
  const [objectionParameters, setObjectionParameters] = useState([{ label: '', percent: 0 }]);
  
  const [newModuleType, setNewModuleType] = useState('');
  const [newModuleDescription, setNewModuleDescription] = useState('');
  const [tweakTopics, setTweakTopics] = useState([{ topic: '', description: '' }]);
  const [adaptiveModules, setAdaptiveModules] = useState([
    { id: 1, type: 'Custom Training Modules', description: 'Personalized learning paths based on user needs', added: false },
    { id: 2, type: 'Interactive Simulations', description: 'Hands-on practice scenarios for skill development', added: false },
    { id: 3, type: 'Assessment Tools', description: 'Comprehensive evaluation and progress tracking', added: false }
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
    }
  };

  const handleAudioOverviewChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, audioOverview: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || (!formData.youtubeUrl && !formData.file)) {
      toast({
        title: "Error",
        description: "Please provide a YouTube URL or upload a file",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let publicUrl = '';
      let fileType = 'video';

      if (formData.youtubeUrl) {
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

      // Upload audio overview if provided
      let audioOverviewUrl = null;
      if (formData.audioOverview) {
        const audioExt = formData.audioOverview.name.split('.').pop();
        const audioFileName = `audio_overview_${Date.now()}.${audioExt}`;
        
        const { error: audioUploadError } = await supabase.storage
          .from('modules')
          .upload(audioFileName, formData.audioOverview);

        if (audioUploadError) throw audioUploadError;

        const { data: { publicUrl: audioPublicUrl } } = supabase.storage
          .from('modules')
          .getPublicUrl(audioFileName);
        
        audioOverviewUrl = audioPublicUrl;
      }


      // Insert module first
      const { data: moduleData, error: dbError } = await supabase
        .from('modules')
        .insert({
          title: formData.title,
          description: formData.description,
          file_url: publicUrl,
          english_audio_url: audioOverviewUrl,
          file_type: fileType,
          category: formData.category,
          module_link: formData.moduleLink || null,
          
          adaptive_modules: adaptiveModules.filter(m => m.added),
          kpis: kpis,
          
          confusion_data: confusionParameters,
          perception: perceptionParameters,
          objections: objectionParameters,
          summary_text: summaryText || null,
        })
        .select('id')
        .single();

      if (dbError) throw dbError;

      // Create tweakable questions if any
      if (tweakTopics.length > 0 && tweakTopics[0].topic.trim()) {
        const questionsToInsert = tweakTopics
          .filter(topic => topic.topic.trim())
          .map(topic => ({
            module_id: moduleData.id,
            title: topic.topic.trim(),
            description: topic.description?.trim() || null,
            is_active: true
          }));

        if (questionsToInsert.length > 0) {
          const { error: questionsError } = await supabase
            .from('tweakable_questions')
            .insert(questionsToInsert);

          if (questionsError) {
            console.error('Error creating tweakable questions:', questionsError);
          }
        }
      }

      toast({
        title: "Success",
        description: "Lynq uploaded successfully"
      });

      navigate('/admin-dashboard');
    } catch (error) {
      console.error('Upload error:', error);
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
                <Label htmlFor="youtubeUrl">YouTube URL (optional)</Label>
                <Input
                  id="youtubeUrl"
                  type="url"
                  value={formData.youtubeUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>

              <div>
                <Label htmlFor="file">File (optional)</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  accept="video/*,image/*,.pdf,.doc,.docx"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Provide either a YouTube URL or upload a file
                </p>
              </div>

              <div>
                <Label htmlFor="audioOverview">Audio Overview</Label>
                <Input
                  id="audioOverview"
                  type="file"
                  onChange={handleAudioOverviewChange}
                  accept=".mp3,.wav,.m4a,.ogg"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload MP3 audio file that connects to summary in client dashboard
                </p>
              </div>

              <div>
                <Label htmlFor="moduleLink">Module Link</Label>
                <Input
                  id="moduleLink"
                  type="url"
                  value={formData.moduleLink}
                  onChange={(e) => setFormData(prev => ({ ...prev, moduleLink: e.target.value }))}
                  placeholder="https://courses.skillopp.com/example"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Direct link to the module content for users to access
                </p>
              </div>

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


              <div>
                <div className="flex items-center justify-between">
                  <Label>Topics for Tweaking Previous Lynqs</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setTweakTopics([...tweakTopics, { topic: '', description: '' }])}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Topic
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Add multiple topics that can be tweaked or customized in previous lynqs</p>
                {tweakTopics.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                    <div className="col-span-4">
                      <Input
                        placeholder="Title"
                        value={item.topic}
                        onChange={(e) => {
                          const newTopics = [...tweakTopics];
                          newTopics[index].topic = e.target.value;
                          setTweakTopics(newTopics);
                        }}
                      />
                    </div>
                    <div className="col-span-6">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => {
                          const newTopics = [...tweakTopics];
                          newTopics[index].description = e.target.value;
                          setTweakTopics(newTopics);
                        }}
                      />
                    </div>
                    <div className="col-span-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (tweakTopics.length > 1) {
                            setTweakTopics(tweakTopics.filter((_, i) => i !== index));
                          }
                        }}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Analytics inputs for dashboard linkage */}
              <div className="grid gap-4">
                <div>
                  <Label>Summary Text</Label>
                  <Textarea value={summaryText} onChange={(e)=>setSummaryText(e.target.value)} placeholder="Short summary shown to users" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Completion %</Label><Input type="number" value={kpis.completion} onChange={(e)=>setKpis(s=>({...s, completion: +e.target.value||0}))} /></div>
                  <div><Label>Engagement %</Label><Input type="number" value={kpis.engagement} onChange={(e)=>setKpis(s=>({...s, engagement: +e.target.value||0}))} /></div>
                  <div><Label>Opening %</Label><Input type="number" value={kpis.opening} onChange={(e)=>setKpis(s=>({...s, opening: +e.target.value||0}))} /></div>
                  <div><Label>Average Rating</Label><Input type="number" step="0.1" value={kpis.rating} onChange={(e)=>setKpis(s=>({...s, rating: +e.target.value||0}))} /></div>
                  <div className="col-span-2"><Label>Learners Completed</Label><Input type="number" value={kpis.learners} onChange={(e)=>setKpis(s=>({...s, learners: +e.target.value||0}))} /></div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label>Confusion Parameters</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setConfusionParameters([...confusionParameters, { label: '', percent: 0 }])}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Row
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">Add items like "Fixed Payout Confusion".</p>
                  {confusionParameters.map((param, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                      <div className="col-span-5">
                        <Input
                          placeholder="Label"
                          value={param.label}
                          onChange={(e) => {
                            const newParams = [...confusionParameters];
                            newParams[index].label = e.target.value;
                            setConfusionParameters(newParams);
                          }}
                        />
                      </div>
                      <div className="col-span-5">
                        <Input
                          type="number"
                          placeholder="0"
                          value={param.percent}
                          onChange={(e) => {
                            const newParams = [...confusionParameters];
                            newParams[index].percent = +e.target.value || 0;
                            setConfusionParameters(newParams);
                          }}
                        />
                      </div>
                      <div className="col-span-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confusionParameters.length > 1) {
                              setConfusionParameters(confusionParameters.filter((_, i) => i !== index));
                            }
                          }}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label>Perception Parameters</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setPerceptionParameters([...perceptionParameters, { label: '', percent: 0 }])}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Row
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">Trust, Value, Ease of Use, Relevance, Credibility.</p>
                  {perceptionParameters.map((param, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                      <div className="col-span-5">
                        <Input
                          placeholder="Label"
                          value={param.label}
                          onChange={(e) => {
                            const newParams = [...perceptionParameters];
                            newParams[index].label = e.target.value;
                            setPerceptionParameters(newParams);
                          }}
                        />
                      </div>
                      <div className="col-span-5">
                        <Input
                          type="number"
                          placeholder="0"
                          value={param.percent}
                          onChange={(e) => {
                            const newParams = [...perceptionParameters];
                            newParams[index].percent = +e.target.value || 0;
                            setPerceptionParameters(newParams);
                          }}
                        />
                      </div>
                      <div className="col-span-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (perceptionParameters.length > 1) {
                              setPerceptionParameters(perceptionParameters.filter((_, i) => i !== index));
                            }
                          }}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label>Top Client Objections</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setObjectionParameters([...objectionParameters, { label: '', percent: 0 }])}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Row
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">High Costs, Complex Process, Trust Issues.</p>
                  {objectionParameters.map((param, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                      <div className="col-span-5">
                        <Input
                          placeholder="Label"
                          value={param.label}
                          onChange={(e) => {
                            const newParams = [...objectionParameters];
                            newParams[index].label = e.target.value;
                            setObjectionParameters(newParams);
                          }}
                        />
                      </div>
                      <div className="col-span-5">
                        <Input
                          type="number"
                          placeholder="0"
                          value={param.percent}
                          onChange={(e) => {
                            const newParams = [...objectionParameters];
                            newParams[index].percent = +e.target.value || 0;
                            setObjectionParameters(newParams);
                          }}
                        />
                      </div>
                      <div className="col-span-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (objectionParameters.length > 1) {
                              setObjectionParameters(objectionParameters.filter((_, i) => i !== index));
                            }
                          }}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>


                <div>
                  <Label className="text-lg font-semibold">Actions & Improvements</Label>
                  <p className="text-sm text-muted-foreground mb-4">Next Adaptive Lynqs</p>
                  
                  <div className="space-y-3">
                    {adaptiveModules.map((module) => (
                      <div key={module.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                            {module.type === 'Interactive Tutorials' && '📚'}
                            {module.type === 'Video Walkthroughs' && '🎥'}
                            {module.type === 'Value Calculators' && '🧮'}
                          </div>
                          <div>
                            <h4 className="font-medium">{module.type}</h4>
                            <p className="text-sm text-muted-foreground">{module.description}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant={module.added ? "default" : "destructive"}
                          size="sm"
                          onClick={() => {
                            setAdaptiveModules(prev => 
                              prev.map(m => 
                                m.id === module.id ? { ...m, added: !m.added } : m
                              )
                            );
                          }}
                        >
                          {module.added ? 'Added' : 'Add Now'}
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="newModuleType">Module Type</Label>
                        <Input
                          id="newModuleType"
                          value={newModuleType}
                          onChange={(e) => setNewModuleType(e.target.value)}
                          placeholder="e.g., Pro-fit claims"
                        />
                      </div>
                      <div>
                        <Label htmlFor="newModuleDescription">Description</Label>
                        <Input
                          id="newModuleDescription"
                          value={newModuleDescription}
                          onChange={(e) => setNewModuleDescription(e.target.value)}
                          placeholder="Module description"
                        />
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <Button
                        type="button"
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          if (newModuleType.trim()) {
                            const newModule = {
                              id: adaptiveModules.length + 1,
                              type: newModuleType.trim(),
                              description: newModuleDescription.trim() || 'Custom adaptive module',
                              added: false
                            };
                            setAdaptiveModules(prev => [...prev, newModule]);
                            setNewModuleType('');
                            setNewModuleDescription('');
                          }
                        }}
                        disabled={!newModuleType.trim()}
                      >
                        + Add Different Module
                      </Button>
                    </div>
                  </div>
                </div>

              <div className="pt-2">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => navigate('/view-modules')}
                  className="w-full mb-2"
                >
                  View All Modules
                </Button>
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