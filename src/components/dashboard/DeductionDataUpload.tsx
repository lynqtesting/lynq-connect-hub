import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileJson, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileUploadZone } from './FileUploadZone';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DeductionDataUploadProps {
  moduleId: string;
  onUploadComplete?: () => void;
}

export function DeductionDataUpload({ moduleId, onUploadComplete }: DeductionDataUploadProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [jsonPreview, setJsonPreview] = useState<any>(null);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    
    // Parse JSON for preview
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      setJsonPreview(json);
    } catch (error: any) {
      toast({
        title: 'Invalid JSON',
        description: 'The file does not contain valid JSON',
        variant: 'destructive',
      });
      setJsonPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);

      // Upload to Supabase storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `deduction_${Date.now()}.${fileExt}`;
      const filePath = `deduction-data/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('modules')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('modules')
        .getPublicUrl(filePath);

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('data_uploads')
        .insert({
          file_type: 'deduction_json',
          file_name: selectedFile.name,
          file_url: publicUrl,
          file_size: selectedFile.size,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id,
          metadata: jsonPreview,
          module_id: moduleId,
        });

      if (dbError) throw dbError;

      toast({
        title: 'Success!',
        description: 'Deduction data uploaded successfully',
      });

      setSelectedFile(null);
      setJsonPreview(null);
      onUploadComplete?.();
    } catch (error: any) {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-bg-surface border border-border-default rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
          <FileJson className="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Module Deduction Data</h3>
          <p className="text-sm text-text-muted">Upload JSON files with deduction logic for this module</p>
        </div>
      </div>

      <FileUploadZone
        onFileSelect={handleFileSelect}
        acceptedFileTypes={{ 'application/json': ['.json'] }}
        maxSize={10 * 1024 * 1024} // 10MB
        label="Upload Deduction JSON"
        description="JSON format with deduction rules and calculations"
        icon={<FileJson className="h-8 w-8" />}
      />

      {jsonPreview && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-6 overflow-hidden"
        >
          <h4 className="text-sm font-semibold text-text-primary mb-3">JSON Structure</h4>
          <div className="bg-bg-canvas rounded-lg p-4 overflow-x-auto">
            <pre className="text-xs text-text-secondary font-mono whitespace-pre-wrap">
              {JSON.stringify(jsonPreview, null, 2)}
            </pre>
          </div>
        </motion.div>
      )}

      {selectedFile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full gap-2"
          >
            {uploading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Upload className="h-4 w-4" />
                </motion.div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload File
              </>
            )}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
