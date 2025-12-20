import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileJson, Upload, CheckCircle2, AlertCircle, AlertTriangle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileUploadZone } from './FileUploadZone';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { validateDeductionJson, generateSampleDeductionJson, DeductionValidationResult } from '@/lib/deductionValidation';

interface DeductionDataUploadProps {
  moduleId: string;
  onUploadComplete?: () => void;
}

export function DeductionDataUpload({ moduleId, onUploadComplete }: DeductionDataUploadProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [jsonPreview, setJsonPreview] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<DeductionValidationResult | null>(null);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setValidationResult(null);
    
    // Parse JSON for preview and validation
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      setJsonPreview(json);
      
      // Run validation
      const result = validateDeductionJson(json);
      setValidationResult(result);
      
      if (!result.isValid) {
        toast({
          title: 'Validation Errors Found',
          description: `${result.errors.length} error(s) need to be fixed before uploading`,
          variant: 'destructive',
        });
      } else if (result.warnings.length > 0) {
        toast({
          title: 'Validation Passed with Warnings',
          description: `${result.warnings.length} optional field(s) are missing`,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Invalid JSON',
        description: 'The file does not contain valid JSON',
        variant: 'destructive',
      });
      setJsonPreview(null);
      setValidationResult({
        isValid: false,
        errors: [{ field: 'root', message: 'Invalid JSON format', suggestion: 'Check for syntax errors like missing commas or brackets' }],
        warnings: [],
        validFields: [],
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !validationResult?.isValid) return;

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
      setValidationResult(null);
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

  const handleDownloadTemplate = () => {
    const template = generateSampleDeductionJson();
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deduction_template.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-bg-surface border border-border-default rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
            <FileJson className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Module Deduction Data</h3>
            <p className="text-sm text-text-muted">Upload JSON files with deduction logic for this module</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="gap-2">
          <Download className="h-4 w-4" />
          Template
        </Button>
      </div>

      <FileUploadZone
        onFileSelect={handleFileSelect}
        acceptedFileTypes={{ 'application/json': ['.json'] }}
        maxSize={10 * 1024 * 1024} // 10MB
        label="Upload Deduction JSON"
        description="JSON format with deduction rules and calculations"
        icon={<FileJson className="h-8 w-8" />}
      />

      {/* Validation Results */}
      {validationResult && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-6 space-y-4"
        >
          {/* Summary */}
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            validationResult.isValid 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
          }`}>
            {validationResult.isValid ? (
              <>
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Validation passed</span>
                {validationResult.warnings.length > 0 && (
                  <span className="text-sm opacity-80">({validationResult.warnings.length} warning{validationResult.warnings.length > 1 ? 's' : ''})</span>
                )}
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">{validationResult.errors.length} error{validationResult.errors.length > 1 ? 's' : ''} found</span>
              </>
            )}
          </div>

          {/* Errors */}
          {validationResult.errors.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Errors (must fix)
              </h4>
              <div className="space-y-2">
                {validationResult.errors.map((error, idx) => (
                  <div key={idx} className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">
                      <code className="bg-red-100 dark:bg-red-900/30 px-1 rounded">{error.field}</code>: {error.message}
                    </p>
                    {error.suggestion && (
                      <p className="text-xs text-red-600 dark:text-red-500 mt-1 opacity-80">
                        💡 {error.suggestion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {validationResult.warnings.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Warnings (optional)
              </h4>
              <div className="space-y-2">
                {validationResult.warnings.slice(0, 3).map((warning, idx) => (
                  <div key={idx} className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      <code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">{warning.field}</code>: {warning.message}
                    </p>
                    {warning.suggestion && (
                      <p className="text-xs text-amber-600 dark:text-amber-500 mt-1 opacity-80">
                        💡 {warning.suggestion}
                      </p>
                    )}
                  </div>
                ))}
                {validationResult.warnings.length > 3 && (
                  <p className="text-xs text-text-muted">
                    + {validationResult.warnings.length - 3} more warning{validationResult.warnings.length - 3 > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Valid Fields */}
          {validationResult.validFields.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {validationResult.validFields.map((field) => (
                <span key={field} className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs rounded-full">
                  <CheckCircle2 className="h-3 w-3" />
                  {field}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {jsonPreview && validationResult?.isValid && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-6 overflow-hidden"
        >
          <h4 className="text-sm font-semibold text-text-primary mb-3">JSON Preview</h4>
          <div className="bg-bg-canvas rounded-lg p-4 overflow-x-auto max-h-48">
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
            disabled={uploading || !validationResult?.isValid}
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
            ) : !validationResult?.isValid ? (
              <>
                <AlertCircle className="h-4 w-4" />
                Fix Errors to Upload
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
