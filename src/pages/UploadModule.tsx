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
  const [confusionData, setConfusionData] = useState({ completion: 0, engagement: 0, opening: 0, rating: 0 });
  const [perceptionData, setPerceptionData] = useState({ completion: 0, engagement: 0, opening: 0, rating: 0 });
  const [trendData, setTrendData] = useState({ completion: 0, engagement: 0, opening: 0, rating: 0 });
  const [confusionCsv, setConfusionCsv] = useState('');
  const [perceptionCsv, setPerceptionCsv] = useState('');
  const [objectionsCsv, setObjectionsCsv] = useState('');
  const [trendCsv, setTrendCsv] = useState('');

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
      const parsePairs = (csv: string) => csv.split(/\r?\n/).map(l=>l.trim()).filter(Boolean).map(line=>{ const [label, val] = line.split(',').map(s=>s.trim()); const percent = Math.max(0, Math.min(100, Number(val)||0)); return { label, percent }; });
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
          kpis: kpis,
          trend: trendCsv ? parseTrend(trendCsv) : trendData,
          confusion_data: confusionCsv ? parsePairs(confusionCsv) : confusionData,
          perception: perceptionCsv ? parsePairs(perceptionCsv) : perceptionData,
          objections: parsePairs(objectionsCsv),
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
                  <Label>Confusion Parameters</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Completion %</Label><Input type="number" value={confusionData.completion} onChange={(e)=>setConfusionData(s=>({...s, completion: +e.target.value||0}))} /></div>
                    <div><Label>Engagement %</Label><Input type="number" value={confusionData.engagement} onChange={(e)=>setConfusionData(s=>({...s, engagement: +e.target.value||0}))} /></div>
                    <div><Label>Opening %</Label><Input type="number" value={confusionData.opening} onChange={(e)=>setConfusionData(s=>({...s, opening: +e.target.value||0}))} /></div>
                    <div><Label>Rating</Label><Input type="number" step="0.1" value={confusionData.rating} onChange={(e)=>setConfusionData(s=>({...s, rating: +e.target.value||0}))} /></div>
                  </div>
                  <Label className="mt-2">Or Confusion CSV (label,percent)</Label>
                  <Textarea value={confusionCsv} onChange={(e)=>setConfusionCsv(e.target.value)} placeholder={'Fixed Payout Confusion,65'} />
                </div>
                <div>
                  <Label>Perception Parameters</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Completion %</Label><Input type="number" value={perceptionData.completion} onChange={(e)=>setPerceptionData(s=>({...s, completion: +e.target.value||0}))} /></div>
                    <div><Label>Engagement %</Label><Input type="number" value={perceptionData.engagement} onChange={(e)=>setPerceptionData(s=>({...s, engagement: +e.target.value||0}))} /></div>
                    <div><Label>Opening %</Label><Input type="number" value={perceptionData.opening} onChange={(e)=>setPerceptionData(s=>({...s, opening: +e.target.value||0}))} /></div>
                    <div><Label>Rating</Label><Input type="number" step="0.1" value={perceptionData.rating} onChange={(e)=>setPerceptionData(s=>({...s, rating: +e.target.value||0}))} /></div>
                  </div>
                  <Label className="mt-2">Or Perception CSV (label,percent)</Label>
                  <Textarea value={perceptionCsv} onChange={(e)=>setPerceptionCsv(e.target.value)} placeholder={'Trust,72'} />
                </div>
                <div>
                  <Label>Top Client Objections CSV (label,percent)</Label>
                  <Textarea value={objectionsCsv} onChange={(e)=>setObjectionsCsv(e.target.value)} placeholder={'High Costs,65'} />
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