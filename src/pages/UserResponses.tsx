import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { TableSkeleton } from '@/components/dashboard/skeletons/TableSkeleton';
import { ErrorState } from '@/components/dashboard/ErrorState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Search, FileSpreadsheet, FileJson, ExternalLink, FileText } from 'lucide-react';
import { useAuthPersistence } from '@/hooks/useAuthPersistence';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

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

const UserResponses = () => {
  const { user } = useAuthPersistence();
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [responses, setResponses] = useState<ResponseData[]>([]);
  const [modules, setModules] = useState<ModuleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      // Fetch all data uploads for assigned modules
      const { data: uploads, error: uploadsError } = await supabase
        .from('data_uploads')
        .select('*')
        .in('module_id', moduleIds)
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

  const getTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'response_csv':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'deduction_json':
        return <FileJson className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (fileType: string) => {
    switch (fileType) {
      case 'response_csv':
        return 'Response Data';
      case 'deduction_json':
        return 'Deduction Data';
      default:
        return fileType;
    }
  };

  const getTypeBadge = (fileType: string) => {
    if (fileType === 'response_csv') {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
          Response CSV
        </Badge>
      );
    }
    if (fileType === 'deduction_json') {
      return (
        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
          Deduction JSON
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400">
        {fileType}
      </Badge>
    );
  };

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
    if (metadata.objective_score_overall) metrics.push(`Obj: ${(metadata.objective_score_overall * 100).toFixed(0)}%`);
    if (metadata.STR_overall) metrics.push(`STR: ${(metadata.STR_overall * 100).toFixed(0)}%`);
    
    return metrics.length > 0 ? metrics.join(' | ') : null;
  };

  const handleDownloadCSV = () => {
    const csvContent = [
      ['File Name', 'Type', 'Module', 'Uploaded', 'Size'],
      ...filteredResponses.map((r) => [
        r.file_name,
        getTypeLabel(r.file_type),
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
              View uploaded response data and deduction files for your assigned modules
            </p>
          </div>
          <Button onClick={handleDownloadCSV} variant="outline" className="gap-2" disabled={filteredResponses.length === 0}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
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
            <p className="text-text-primary font-medium mb-2">No data uploads yet</p>
            <p className="text-text-muted text-sm">
              Response and deduction files uploaded to your assigned modules will appear here.
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
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                      Module
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                      Uploaded
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                      Size / Metrics
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
                          {getTypeIcon(response.file_type)}
                          <p className="font-medium text-text-primary">{response.file_name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {getTypeBadge(response.file_type)}
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
                      <td className="px-4 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-1"
                          onClick={() => handleViewFile(response.file_url)}
                        >
                          <ExternalLink className="h-3 w-3" />
                          View
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
                      {getTypeIcon(response.file_type)}
                      <p className="font-semibold text-text-primary truncate">
                        {response.file_name}
                      </p>
                    </div>
                    <p className="text-xs text-text-muted truncate">{response.module_title}</p>
                  </div>
                  {getTypeBadge(response.file_type)}
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
                      <p className="text-text-muted text-xs mb-1">Metrics</p>
                      <p className="text-text-secondary text-sm">{getMetricsSummary(response.metadata)}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1 w-full"
                      onClick={() => handleViewFile(response.file_url)}
                    >
                      <ExternalLink className="h-3 w-3" />
                      View / Download
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
    </DashboardLayout>
  );
};

export default UserResponses;
