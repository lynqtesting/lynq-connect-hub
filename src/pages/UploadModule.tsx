import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Plus, Minus, FileJson, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { z } from 'zod';
import { parseXAPIFile, convertXAPIToRiskIntelligence, RiskIntelligenceJSON } from '@/lib/xapiParser';

// Validation schema
const uploadModuleSchema = z.object({
  title: z.string().trim()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be less than 200 characters"),
  description: z.string().trim().max(2000, "Description must be less than 2000 characters").optional(),
  youtubeUrl: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
  moduleLink: z.string().url("Please enter a valid URL").optional().or(z.literal(''))
});

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
  const [errors, setErrors] = useState<{ title?: string; description?: string; youtubeUrl?: string; moduleLink?: string }>({});

  // Separate state for file inputs to prevent refresh issues
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);

  // Analytics fields for client dashboard linkage
  const [kpis, setKpis] = useState({ completion: 0, engagement: 0, opening: 0, rating: 0, learners: 0 });
  const [summaryText, setSummaryText] = useState('');
  const [confusionParameters, setConfusionParameters] = useState([{ label: '', percent: 0 }]);
  const [perceptionParameters, setPerceptionParameters] = useState([{ label: '', percent: 0 }]);
  const [objectionParameters, setObjectionParameters] = useState([{ label: '', percent: 0 }]);
  
  // xAPI upload state
  const [xapiFile, setXapiFile] = useState<File | null>(null);
  const [xapiDragOver, setXapiDragOver] = useState(false);
  const [xapiParsing, setXapiParsing] = useState(false);
  const [xapiError, setXapiError] = useState<string | null>(null);
  const [xapiRiskData, setXapiRiskData] = useState<RiskIntelligenceJSON | null>(null);

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
      setSelectedFile(file);
      setFormData(prev => ({ ...prev, file }));
    }
  };

  const handleAudioOverviewChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedAudioFile(file);
      setFormData(prev => ({ ...prev, audioOverview: file }));
    }
  };

  const processXAPIFile = useCallback(async (file: File) => {
    setXapiFile(file);
    setXapiError(null);
    setXapiRiskData(null);
    setXapiParsing(true);
    try {
      const text = await file.text();
      const statements = parseXAPIFile(text);
      const riskData = convertXAPIToRiskIntelligence(statements);
      setXapiRiskData(riskData);

      // Auto-populate manual KPI fields from parsed xAPI data
      const completionPct = Math.round(riskData.STR_overall * 100);
      const engagementPct = Math.round(riskData.engagement_rate_overall * 100);
      setKpis(prev => ({
        ...prev,
        completion: completionPct,
        engagement: engagementPct,
        learners: riskData._meta?.uniqueLearners ?? prev.learners,
      }));

      // Auto-populate confusion parameters
      if (riskData.confusion_areas.length > 0) {
        setConfusionParameters(
          riskData.confusion_areas.map(a => ({ label: a.label, percent: a.percentage }))
        );
      }

      toast({
        title: "xAPI File Parsed",
        description: `${statements.length} statement(s) converted to Risk Intelligence data.`,
      });
    } catch (err) {
      setXapiError(err instanceof Error ? err.message : 'Failed to parse xAPI file');
    } finally {
      setXapiParsing(false);
    }
  }, [toast]);

  const handleXAPIFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processXAPIFile(file);
  };

  const handleXAPIDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setXapiDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processXAPIFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate input
    const result = uploadModuleSchema.safeParse({
      title: formData.title,
      description: formData.description || undefined,
      youtubeUrl: formData.youtubeUrl || undefined,
      moduleLink: formData.moduleLink || undefined
    });

    if (!result.success) {
      const fieldErrors: { title?: string; description?: string; youtubeUrl?: string; moduleLink?: string } = {};
      result.error.errors.forEach(err => {
        if (err.path[0] === 'title') fieldErrors.title = err.message;
        if (err.path[0] === 'description') fieldErrors.description = err.message;
        if (err.path[0] === 'youtubeUrl') fieldErrors.youtubeUrl = err.message;
        if (err.path[0] === 'moduleLink') fieldErrors.moduleLink = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!result.data.title || (!formData.youtubeUrl && !formData.file)) {
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
      } else if (selectedFile) {
        // Upload file to storage
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('modules')
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl: filePublicUrl } } = supabase.storage
          .from('modules')
          .getPublicUrl(fileName);
        
        publicUrl = filePublicUrl;
        fileType = selectedFile.type.includes('video') ? 'video' : 
                  selectedFile.type.includes('image') ? 'image' : 'document';
      }

      // Upload audio overview if provided
      let audioOverviewUrl = null;
      if (selectedAudioFile) {
        const audioExt = selectedAudioFile.name.split('.').pop();
        const audioFileName = `audio_overview_${Date.now()}.${audioExt}`;
        
        const { error: audioUploadError } = await supabase.storage
          .from('modules')
          .upload(audioFileName, selectedAudioFile);

        if (audioUploadError) {
          console.error('Audio upload error:', audioUploadError);
          throw new Error(`Audio upload failed: ${audioUploadError.message}`);
        }

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
          
          // Store legacy format for compatibility but use dedicated tables as primary
          adaptive_modules: adaptiveModules.filter(m => m.added),
          kpis: xapiRiskData
            ? { ...kpis, risk_intelligence: xapiRiskData }
            : kpis,
          
          confusion_data: confusionParameters,
          perception: perceptionParameters,
          objections: objectionParameters,
          summary_text: summaryText || null,
        })
        .select('id')
        .single();

      if (dbError) throw dbError;

      // Create tweakable questions in dedicated table
      if (tweakTopics.length > 0 && tweakTopics[0].topic.trim()) {
        const questionsToInsert = tweakTopics
          .filter(topic => topic.topic.trim())
          .map(topic => ({
            module_id: moduleData.id,
            title: topic.topic.trim(),
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

      // Create adaptive ideas in dedicated table
      const adaptiveIdeasToInsert = adaptiveModules
        .filter(module => module.added && module.type?.trim())
        .map(module => ({
          module_id: moduleData.id,
          title: module.type.trim(),
          description: module.description || null
        }));

      if (adaptiveIdeasToInsert.length > 0) {
        const { error: ideasError } = await supabase
          .from('adaptive_ideas')
          .insert(adaptiveIdeasToInsert);

        if (ideasError) {
          console.error('Error creating adaptive ideas:', ideasError);
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
                  className={errors.title ? 'border-destructive' : ''}
                />
                {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Lynq description"
                  className={errors.description ? 'border-destructive' : ''}
                />
                {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
              </div>

              <div>
                <Label htmlFor="youtubeUrl">YouTube URL (optional)</Label>
                <Input
                  id="youtubeUrl"
                  type="url"
                  value={formData.youtubeUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={errors.youtubeUrl ? 'border-destructive' : ''}
                />
                {errors.youtubeUrl && <p className="text-xs text-destructive mt-1">{errors.youtubeUrl}</p>}
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

              {/* ── xAPI / Risk Intelligence Upload ── */}
              <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
                <div className="flex items-center gap-2">
                  <FileJson className="h-5 w-5 text-primary" />
                  <Label className="text-base font-semibold">xAPI Learning Data Upload</Label>
                  <Badge variant="secondary" className="text-xs">Optional</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload an xAPI JSON file from 7taps or any LRS. The system will automatically convert learning
                  statements into the Risk Intelligence dashboard format.
                </p>

                {/* Drag-drop zone */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                    xapiDragOver
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/30 hover:border-primary/50'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setXapiDragOver(true); }}
                  onDragLeave={() => setXapiDragOver(false)}
                  onDrop={handleXAPIDrop}
                  onClick={() => document.getElementById('xapi-file-input')?.click()}
                >
                  <input
                    id="xapi-file-input"
                    type="file"
                    accept=".json,.zip,.xml"
                    className="hidden"
                    onChange={handleXAPIFileInput}
                  />
                  {xapiParsing ? (
                    <p className="text-sm text-muted-foreground animate-pulse">Parsing xAPI data...</p>
                  ) : xapiFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileJson className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{xapiFile.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setXapiFile(null);
                          setXapiRiskData(null);
                          setXapiError(null);
                        }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        Drag &amp; drop an xAPI JSON file here, or click to browse
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Accepts .json files</p>
                    </>
                  )}
                </div>

                {/* Error */}
                {xapiError && (
                  <div className="flex items-start gap-2 text-destructive text-sm bg-destructive/10 rounded p-3">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{xapiError}</span>
                  </div>
                )}

                {/* Parsed preview */}
                {xapiRiskData && (
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium text-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      Risk Intelligence data converted successfully
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Module: <strong className="text-foreground">{xapiRiskData._meta?.moduleTitle}</strong></span>
                      <span>Statements: <strong className="text-foreground">{xapiRiskData._meta?.totalStatements}</strong></span>
                      <span>Unique Learners: <strong className="text-foreground">{xapiRiskData._meta?.uniqueLearners}</strong></span>
                      <span>STR Overall: <strong className="text-foreground">{(xapiRiskData.STR_overall * 100).toFixed(0)}%</strong></span>
                      <span>Engagement: <strong className="text-foreground">{(xapiRiskData.engagement_rate_overall * 100).toFixed(0)}%</strong></span>
                      <span>Dropoff Rate: <strong className="text-foreground">{xapiRiskData['dropoff_rate_%']}%</strong></span>
                      <span>Completed: <strong className="text-foreground">{xapiRiskData.learning_progress_status.Completed}</strong></span>
                      <span>In Progress: <strong className="text-foreground">{xapiRiskData.learning_progress_status['In Progress']}</strong></span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      KPI fields below have been auto-filled. You can still adjust them before saving.
                    </p>
                  </div>
                )}
              </div>

              {/* Analytics inputs for dashboard linkage */}
              <div className="grid gap-4">
                <div>
                  <Label>Summary Text</Label>
                  <Textarea value={summaryText} onChange={(e)=>setSummaryText(e.target.value)} placeholder="Short summary shown to users" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Completion %</Label>
                    <Input type="number" min={0} max={100} value={kpis.completion} onChange={(e)=>setKpis(s=>({...s, completion: Math.min(100, Math.max(0, +e.target.value||0))}))} />
                  </div>
                  <div>
                    <Label>Engagement %</Label>
                    <Input type="number" min={0} max={100} value={kpis.engagement} onChange={(e)=>setKpis(s=>({...s, engagement: Math.min(100, Math.max(0, +e.target.value||0))}))} />
                  </div>
                  <div>
                    <Label>Opening %</Label>
                    <Input type="number" min={0} max={100} value={kpis.opening} onChange={(e)=>setKpis(s=>({...s, opening: Math.min(100, Math.max(0, +e.target.value||0))}))} />
                  </div>
                  <div>
                    <Label>Average Rating</Label>
                    <Input type="number" min={0} max={5} step="0.1" value={kpis.rating} onChange={(e)=>setKpis(s=>({...s, rating: Math.min(5, Math.max(0, +e.target.value||0))}))} />
                  </div>
                  <div className="col-span-2">
                    <Label>Employees Engaged</Label>
                    <Input type="number" min={0} value={kpis.learners} onChange={(e)=>setKpis(s=>({...s, learners: Math.max(0, +e.target.value||0)}))} />
                  </div>
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