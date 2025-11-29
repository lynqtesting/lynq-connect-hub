import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, FileSpreadsheet, FileJson, Calendar, Download } from 'lucide-react';
import { ResponseDataUpload } from './ResponseDataUpload';
import { DeductionDataUpload } from './DeductionDataUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface ModuleDataSectionProps {
  moduleId: string;
}

interface Upload {
  id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  created_at: string;
  file_size: number;
}

export function ModuleDataSection({ moduleId }: ModuleDataSectionProps) {
  const [recentUploads, setRecentUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModuleUploads();
  }, [moduleId]);

  const fetchModuleUploads = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('data_uploads')
        .select('*')
        .eq('module_id', moduleId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        setRecentUploads(data);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand/10 rounded-xl">
            <Database className="h-5 w-5 text-brand" />
          </div>
          <div>
            <CardTitle>Module Data Files</CardTitle>
            <p className="text-sm text-text-muted">Upload response and deduction data for this module</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Components */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponseDataUpload moduleId={moduleId} onUploadComplete={fetchModuleUploads} />
          <DeductionDataUpload moduleId={moduleId} onUploadComplete={fetchModuleUploads} />
        </div>

        {/* Recent Uploads for this Module */}
        {recentUploads.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-text-primary">Recent Uploads</h4>
            <div className="space-y-2">
              {recentUploads.map((upload, index) => (
                <motion.div
                  key={upload.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-bg-canvas rounded-xl hover:bg-bg-surface-hover transition-colors border border-border-subtle"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${
                      upload.file_type === 'response_csv' 
                        ? 'bg-blue-100 dark:bg-blue-900/20' 
                        : 'bg-purple-100 dark:bg-purple-900/20'
                    }`}>
                      {upload.file_type === 'response_csv' ? (
                        <FileSpreadsheet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <FileJson className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{upload.file_name}</p>
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(upload.created_at), 'MMM dd, yyyy')}
                        <span>•</span>
                        <span>{(upload.file_size / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(upload.file_url, '_blank')}
                    className="ml-2"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {!loading && recentUploads.length === 0 && (
          <div className="text-center py-8 text-text-muted border border-dashed border-border-default rounded-xl">
            <Database className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No data files uploaded yet</p>
            <p className="text-xs mt-1">Upload response CSV or deduction JSON files above</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
