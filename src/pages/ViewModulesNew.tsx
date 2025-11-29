import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ModuleTable } from '@/components/dashboard/ModuleTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ViewModulesNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('modules')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to match ModuleTable interface
      const transformedData = (data || []).map((module) => ({
        id: module.id,
        title: module.title,
        description: module.description || '',
        status: 'Active', // You can add a status field to your modules table
        created: new Date(module.created_at).toLocaleDateString(),
        author: 'Admin', // You can add author tracking
        assigned: 0, // Calculate from user_module_assignments
        completion: 0, // Calculate completion rate
        screenshot_url: module.screenshot_url,
      }));

      setModules(transformedData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch modules',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredModules = modules.filter((module) => {
    const matchesSearch = module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || module.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading modules...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Module Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage content, assigns users, and track module status.
            </p>
          </div>
          <Button onClick={() => navigate('/upload-module')} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Module
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="newest">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Module Table */}
        <ModuleTable
          modules={filteredModules}
          onView={(id) => navigate(`/module/${id}`)}
          onEdit={(id) => navigate(`/edit-module/${id}`)}
        />
      </div>
    </DashboardLayout>
  );
};

export default ViewModulesNew;
