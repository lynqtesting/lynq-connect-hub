import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, FileSpreadsheet, FileJson, Calendar } from 'lucide-react';
import { ResponseDataUpload } from './ResponseDataUpload';
import { DeductionDataUpload } from './DeductionDataUpload';
import { supabase } from '@/integrations/supabase/client';
import { containerVariants, itemVariants } from '@/lib/animations';
import { format } from 'date-fns';

interface Upload {
  id: string;
  file_name: string;
  file_type: string;
  created_at: string;
  file_size: number;
}

export function DataManagementSection() {
  const [recentUploads, setRecentUploads] = useState<Upload[]>([]);

  useEffect(() => {
    fetchRecentUploads();
  }, []);

  const fetchRecentUploads = async () => {
    const { data } = await supabase
      .from('data_uploads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) {
      setRecentUploads(data);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Section Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <div className="p-3 bg-brand/10 rounded-xl">
          <Database className="h-6 w-6 text-brand" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">Data Management</h2>
          <p className="text-sm text-text-muted">Upload and manage system data files</p>
        </div>
      </motion.div>

      {/* Upload Components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResponseDataUpload />
        <DeductionDataUpload />
      </div>

      {/* Recent Uploads */}
      {recentUploads.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="bg-bg-surface border border-border-default rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Uploads</h3>
          <div className="space-y-3">
            {recentUploads.map((upload, index) => (
              <motion.div
                key={upload.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 bg-bg-canvas rounded-xl hover:bg-bg-surface-hover transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    upload.file_type === 'response_csv' 
                      ? 'bg-blue-100 dark:bg-blue-900/20' 
                      : 'bg-purple-100 dark:bg-purple-900/20'
                  }`}>
                    {upload.file_type === 'response_csv' ? (
                      <FileSpreadsheet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <FileJson className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{upload.file_name}</p>
                    <p className="text-xs text-text-muted">
                      {(upload.file_size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(upload.created_at), 'MMM dd, yyyy')}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
