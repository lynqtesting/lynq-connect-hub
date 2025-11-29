import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  acceptedFileTypes: { [key: string]: string[] };
  maxSize?: number;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export function FileUploadZone({
  onFileSelect,
  acceptedFileTypes,
  maxSize = 10 * 1024 * 1024, // 10MB default
  label,
  description,
  icon,
}: FileUploadZoneProps) {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      setUploadStatus('error');
      const error = rejectedFiles[0].errors[0];
      if (error.code === 'file-too-large') {
        setErrorMessage(`File is too large. Max size: ${(maxSize / 1024 / 1024).toFixed(0)}MB`);
      } else if (error.code === 'file-invalid-type') {
        setErrorMessage('Invalid file type. Please upload the correct format.');
      } else {
        setErrorMessage(error.message);
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      setUploadStatus('success');
      setErrorMessage('');
      onFileSelect(file);
    }
  }, [onFileSelect, maxSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxSize,
    multiple: false,
  });

  const clearFile = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setErrorMessage('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 cursor-pointer
          ${isDragActive ? 'border-brand bg-brand/5 scale-[1.02]' : 'border-border-default hover:border-brand/50 hover:bg-bg-surface-hover'}
          ${uploadStatus === 'success' ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' : ''}
          ${uploadStatus === 'error' ? 'border-destructive bg-destructive/5' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <AnimatePresence mode="wait">
          {uploadStatus === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center text-center"
            >
              <motion.div
                animate={isDragActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5, repeat: isDragActive ? Infinity : 0 }}
                className={`p-4 rounded-full mb-4 ${isDragActive ? 'bg-brand text-white' : 'bg-bg-canvas text-text-muted'}`}
              >
                {icon || <Upload className="h-8 w-8" />}
              </motion.div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">{label}</h3>
              {description && <p className="text-sm text-text-muted mb-4">{description}</p>}
              <p className="text-xs text-text-muted">
                {isDragActive ? 'Drop file here...' : 'Drag & drop or click to browse'}
              </p>
              <p className="text-xs text-text-muted mt-1">
                Max size: {(maxSize / 1024 / 1024).toFixed(0)}MB
              </p>
            </motion.div>
          )}

          {uploadStatus === 'success' && selectedFile && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center text-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="p-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-4"
              >
                <CheckCircle className="h-8 w-8" />
              </motion.div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">File Selected</h3>
              <div className="flex items-center gap-2 px-4 py-2 bg-bg-canvas rounded-lg mb-4">
                <File className="h-4 w-4 text-text-muted" />
                <span className="text-sm text-text-primary font-medium">{selectedFile.name}</span>
                <span className="text-xs text-text-muted">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Remove
              </Button>
            </motion.div>
          )}

          {uploadStatus === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: 1, 
                x: [-10, 10, -10, 10, 0],
                transition: { x: { duration: 0.5 } }
              }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center text-center"
            >
              <div className="p-4 rounded-full bg-destructive/10 text-destructive mb-4">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Upload Failed</h3>
              <p className="text-sm text-destructive mb-4">{errorMessage}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
              >
                Try Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
