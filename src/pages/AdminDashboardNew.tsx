import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardChart } from '@/components/dashboard/DashboardChart';
import { UploadHistoryCard } from '@/components/dashboard/UploadHistoryCard';
import { Button } from '@/components/ui/button';
import { Plus, Users, Layers, GitPullRequest } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AdminDashboardNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalModules: 0,
    activeUsers: 0,
    pendingRequests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      // Fetch total modules
      const { count: modulesCount } = await supabase
        .from('modules')
        .select('*', { count: 'exact', head: true });

      // Fetch active users (users with role assignments)
      const { count: usersCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true });

      // Fetch pending requests
      const { count: requestsCount } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setStats({
        totalModules: modulesCount || 0,
        activeUsers: usersCount || 0,
        pendingRequests: requestsCount || 0,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch dashboard stats',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Mock chart data - replace with real data from your API
  const chartData = [
    { name: 'Mon', raised: 12, resolved: 8 },
    { name: 'Tue', raised: 15, resolved: 12 },
    { name: 'Wed', raised: 18, resolved: 15 },
    { name: 'Thu', raised: 16, resolved: 14 },
    { name: 'Fri', raised: 20, resolved: 18 },
    { name: 'Sat', raised: 22, resolved: 20 },
    { name: 'Sun', raised: 19, resolved: 19 },
  ];

  const recentUploads = [
    { id: '1', title: 'Sales 101', author: 'Admin', date: '2023-10-27' },
    { id: '2', title: 'HR Policies', author: 'Admin', date: '2023-10-25' },
    { id: '3', title: 'Q4 Goals', author: 'Admin', date: '2023-10-20' },
  ];

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading dashboard...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Overview</h1>
            <p className="text-muted-foreground mt-1">System status and activity monitoring.</p>
          </div>
          <Button onClick={() => navigate('/upload-module')} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Module
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Modules"
            value={stats.totalModules}
            icon={Layers}
            progress={Math.min((stats.totalModules / 20) * 100, 100)}
          />
          <StatCard
            title="Active Users"
            value={stats.activeUsers}
            icon={Users}
            progress={Math.min((stats.activeUsers / 100) * 100, 100)}
          />
          <StatCard
            title="Pending Requests"
            value={stats.pendingRequests}
            icon={GitPullRequest}
            progress={Math.min((stats.pendingRequests / 10) * 100, 100)}
          />
        </div>

        {/* Charts and Upload History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DashboardChart
              title="Issues Raised vs Resolved"
              data={chartData}
              type="area"
              dataKeys={['raised', 'resolved']}
              colors={['hsl(0, 84%, 60%)', 'hsl(142, 71%, 45%)']}
            />
          </div>
          <UploadHistoryCard uploads={recentUploads} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboardNew;
