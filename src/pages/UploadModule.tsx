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
    contentType: 'youtube' as 'youtube' | 'file',
    youtubeUrl: '',
    moduleLink: '',
    file: null as File | null,
    audioOverview: null as File | null,
    category: 'Product',
    adaptedModuleName: '',
    tweakingTopics: ''
  });

  // Analytics fields for client dashboard linkage
  const [kpis, setKpis] = useState({ completion: 0, engagement: 0, opening: 0, rating: 0, learners: 0 });
  const [summaryText, setSummaryText] = useState('');
  const [confusionParameters, setConfusionParameters] = useState([{ label: '', percent: 0 }]);
  const [perceptionParameters, setPerceptionParameters] = useState([{ label: '', percent: 0 }]);
  const [objectionParameters, setObjectionParameters] = useState([{ label: '', percent: 0 }]);
  const [trendData, setTrendData] = useState({ completion: 0, engagement: 0, opening: 0, rating: 0 });
  const [trendCsv, setTrendCsv] = useState('');
  const [tweakContentRequest, setTweakContentRequest] = useState('');
  const [adaptiveModules, setAdaptiveModules] = useState([
    { id: 1, type: 'Interactive Tutorials', description: 'Step-by-step visual guides for fixed payout concepts', added: false },
    { id: 2, type: 'Video Walkthroughs', description: 'Firebase setup + troubleshooting guides', added: false },
    { id: 3, type: 'Value Calculators', description: 'ROI calculators to show clear value', added: false }
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

      // Create module record
      const parseTrend = (csv: string) => csv.split(/\r?\n/).map(l=>l.trim()).filter(Boolean).map(line=>{ const [day, c, e] = line.split(',').map(s=>s.trim()); const completion = Math.max(0, Math.min(100, Number(c)||0)); const engagement = Math.max(0, Math.min(100, Number(e ?? c)||0)); return { day, completion, engagement }; });

      const { error: dbError } = await supabase
        .from('modules')
        .insert({
          title: formData.title,
          description: formData.description,
          file_url: publicUrl,
          english_audio_url: audioOverviewUrl,
          file_type: fileType,
          category: formData.category,
          module_link: formData.moduleLink || null,
          adapted_module_name: formData.adaptedModuleName || null,
          tweaking_topics: formData.tweakingTopics || null,
          tweak_content_request: tweakContentRequest || null,
          adaptive_modules: adaptiveModules.filter(m => m.added),
          kpis: kpis,
          trend: trendCsv ? parseTrend(trendCsv) : trendData,
          confusion_data: confusionParameters,
          perception: perceptionParameters,
          objections: objectionParameters,
          summary_text: summaryText || null,
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
                <Label htmlFor="adaptedModuleName">Adapted Module Name</Label>
                <Input
                  id="adaptedModuleName"
                  value={formData.adaptedModuleName}
                  onChange={(e) => setFormData(prev => ({ ...prev, adaptedModuleName: e.target.value }))}
                  placeholder="Name for adapted version of this module"
                />
              </div>

              <div>
                <Label htmlFor="tweakingTopics">Topics for Tweaking Previous Lynqs</Label>
                <Textarea
                  id="tweakingTopics"
                  value={formData.tweakingTopics}
                  onChange={(e) => setFormData(prev => ({ ...prev, tweakingTopics: e.target.value }))}
                  placeholder="List topics that can be tweaked or customized in previous lynqs"
                />
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
                  <Label>Trend Parameters</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Completion %</Label><Input type="number" value={trendData.completion} onChange={(e)=>setTrendData(s=>({...s, completion: +e.target.value||0}))} /></div>
                    <div><Label>Engagement %</Label><Input type="number" value={trendData.engagement} onChange={(e)=>setTrendData(s=>({...s, engagement: +e.target.value||0}))} /></div>
                    <div><Label>Opening %</Label><Input type="number" value={trendData.opening} onChange={(e)=>setTrendData(s=>({...s, opening: +e.target.value||0}))} /></div>
                    <div><Label>Rating</Label><Input type="number" step="0.1" value={trendData.rating} onChange={(e)=>setTrendData(s=>({...s, rating: +e.target.value||0}))} /></div>
                  </div>
                  <Label className="mt-2">Or Trend CSV (day,completion,engagement)</Label>
                  <Textarea value={trendCsv} onChange={(e)=>setTrendCsv(e.target.value)} placeholder={'Mon,82,90\nTue,88,92'} />
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

              {/* Tweak Content Request Section */}
              <div className="grid gap-4">
                <div>
                  <Label className="text-lg font-semibold">Tweak Content Request</Label>
                  <div className="mt-2">
                    <Label htmlFor="tweakContentRequest">Topic / Area to Tweak</Label>
                    <Textarea
                      id="tweakContentRequest"
                      value={tweakContentRequest}
                      onChange={(e) => setTweakContentRequest(e.target.value)}
                      placeholder="Enter the topic or area that needs tweaking..."
                      className="mt-1"
                    />
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

                  <div className="mt-4 text-center">
                    <Button
                      type="button"
                      variant="default"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        const newModule = {
                          id: adaptiveModules.length + 1,
                          type: 'Custom Module',
                          description: 'Custom adaptive module',
                          added: false
                        };
                        setAdaptiveModules(prev => [...prev, newModule]);
                      }}
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