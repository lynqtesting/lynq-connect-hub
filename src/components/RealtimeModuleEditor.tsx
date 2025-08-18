import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Users, Wifi, Upload, Plus, X } from 'lucide-react';
import { useRealtimeModule } from '@/hooks/useRealtimeModule';
import { supabase } from '@/integrations/supabase/client';

interface MetricFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
}

function MetricField({ label, value, onChange, suffix = "%" }: MetricFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          value={value || 0}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          min={0}
          max={suffix === "%" ? 100 : undefined}
          className="pr-8"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

interface ArrayFieldProps {
  label: string;
  items: Array<{ label?: string; name?: string; value?: number; percent?: number }>;
  onChange: (items: Array<{ label?: string; name?: string; value?: number; percent?: number }>) => void;
}

function ArrayField({ label, items, onChange }: ArrayFieldProps) {
  const updateItem = (index: number, field: string, newValue: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: newValue };
    onChange(newItems);
  };

  const addItem = () => {
    onChange([...items, { label: '', percent: 0 }]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  // Determine field names based on data structure
  const nameField = items[0]?.label !== undefined ? 'label' : 'name';
  const valueField = items[0]?.percent !== undefined ? 'percent' : 'value';

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder="Parameter name"
              value={(item as any)[nameField] || ''}
              onChange={(e) => updateItem(index, nameField, e.target.value)}
              className="flex-1"
            />
            <Input
              type="number"
              placeholder="Value"
              value={(item as any)[valueField] || 0}
              onChange={(e) => updateItem(index, valueField, Number(e.target.value) || 0)}
              className="w-24"
            />
            <button
              onClick={() => removeItem(index)}
              className="px-3 py-2 text-sm bg-destructive/10 text-destructive rounded-md hover:bg-destructive/20"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={addItem}
          className="w-full py-2 text-sm border border-dashed border-muted-foreground/50 rounded-md hover:border-muted-foreground"
        >
          + Add {label.split(' ')[0]}
        </button>
      </div>
    </div>
  );
}

interface RealtimeModuleEditorProps {
  moduleId: string;
}

function FileUploadField({ label, currentUrl, onUpload, accept }: {
  label: string;
  currentUrl?: string;
  onUpload: (url: string) => void;
  accept?: string;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `modules/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('modules')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('modules')
        .getPublicUrl(filePath);

      onUpload(data.publicUrl);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          type="file"
          onChange={handleFileUpload}
          accept={accept}
          disabled={uploading}
          className="flex-1"
        />
        {uploading && <Loader2 className="h-4 w-4 animate-spin mt-2" />}
      </div>
      {currentUrl && (
        <div className="text-xs text-muted-foreground">
          Current: {currentUrl.split('/').pop()}
        </div>
      )}
    </div>
  );
}

function TrendDataField({ trend, onChange }: {
  trend: Array<{ date: string; value: number }>;
  onChange: (trend: Array<{ date: string; value: number }>) => void;
}) {
  const addTrendPoint = () => {
    onChange([...trend, { date: new Date().toISOString().slice(0, 10), value: 0 }]);
  };

  const updateTrendPoint = (index: number, field: 'date' | 'value', value: string | number) => {
    const newTrend = [...trend];
    newTrend[index] = { ...newTrend[index], [field]: value };
    onChange(newTrend);
  };

  const removeTrendPoint = (index: number) => {
    onChange(trend.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Trend Data Points</Label>
        <Button onClick={addTrendPoint} size="sm" variant="outline">
          <Plus className="h-3 w-3 mr-1" />
          Add Point
        </Button>
      </div>
      <div className="space-y-2">
        {trend.map((point, index) => (
          <div key={index} className="flex gap-2">
            <Input
              type="date"
              value={point.date}
              onChange={(e) => updateTrendPoint(index, 'date', e.target.value)}
              className="flex-1"
            />
            <Input
              type="number"
              value={point.value}
              onChange={(e) => updateTrendPoint(index, 'value', Number(e.target.value) || 0)}
              placeholder="Value"
              className="w-24"
            />
            <Button
              onClick={() => removeTrendPoint(index)}
              size="sm"
              variant="outline"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RealtimeModuleEditor({ moduleId }: RealtimeModuleEditorProps) {
  const { moduleData, loading, syncing, sendPatch } = useRealtimeModule(moduleId);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading module...</span>
      </div>
    );
  }

  if (!moduleData) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Module not found</p>
      </div>
    );
  }

  const kpis = moduleData.kpis || {};
  const confusionData = moduleData.confusion_data || [];
  const perception = moduleData.perception || [];
  const objections = moduleData.objections || [];
  const adaptiveModules = moduleData.adaptive_modules || [];
  const trend = moduleData.trend || [];
  
  // Ensure proper data structure for KPIs
  const ensureKPIs = {
    completion: kpis.completion || 0,
    engagement: kpis.engagement || 0,
    opening: kpis.opening || 0,
    avgRating: kpis.avgRating || kpis.rating || 0,
    learners: kpis.learners || 0
  };

  return (
    <div className="space-y-6">
      {/* Header with sync status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Real-time Module Editor</h2>
        </div>
        <div className="flex items-center gap-2">
          {syncing ? (
            <Badge variant="secondary" className="gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Syncing...
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <Wifi className="h-3 w-3" />
              Live
            </Badge>
          )}
          <span className="text-sm text-muted-foreground">
            v{moduleData.version}
          </span>
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Module Title *</Label>
              <Input
                id="title"
                value={moduleData.title || ''}
                onChange={(e) => sendPatch({ title: e.target.value })}
                placeholder="Enter module title"
              />
            </div>
            
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={moduleData.category || ''}
                onValueChange={(value) => sendPatch({ category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRODUCT">Product</SelectItem>
                  <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                  <SelectItem value="SOFT_SKILLS">Soft Skills</SelectItem>
                  <SelectItem value="CUSTOMER_AWARENESS">Customer Awareness</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={moduleData.description || ''}
              onChange={(e) => sendPatch({ description: e.target.value })}
              placeholder="Enter module description"
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="file_url">Content URL</Label>
              <Input
                id="file_url"
                value={moduleData.file_url || ''}
                onChange={(e) => sendPatch({ file_url: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>

            <div>
              <Label htmlFor="module_link">Module Link</Label>
              <Input
                id="module_link"
                value={moduleData.module_link || ''}
                onChange={(e) => sendPatch({ module_link: e.target.value })}
                placeholder="https://courses.skillopp.com/example"
              />
            </div>
          </div>

          <FileUploadField
            label="Audio Summary"
            currentUrl={moduleData.english_audio_url || undefined}
            onUpload={(url) => sendPatch({ english_audio_url: url })}
            accept="audio/*"
          />

          <div>
            <Label htmlFor="summary_text">Summary Text</Label>
            <Textarea
              id="summary_text"
              value={moduleData.summary_text || ''}
              onChange={(e) => sendPatch({ summary_text: e.target.value })}
              placeholder="Enter module summary"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics & Learners */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricField
              label="Completion Rate"
              value={ensureKPIs.completion}
              onChange={(value) => sendPatch({ kpis: { ...kpis, completion: value } })}
            />
            <MetricField
              label="Engagement Rate"
              value={ensureKPIs.engagement}
              onChange={(value) => sendPatch({ kpis: { ...kpis, engagement: value } })}
            />
            <MetricField
              label="Opening Rate"
              value={ensureKPIs.opening}
              onChange={(value) => sendPatch({ kpis: { ...kpis, opening: value } })}
            />
            <MetricField
              label="Average Rating"
              value={ensureKPIs.avgRating}
              onChange={(value) => sendPatch({ kpis: { ...kpis, avgRating: value } })}
              suffix="/5"
            />
            <MetricField
              label="Learners Count"
              value={ensureKPIs.learners}
              onChange={(value) => sendPatch({ kpis: { ...kpis, learners: value } })}
              suffix=""
            />
          </div>
        </CardContent>
      </Card>

      {/* Analysis Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Confusion Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <ArrayField
              label="Confusion Areas"
              items={confusionData}
              onChange={(items) => sendPatch({ confusion_data: items })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Perception Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <ArrayField
              label="Perception Metrics"
              items={perception}
              onChange={(items) => sendPatch({ perception: items })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Objection Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <ArrayField
              label="Common Objections"
              items={objections}
              onChange={(items) => sendPatch({ objections: items })}
            />
          </CardContent>
        </Card>
      </div>

      {/* Trend Data */}
      <Card>
        <CardHeader>
          <CardTitle>Trend Data</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendDataField
            trend={trend}
            onChange={(newTrend) => sendPatch({ trend: newTrend })}
          />
        </CardContent>
      </Card>

      {/* Tweak Content & Adaptive Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tweak Content Request</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={moduleData.tweak_content_request || ''}
              onChange={(e) => sendPatch({ tweak_content_request: e.target.value })}
              placeholder="Enter tweak request content"
              rows={8}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Adaptive Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <ArrayField
              label="Adaptive Modules"
              items={adaptiveModules}
              onChange={(items) => sendPatch({ adaptive_modules: items })}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}