import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { DashboardChart } from '@/components/dashboard/DashboardChart';
import { UploadHistoryCard } from '@/components/dashboard/UploadHistoryCard';
import { MetricCardSkeleton } from '@/components/dashboard/skeletons/MetricCardSkeleton';
import { ChartSkeleton } from '@/components/dashboard/skeletons/ChartSkeleton';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Users, Layers, GitPullRequest, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
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

          {/* Metrics Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-4">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <ChartSkeleton />
            <div className="col-span-2 md:col-span-4 lg:col-span-4 bg-bg-surface border border-border-default rounded-xl p-6 space-y-3">
              <Skeleton className="h-5 w-32" />
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          </div>

          {/* Quick Actions Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Admin Overview</h1>
            <p className="text-sm text-text-muted mt-1">System status and activity monitoring</p>
          </div>
          <Button onClick={() => navigate('/upload-module')} className="gap-2 w-full sm:w-auto bg-brand hover:bg-brand-hover">
            <Plus className="h-4 w-4" />
            Add Module
          </Button>
        </div>

        {/* Bento Grid - Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-4">
          <MetricCard
            title="Total Modules"
            value={stats.totalModules}
            trend={{ value: 8, direction: 'up' }}
            info="Total number of learning modules in the system"
            colSpan="col-span-2 md:col-span-2 lg:col-span-3"
            showDecoration
          >
            <Layers className="h-8 w-8 text-brand opacity-20 absolute bottom-4 right-4" />
          </MetricCard>

          <MetricCard
            title="Active Users"
            value={stats.activeUsers}
            trend={{ value: 12, direction: 'up' }}
            info="Users who have logged in within the last 30 days"
            colSpan="col-span-2 md:col-span-2 lg:col-span-3"
          >
            <Users className="h-8 w-8 text-brand opacity-20 absolute bottom-4 right-4" />
          </MetricCard>

          <MetricCard
            title="Pending Requests"
            value={stats.pendingRequests}
            trend={{ value: 5, direction: 'down' }}
            info="Requests awaiting review or action"
            colSpan="col-span-2 md:col-span-2 lg:col-span-3"
          >
            <Clock className="h-8 w-8 text-amber-500 opacity-20 absolute bottom-4 right-4" />
          </MetricCard>

          <MetricCard
            title="Completion Rate"
            value="82%"
            trend={{ value: 3, direction: 'up' }}
            info="Average module completion rate across all users"
            colSpan="col-span-2 md:col-span-2 lg:col-span-3"
          >
            <CheckCircle className="h-8 w-8 text-emerald-500 opacity-20 absolute bottom-4 right-4" />
          </MetricCard>

          {/* Issues Chart */}
          <MetricCard
            title="Issues Raised vs Resolved"
            colSpan="col-span-2 md:col-span-4 lg:col-span-8"
          >
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRaised" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--text-muted))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--text-muted))' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--bg-surface))',
                    border: '1px solid hsl(var(--border-default))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="raised" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorRaised)" strokeWidth={2} />
                <Area type="monotone" dataKey="resolved" stroke="hsl(var(--chart-2))" fillOpacity={1} fill="url(#colorResolved)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </MetricCard>

          {/* Recent Uploads */}
          <MetricCard
            title="Recent Uploads"
            colSpan="col-span-2 md:col-span-4 lg:col-span-4"
          >
            <div className="space-y-3">
              {recentUploads.map((upload) => (
                <div key={upload.id} className="flex items-center justify-between p-3 bg-bg-canvas rounded-lg hover:bg-bg-surface-hover transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{upload.title}</p>
                    <p className="text-xs text-text-muted">{upload.author}</p>
                  </div>
                  <span className="text-xs text-text-muted ml-2 flex-shrink-0">{upload.date}</span>
                </div>
              ))}
            </div>
          </MetricCard>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button variant="outline" onClick={() => navigate('/view-modules')} className="h-auto py-6 flex flex-col items-center gap-2 hover:bg-bg-surface-hover hover:border-brand">
            <Layers className="h-6 w-6 text-brand" />
            <span className="font-semibold">Manage Modules</span>
          </Button>
          <Button variant="outline" onClick={() => navigate('/view-users')} className="h-auto py-6 flex flex-col items-center gap-2 hover:bg-bg-surface-hover hover:border-brand">
            <Users className="h-6 w-6 text-brand" />
            <span className="font-semibold">Manage Users</span>
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/tweak-requests')} className="h-auto py-6 flex flex-col items-center gap-2 hover:bg-bg-surface-hover hover:border-brand">
            <GitPullRequest className="h-6 w-6 text-brand" />
            <span className="font-semibold">View Requests</span>
          </Button>
          <Button variant="outline" onClick={() => navigate('/upload-module')} className="h-auto py-6 flex flex-col items-center gap-2 hover:bg-bg-surface-hover hover:border-brand">
            <Plus className="h-6 w-6 text-brand" />
            <span className="font-semibold">Upload Module</span>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboardNew;
