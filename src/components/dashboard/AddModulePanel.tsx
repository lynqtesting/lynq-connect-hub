import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileJson, FileSpreadsheet, Loader2 } from 'lucide-react';
import { SidePanel } from './SidePanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUploadZone } from './FileUploadZone';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AddModulePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddModulePanel({ isOpen, onClose, onSuccess }: AddModulePanelProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Active');
  const [author, setAuthor] = useState('Admin');
  const [category, setCategory] = useState('');
  const [moduleFile, setModuleFile] = useState<File | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStatus('Active');
    setAuthor('Admin');
    setCategory('');
    setModuleFile(null);
    setScreenshotFile(null);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Module title is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      let fileUrl = null;
      let screenshotUrl = null;

      // Upload module file if selected
      if (moduleFile) {
        const fileExt = moduleFile.name.split('.').pop();
        const fileName = `module_${Date.now()}.${fileExt}`;
        const filePath = `modules/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('modules')
          .upload(filePath, moduleFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('modules')
          .getPublicUrl(filePath);

        fileUrl = publicUrl;
      }

      // Upload screenshot if selected
      if (screenshotFile) {
        const fileExt = screenshotFile.name.split('.').pop();
        const fileName = `screenshot_${Date.now()}.${fileExt}`;
        const filePath = `screenshots/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('screenshots')
          .upload(filePath, screenshotFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('screenshots')
          .getPublicUrl(filePath);

        screenshotUrl = publicUrl;
      }

      // Insert module into database
      const { error: dbError } = await supabase
        .from('modules')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          category: category || null,
          file_url: fileUrl,
          screenshot_url: screenshotUrl,
        });

      if (dbError) throw dbError;

      toast({
        title: 'Module Created',
        description: 'New module has been added successfully',
      });

      resetForm();
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error Creating Module',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SidePanel isOpen={isOpen} onClose={onClose} title="Add New Module">
      <div className="space-y-6">
        {/* Module Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium text-text-primary">
            Module Title <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter module title"
            className="bg-bg-canvas border-border-default"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium text-text-primary">
            Description
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter module description"
            rows={4}
            className="bg-bg-canvas border-border-default resize-none"
          />
        </div>

        {/* Status and Author Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-text-primary">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="bg-bg-canvas border-border-default">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="author" className="text-sm font-medium text-text-primary">
              Author
            </Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author name"
              className="bg-bg-canvas border-border-default"
            />
          </div>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-text-primary">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="bg-bg-canvas border-border-default">
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

        {/* Screenshot Upload */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-text-primary">Module Thumbnail</Label>
          <FileUploadZone
            onFileSelect={(file) => setScreenshotFile(file)}
            acceptedFileTypes={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
            maxSize={5 * 1024 * 1024}
            label="Upload Thumbnail"
            description="PNG, JPG up to 5MB"
            icon={<Upload className="h-6 w-6" />}
          />
        </div>

        {/* Module File Upload */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-text-primary">Module Content (SCORM/Video)</Label>
          <FileUploadZone
            onFileSelect={(file) => setModuleFile(file)}
            acceptedFileTypes={{ 
              'application/zip': ['.zip'],
              'video/*': ['.mp4', '.webm', '.mov'],
            }}
            maxSize={500 * 1024 * 1024}
            label="Upload Module File"
            description="SCORM package (.zip) or Video (.mp4, .webm)"
            icon={<Upload className="h-6 w-6" />}
          />
        </div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="pt-4"
        >
          <Button
            onClick={handleSubmit}
            disabled={saving || !title.trim()}
            className="w-full gap-2 bg-brand hover:bg-brand-hover"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Module...
              </>
            ) : (
              'Create Module'
            )}
          </Button>
        </motion.div>
      </div>
    </SidePanel>
  );
}
