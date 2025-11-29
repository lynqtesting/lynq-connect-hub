import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileSpreadsheet, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileUploadZone } from './FileUploadZone';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Papa from 'papaparse';

interface ResponseDataUploadProps {
  moduleId: string;
  onUploadComplete?: () => void;
}

export function ResponseDataUpload({ moduleId, onUploadComplete }: ResponseDataUploadProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    
    // Parse CSV for preview
    Papa.parse(file, {
      header: true,
      preview: 5,
      complete: (results) => {
        setPreviewData(results.data);
      },
      error: (error) => {
        toast({
          title: 'Parse Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);

      // Upload to Supabase storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `response_${Date.now()}.${fileExt}`;
      const filePath = `response-data/${fileName}`;

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
          file_type: 'response_csv',
          file_name: selectedFile.name,
          file_url: publicUrl,
          file_size: selectedFile.size,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id,
          module_id: moduleId,
        });

      if (dbError) throw dbError;

      toast({
        title: 'Success!',
        description: 'Response data uploaded successfully',
      });

      setSelectedFile(null);
      setPreviewData([]);
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
      className="bg-bg-surface border border-border-default rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
          <FileSpreadsheet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Module Response Data</h3>
          <p className="text-sm text-text-muted">Upload CSV files with response data for this module</p>
        </div>
      </div>

      <FileUploadZone
        onFileSelect={handleFileSelect}
        acceptedFileTypes={{ 'text/csv': ['.csv'] }}
        maxSize={50 * 1024 * 1024} // 50MB
        label="Upload Response CSV"
        description="CSV format with response metrics and user data"
        icon={<FileSpreadsheet className="h-8 w-8" />}
      />

      {previewData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-6 overflow-hidden"
        >
          <h4 className="text-sm font-semibold text-text-primary mb-3">Preview (first 5 rows)</h4>
          <div className="overflow-x-auto rounded-lg border border-border-default">
            <table className="w-full text-sm">
              <thead className="bg-bg-canvas">
                <tr>
                  {Object.keys(previewData[0] || {}).map((header, i) => (
                    <th key={i} className="px-4 py-2 text-left text-xs font-semibold text-text-muted uppercase">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {previewData.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((cell: any, j) => (
                      <td key={j} className="px-4 py-2 text-text-secondary">
                        {String(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
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
