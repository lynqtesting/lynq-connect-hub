import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { SidePanel } from '@/components/dashboard/SidePanel';
import { AddModulePanel } from '@/components/dashboard/AddModulePanel';
import { CompactUploadZone } from '@/components/dashboard/CompactUploadZone';
import { TableSkeleton } from '@/components/dashboard/skeletons/TableSkeleton';
import { ErrorState } from '@/components/dashboard/ErrorState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, MoreVertical, Edit, Trash2, Users, FileJson, FileSpreadsheet } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ViewModulesNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [authorFilter, setAuthorFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created');
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [addPanelOpen, setAddPanelOpen] = useState(false);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .order('created_at', { ascending: false });

      if (modulesError) throw modulesError;

      const transformedData = (data || []).map((module) => ({
        id: module.id,
        title: module.title,
        description: module.description || '',
        status: 'Active',
        created: new Date(module.created_at).toLocaleDateString(),
        author: 'Admin',
        assigned: 0,
        completion: Math.floor(Math.random() * 100),
        screenshot_url: module.screenshot_url,
      }));

      setModules(transformedData);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to load modules';
      setError(errorMessage);
      toast({
        title: 'Error Loading Modules',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredModules = modules
    .filter((module) => {
      const matchesSearch =
        module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAuthor = authorFilter === 'all' || module.author === authorFilter;
      return matchesSearch && matchesAuthor;
    })
    .sort((a, b) => {
      if (sortBy === 'created') return new Date(b.created).getTime() - new Date(a.created).getTime();
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      return 0;
    });

  const handleModuleClick = (module: any) => {
    setSelectedModule(module);
    setPanelOpen(true);
  };

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Filters Skeleton */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-full sm:w-[180px]" />
            <Skeleton className="h-10 w-full sm:w-[180px]" />
          </div>

          {/* Table Skeleton */}
          <TableSkeleton rows={8} columns={7} />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="admin">
        <ErrorState
          title="Failed to Load Modules"
          message={error}
          onRetry={fetchModules}
          fullPage
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Module Manager</h1>
            <p className="text-text-muted mt-1">
              Manage content, assign users, and track module status
            </p>
          </div>
          <Button onClick={() => setAddPanelOpen(true)} className="gap-2 bg-brand hover:bg-brand-hover">
            <Plus className="h-4 w-4" />
            Add Module
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              placeholder="Search modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-bg-surface border-border-default"
            />
          </div>
          <Select value={authorFilter} onValueChange={setAuthorFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-bg-surface border-border-default">
              <SelectValue placeholder="Filter by Author" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Authors</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px] bg-bg-surface border-border-default">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created">Created Date</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Modules Table - Desktop Only */}
        <div className="hidden md:block bg-bg-surface border border-border-default rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-canvas border-b border-border-default">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Module</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Author</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Assigned</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Completion</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredModules.map((module) => (
                  <tr
                    key={module.id}
                    className="hover:bg-bg-surface-hover transition-colors cursor-pointer"
                    onClick={() => handleModuleClick(module)}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {module.screenshot_url && (
                          <img
                            src={module.screenshot_url}
                            alt={module.title}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium text-text-primary">{module.title}</p>
                          <p className="text-xs text-text-muted truncate max-w-xs">{module.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                        {module.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-sm text-text-secondary">{module.created}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold">
                          {module.author[0]}
                        </div>
                        <span className="text-sm text-text-secondary">{module.author}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-text-muted" />
                        <span className="text-sm text-text-secondary">{module.assigned}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1 min-w-[120px]">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-text-secondary">{module.completion}%</span>
                        </div>
                        <Progress value={module.completion} className="h-1.5" />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/edit-module/${module.id}`); }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); /* delete logic */ }}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {filteredModules.map((module) => (
            <div
              key={module.id}
              onClick={() => handleModuleClick(module)}
              className="bg-bg-surface border border-border-default rounded-xl overflow-hidden hover:shadow-md transition-shadow"
            >
              {module.screenshot_url && (
                <img
                  src={module.screenshot_url}
                  alt={module.title}
                  className="w-full h-32 object-cover"
                />
              )}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text-primary mb-1 truncate">
                      {module.title}
                    </h3>
                    <p className="text-xs text-text-muted line-clamp-2">{module.description}</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 flex-shrink-0">
                    {module.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-text-muted text-xs mb-1">Created</p>
                    <p className="text-text-secondary">{module.created}</p>
                  </div>
                  <div>
                    <p className="text-text-muted text-xs mb-1">Assigned</p>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-text-muted" />
                      <span className="text-text-secondary">{module.assigned}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-text-muted">Completion</span>
                    <span className="text-text-secondary font-medium">{module.completion}%</span>
                  </div>
                  <Progress value={module.completion} className="h-1.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Side Panel */}
      <SidePanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={selectedModule?.title || 'Module Details'}
      >
        {selectedModule && (
          <div className="space-y-6">
            {selectedModule.screenshot_url && (
              <img
                src={selectedModule.screenshot_url}
                alt={selectedModule.title}
                className="w-full h-48 object-cover rounded-lg"
              />
            )}
            <div>
              <h3 className="text-sm font-bold text-text-muted uppercase mb-2">Description</h3>
              <p className="text-text-secondary">{selectedModule.description || 'No description available'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-bold text-text-muted uppercase mb-2">Status</h3>
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                  {selectedModule.status}
                </Badge>
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-muted uppercase mb-2">Created</h3>
                <p className="text-text-secondary">{selectedModule.created}</p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-muted uppercase mb-2">Author</h3>
                <p className="text-text-secondary">{selectedModule.author}</p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-muted uppercase mb-2">Assigned Users</h3>
                <p className="text-text-secondary">{selectedModule.assigned}</p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-muted uppercase mb-2">Completion Rate</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">{selectedModule.completion}%</span>
                </div>
                <Progress value={selectedModule.completion} className="h-2" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate(`/edit-module/${selectedModule.id}`)} className="flex-1">
                <Edit className="mr-2 h-4 w-4" />
                Edit Module
              </Button>
              <Button variant="outline" onClick={() => navigate('/assign-modules')} className="flex-1">
                <Users className="mr-2 h-4 w-4" />
                Assign Users
              </Button>
            </div>

            {/* Data Uploads Section */}
            <div className="border-t border-border-default pt-6 mt-6">
              <h3 className="text-sm font-bold text-text-muted uppercase mb-4">Data Uploads</h3>
              
              {/* Deduction JSON Upload */}
              <div className="mb-4">
                <p className="text-xs text-text-muted mb-2">Deduction JSON</p>
                <CompactUploadZone
                  label="Upload Deduction JSON"
                  accept={{ 'application/json': ['.json'] }}
                  icon={<FileJson className="h-5 w-5" />}
                  onUpload={async (file) => {
                    const text = await file.text();
                    const jsonData = JSON.parse(text);
                    
                    const fileExt = file.name.split('.').pop();
                    const fileName = `deduction_${Date.now()}.${fileExt}`;
                    const filePath = `deduction-data/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                      .from('modules')
                      .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                      .from('modules')
                      .getPublicUrl(filePath);

                    const { error: dbError } = await supabase
                      .from('data_uploads')
                      .insert({
                        file_type: 'deduction_json',
                        file_name: file.name,
                        file_url: publicUrl,
                        file_size: file.size,
                        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
                        metadata: jsonData,
                        module_id: selectedModule.id,
                      });

                    if (dbError) throw dbError;

                    toast({
                      title: 'Success',
                      description: 'Deduction data uploaded',
                    });
                  }}
                />
              </div>

              {/* Response CSV Upload */}
              <div>
                <p className="text-xs text-text-muted mb-2">Response CSV</p>
                <CompactUploadZone
                  label="Upload Response CSV"
                  accept={{ 'text/csv': ['.csv'] }}
                  icon={<FileSpreadsheet className="h-5 w-5" />}
                  onUpload={async (file) => {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `response_${Date.now()}.${fileExt}`;
                    const filePath = `response-data/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                      .from('modules')
                      .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                      .from('modules')
                      .getPublicUrl(filePath);

                    const { error: dbError } = await supabase
                      .from('data_uploads')
                      .insert({
                        file_type: 'response_csv',
                        file_name: file.name,
                        file_url: publicUrl,
                        file_size: file.size,
                        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
                        module_id: selectedModule.id,
                      });

                    if (dbError) throw dbError;

                    toast({
                      title: 'Success',
                      description: 'Response data uploaded',
                    });
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </SidePanel>

      {/* Add Module Panel */}
      <AddModulePanel
        isOpen={addPanelOpen}
        onClose={() => setAddPanelOpen(false)}
        onSuccess={() => {
          setAddPanelOpen(false);
          fetchModules();
        }}
      />
    </DashboardLayout>
  );
};

export default ViewModulesNew;
