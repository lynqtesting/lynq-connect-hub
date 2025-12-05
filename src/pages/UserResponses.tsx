import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { TableSkeleton } from '@/components/dashboard/skeletons/TableSkeleton';
import { ErrorState } from '@/components/dashboard/ErrorState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Search, FileSpreadsheet, Eye, FileText, Loader2 } from 'lucide-react';
import { useAuthPersistence } from '@/hooks/useAuthPersistence';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import Papa from 'papaparse';

interface ResponseData {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  created_at: string;
  module_id: string;
  metadata: any;
  file_size: number | null;
  module_title: string;
  module_category: string | null;
}

interface ModuleOption {
  id: string;
  title: string;
}

interface PreviewData {
  headers: string[];
  rows: Record<string, any>[];
}

const UserResponses = () => {
  const { user } = useAuthPersistence();
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [responses, setResponses] = useState<ResponseData[]>([]);
  const [modules, setModules] = useState<ModuleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData>({ headers: [], rows: [] });
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewFileName, setPreviewFileName] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchResponses();
    }
  }, [user?.id]);

  const fetchResponses = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // First get user's assigned module IDs
      const { data: assignments, error: assignmentError } = await supabase
        .from('user_module_assignments')
        .select('module_id')
        .eq('user_id', user.id);

      if (assignmentError) throw assignmentError;

      if (!assignments || assignments.length === 0) {
        setResponses([]);
        setModules([]);
        setLoading(false);
        return;
      }

      const moduleIds = assignments.map(a => a.module_id).filter(Boolean) as string[];

      // Fetch module details separately to avoid ambiguous foreign key
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('id, title, category')
        .in('id', moduleIds);

      if (modulesError) throw modulesError;

      // Create a lookup map for modules
      const modulesMap = new Map(
        (modulesData || []).map(m => [m.id, { title: m.title, category: m.category }])
      );

      // Extract module info for filter dropdown
      const moduleList: ModuleOption[] = (modulesData || []).map(m => ({
        id: m.id,
        title: m.title
      }));
      setModules(moduleList);

      // Fetch only response CSV uploads for assigned modules (not deduction JSON)
      const { data: uploads, error: uploadsError } = await supabase
        .from('data_uploads')
        .select('*')
        .in('module_id', moduleIds)
        .eq('file_type', 'response_csv')
        .order('created_at', { ascending: false });

      if (uploadsError) throw uploadsError;

      // Map uploads to response data with module info
      const responseData: ResponseData[] = (uploads || []).map(upload => {
        const moduleInfo = modulesMap.get(upload.module_id || '');
        return {
          id: upload.id,
          file_name: upload.file_name,
          file_url: upload.file_url,
          file_type: upload.file_type,
          created_at: upload.created_at || '',
          module_id: upload.module_id || '',
          metadata: upload.metadata,
          file_size: upload.file_size,
          module_title: moduleInfo?.title || 'Unknown Module',
          module_category: moduleInfo?.category || null
        };
      });

      setResponses(responseData);
    } catch (err: any) {
      console.error('Error fetching responses:', err);
      setError(err.message || 'Failed to load responses');
    } finally {
      setLoading(false);
    }
  };

  const filteredResponses = responses.filter((response) => {
    const matchesSearch =
      response.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      response.module_title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = moduleFilter === 'all' || response.module_id === moduleFilter;
    return matchesSearch && matchesModule;
  });

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getMetricsSummary = (metadata: any) => {
    if (!metadata) return null;
    
    const metrics: string[] = [];
    if (metadata.num_rows) metrics.push(`${metadata.num_rows} rows`);
    
    return metrics.length > 0 ? metrics.join(' | ') : null;
  };

  const handleDownloadCSV = () => {
    const csvContent = [
      ['File Name', 'Module', 'Uploaded', 'Size'],
      ...filteredResponses.map((r) => [
        r.file_name,
        r.module_title,
        r.created_at ? format(new Date(r.created_at), 'yyyy-MM-dd') : 'N/A',
        formatFileSize(r.file_size),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-responses.csv';
    a.click();
  };

  const handleViewFile = (fileUrl: string) => {
    window.open(fileUrl, '_blank');
  };

  const handlePreviewCSV = async (fileUrl: string, fileName: string) => {
    setPreviewLoading(true);
    setPreviewFileName(fileName);
    setPreviewOpen(true);
    setPreviewData({ headers: [], rows: [] });
    
    try {
      const response = await fetch(fileUrl);
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: true,
        complete: (results) => {
          const headers = results.meta.fields || [];
          const rows = results.data.slice(0, 100) as Record<string, any>[];
          setPreviewData({ headers, rows });
          setPreviewLoading(false);
        },
        error: () => {
          setPreviewLoading(false);
        }
      });
    } catch (err) {
      console.error('Failed to fetch CSV:', err);
      setPreviewLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="user">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-full sm:w-[200px]" />
          </div>
          <TableSkeleton rows={5} columns={6} />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="user">
        <ErrorState
          title="Failed to Load Responses"
          message={error}
          onRetry={fetchResponses}
          fullPage
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="user">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">My Responses</h1>
            <p className="text-text-muted mt-1">
              View and preview uploaded response CSV files for your assigned modules
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-bg-surface border-border-default"
            />
          </div>
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="w-full sm:w-[200px] bg-bg-surface border-border-default">
              <SelectValue placeholder="Filter by Module" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              {modules.map((module) => (
                <SelectItem key={module.id} value={module.id}>
                  {module.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Empty State */}
        {responses.length === 0 && (
          <div className="text-center py-12 bg-bg-surface border border-border-default rounded-xl">
            <FileText className="h-12 w-12 mx-auto text-text-muted mb-4" />
            <p className="text-text-primary font-medium mb-2">No response files yet</p>
            <p className="text-text-muted text-sm">
              Response CSV files uploaded to your assigned modules will appear here.
            </p>
          </div>
        )}

        {/* Responses Table - Desktop */}
        {filteredResponses.length > 0 && (
          <div className="hidden sm:block bg-bg-surface border border-border-default rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bg-canvas border-b border-border-default">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                      File Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                      Module
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                      Uploaded
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                      Size / Rows
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-text-muted uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {filteredResponses.map((response) => (
                    <tr
                      key={response.id}
                      className="hover:bg-bg-surface-hover transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                          <p className="font-medium text-text-primary">{response.file_name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-text-secondary">{response.module_title}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-text-secondary">
                          {response.created_at ? format(new Date(response.created_at), 'MMM d, yyyy') : 'N/A'}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-text-secondary">
                          {formatFileSize(response.file_size)}
                        </p>
                        {response.metadata && getMetricsSummary(response.metadata) && (
                          <p className="text-xs text-text-muted mt-1">
                            {getMetricsSummary(response.metadata)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-1"
                          onClick={() => handlePreviewCSV(response.file_url, response.file_name)}
                        >
                          <Eye className="h-3 w-3" />
                          Preview
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-1"
                          onClick={() => handleViewFile(response.file_url)}
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mobile Card View */}
        {filteredResponses.length > 0 && (
          <div className="sm:hidden space-y-3">
            {filteredResponses.map((response) => (
              <div
                key={response.id}
                className="bg-bg-surface border border-border-default rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                      <p className="font-semibold text-text-primary truncate">
                        {response.file_name}
                      </p>
                    </div>
                    <p className="text-xs text-text-muted truncate">{response.module_title}</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                    CSV
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-text-muted text-xs mb-1">Uploaded</p>
                    <p className="text-text-secondary">
                      {response.created_at ? format(new Date(response.created_at), 'MMM d, yyyy') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-muted text-xs mb-1">Size</p>
                    <p className="text-text-secondary">{formatFileSize(response.file_size)}</p>
                  </div>
                  {response.metadata && getMetricsSummary(response.metadata) && (
                    <div className="col-span-2">
                      <p className="text-text-muted text-xs mb-1">Info</p>
                      <p className="text-text-secondary text-sm">{getMetricsSummary(response.metadata)}</p>
                    </div>
                  )}
                  <div className="col-span-2 flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1 flex-1"
                      onClick={() => handlePreviewCSV(response.file_url, response.file_name)}
                    >
                      <Eye className="h-3 w-3" />
                      Preview
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1 flex-1"
                      onClick={() => handleViewFile(response.file_url)}
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredResponses.length === 0 && responses.length > 0 && (
          <div className="text-center py-12">
            <p className="text-text-muted">No files match your search criteria</p>
          </div>
        )}
      </div>

      {/* CSV Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] sm:max-h-[80vh] overflow-hidden flex flex-col p-4 sm:p-6">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 shrink-0" />
              <span className="truncate">{previewFileName}</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Showing first 100 rows of the CSV file
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto border border-border-default rounded-lg min-h-0">
            {previewLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-brand" />
              </div>
            ) : previewData.headers.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-text-muted">
                No data to display
              </div>
            ) : (
              <table className="w-full text-xs sm:text-sm">
                <thead className="sticky top-0 bg-bg-surface border-b border-border-default">
                  <tr>
                    {previewData.headers.map((header) => (
                      <th key={header} className="px-2 sm:px-3 py-2 text-left font-semibold text-text-primary whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {previewData.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-bg-surface-hover">
                      {previewData.headers.map((header) => (
                        <td key={header} className="px-2 sm:px-3 py-1.5 sm:py-2 text-text-secondary whitespace-nowrap max-w-[150px] sm:max-w-none truncate">
                          {row[header] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default UserResponses;
