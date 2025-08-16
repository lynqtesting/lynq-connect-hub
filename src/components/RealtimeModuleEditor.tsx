import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Wifi } from 'lucide-react';
import { useRealtimeModule } from '@/hooks/useRealtimeModule';

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
  items: Array<{ name: string; value: number }>;
  onChange: (items: Array<{ name: string; value: number }>) => void;
}

function ArrayField({ label, items, onChange }: ArrayFieldProps) {
  const updateItem = (index: number, field: 'name' | 'value', newValue: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: newValue };
    onChange(newItems);
  };

  const addItem = () => {
    onChange([...items, { name: '', value: 0 }]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder="Parameter name"
              value={item.name}
              onChange={(e) => updateItem(index, 'name', e.target.value)}
              className="flex-1"
            />
            <Input
              type="number"
              placeholder="Value"
              value={item.value}
              onChange={(e) => updateItem(index, 'value', Number(e.target.value) || 0)}
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
          <div>
            <Label htmlFor="title">Module Title</Label>
            <Input
              id="title"
              value={moduleData.title || ''}
              onChange={(e) => sendPatch({ title: e.target.value })}
              placeholder="Enter module title"
            />
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
        </CardContent>
      </Card>

      {/* KPIs & Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricField
              label="Completion Rate"
              value={kpis.completion || 0}
              onChange={(value) => sendPatch({ kpis: { ...kpis, completion: value } })}
            />
            <MetricField
              label="Engagement Rate"
              value={kpis.engagement || 0}
              onChange={(value) => sendPatch({ kpis: { ...kpis, engagement: value } })}
            />
            <MetricField
              label="Opening Rate"
              value={kpis.opening || 0}
              onChange={(value) => sendPatch({ kpis: { ...kpis, opening: value } })}
            />
            <MetricField
              label="Average Rating"
              value={kpis.avgRating || 0}
              onChange={(value) => sendPatch({ kpis: { ...kpis, avgRating: value } })}
              suffix="/5"
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

      {/* Content & Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Content Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div>
            <Label htmlFor="tweak_content_request">Tweak Content Request</Label>
            <Textarea
              id="tweak_content_request"
              value={moduleData.tweak_content_request || ''}
              onChange={(e) => sendPatch({ tweak_content_request: e.target.value })}
              placeholder="Enter tweak request content"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Adaptive Modules */}
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
  );
}