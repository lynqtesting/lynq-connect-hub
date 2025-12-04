import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { MetricCardSkeleton } from '@/components/dashboard/skeletons/MetricCardSkeleton';
import { ChartSkeleton } from '@/components/dashboard/skeletons/ChartSkeleton';
import { ErrorState } from '@/components/dashboard/ErrorState';
import { InsightsPanel } from '@/components/AI/InsightsPanel';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Users, Layers, GitPullRequest, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { containerVariants, itemVariants } from '@/lib/animations';
import { useIsMobile } from '@/hooks/use-mobile';
import { PullToRefresh } from '@/components/ui/PullToRefresh';

interface DashboardStats {
  totalModules: number;
  activeUsers: number;
  pendingRequests: number;
  completionRate: number;
  avgEngagement: number;
}

const AdminDashboardNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [stats, setStats] = useState<DashboardStats>({
    totalModules: 0,
    activeUsers: 0,
    pendingRequests: 0,
    completionRate: 0,
    avgEngagement: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentUploads, setRecentUploads] = useState<any[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [availableModules, setAvailableModules] = useState<any[]>([]);
  const [chartTimeRange, setChartTimeRange] = useState<'week' | 'month' | 'year' | 'max'>('week');

  useEffect(() => {
    fetchDashboardStats();
  }, [selectedModule, chartTimeRange]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all modules for dropdown
      const { data: allModules, error: allModulesError } = await supabase
        .from('modules')
        .select('id, title')
        .order('title', { ascending: true });

      if (allModulesError) throw allModulesError;
      setAvailableModules(allModules || []);

      // Build query based on selected module
      let modulesQuery = supabase.from('modules').select('*', { count: 'exact', head: true });
      if (selectedModule !== 'all') {
        modulesQuery = modulesQuery.eq('id', selectedModule);
      }
      const { count: modulesCount, error: modulesError } = await modulesQuery;

      if (modulesError) throw modulesError;

      // Fetch active users
      const { count: usersCount, error: usersError } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Fetch pending requests (filtered by module if selected)
      let requestsQuery = supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      if (selectedModule !== 'all') {
        requestsQuery = requestsQuery.eq('module_id', selectedModule);
      }
      const { count: requestsCount, error: requestsError } = await requestsQuery;

      if (requestsError) throw requestsError;

      // Fetch completion rate from user_module_assignments (filtered by module if selected)
      let assignmentsQuery = supabase.from('user_module_assignments').select('completed_at');
      if (selectedModule !== 'all') {
        assignmentsQuery = assignmentsQuery.eq('module_id', selectedModule);
      }
      const { data: assignments, error: assignmentsError } = await assignmentsQuery;

      if (assignmentsError) throw assignmentsError;

      const completed = assignments?.filter(a => a.completed_at).length || 0;
      const total = assignments?.length || 1;
      const completionRate = Math.round((completed / total) * 100);

      // Fetch modules with KPIs for avg engagement (filtered by module if selected)
      let modulesDataQuery = supabase.from('modules').select('kpis');
      if (selectedModule !== 'all') {
        modulesDataQuery = modulesDataQuery.eq('id', selectedModule);
      }
      const { data: modules, error: modulesDataError } = await modulesDataQuery;

      if (modulesDataError) throw modulesDataError;

      let totalEngagement = 0;
      let moduleCount = 0;
      modules?.forEach(m => {
        if (m.kpis && typeof m.kpis === 'object' && 'engagement' in m.kpis) {
          totalEngagement += Number(m.kpis.engagement) || 0;
          moduleCount++;
        }
      });
      const avgEngagement = moduleCount > 0 ? Math.round(totalEngagement / moduleCount) : 75;

      // Calculate date range based on chartTimeRange
      const getDateRange = () => {
        const now = new Date();
        switch (chartTimeRange) {
          case 'week': return new Date(now.setDate(now.getDate() - 7));
          case 'month': return new Date(now.setDate(now.getDate() - 30));
          case 'year': return new Date(now.setFullYear(now.getFullYear() - 1));
          case 'max': return null;
          default: return new Date(now.setDate(now.getDate() - 7));
        }
      };

      const dateFrom = getDateRange();
      
      let requestsDataQuery = supabase
        .from('requests')
        .select('created_at, status')
        .order('created_at', { ascending: true });
      
      if (dateFrom) {
        requestsDataQuery = requestsDataQuery.gte('created_at', dateFrom.toISOString());
      }
      
      if (selectedModule !== 'all') {
        requestsDataQuery = requestsDataQuery.eq('module_id', selectedModule);
      }
      const { data: requests, error: requestsDataError } = await requestsDataQuery;

      if (requestsDataError) throw requestsDataError;

      // Process chart data based on time range
      const chartDataMap: any = {};
      let labels: string[] = [];

      if (chartTimeRange === 'week') {
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        requests?.forEach(req => {
          const dayIndex = new Date(req.created_at).getDay();
          const dayName = labels[dayIndex === 0 ? 6 : dayIndex - 1];
          if (!chartDataMap[dayName]) chartDataMap[dayName] = { name: dayName, raised: 0, resolved: 0 };
          chartDataMap[dayName].raised++;
          if (req.status === 'completed' || req.status === 'resolved') chartDataMap[dayName].resolved++;
        });
      } else if (chartTimeRange === 'month') {
        labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        requests?.forEach(req => {
          const date = new Date(req.created_at);
          const weekNum = Math.min(Math.ceil(date.getDate() / 7), 4);
          const weekLabel = `Week ${weekNum}`;
          if (!chartDataMap[weekLabel]) chartDataMap[weekLabel] = { name: weekLabel, raised: 0, resolved: 0 };
          chartDataMap[weekLabel].raised++;
          if (req.status === 'completed' || req.status === 'resolved') chartDataMap[weekLabel].resolved++;
        });
      } else if (chartTimeRange === 'year' || chartTimeRange === 'max') {
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        requests?.forEach(req => {
          const monthIndex = new Date(req.created_at).getMonth();
          const monthName = labels[monthIndex];
          if (!chartDataMap[monthName]) chartDataMap[monthName] = { name: monthName, raised: 0, resolved: 0 };
          chartDataMap[monthName].raised++;
          if (req.status === 'completed' || req.status === 'resolved') chartDataMap[monthName].resolved++;
        });
      }

      const processedChartData = labels.map(label => 
        chartDataMap[label] || { name: label, raised: 0, resolved: 0 }
      );

      // Fetch recent module uploads (filtered by module if selected)
      let recentModulesQuery = supabase
        .from('modules')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (selectedModule !== 'all') {
        recentModulesQuery = recentModulesQuery.eq('id', selectedModule);
      }
      const { data: recentModules, error: recentModulesError } = await recentModulesQuery;

      if (recentModulesError) throw recentModulesError;

      const formattedUploads = recentModules?.map(m => ({
        id: m.id,
        title: m.title,
        author: 'Admin',
        date: new Date(m.created_at).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      })) || [];

      setStats({
        totalModules: modulesCount || 0,
        activeUsers: usersCount || 0,
        pendingRequests: requestsCount || 0,
        completionRate,
        avgEngagement,
      });
      setChartData(processedChartData);
      setRecentUploads(formattedUploads);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to load dashboard statistics';
      setError(errorMessage);
      toast({
        title: 'Error Loading Dashboard',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Metrics Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-4">
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
        </motion.div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="admin">
        <ErrorState
          title="Failed to Load Dashboard"
          message={error}
          onRetry={fetchDashboardStats}
          fullPage
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <PullToRefresh onRefresh={fetchDashboardStats}>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
        {/* Header with Filter */}
        <motion.div variants={itemVariants} className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Admin Overview</h1>
              <p className="text-sm text-text-muted mt-1">System status and activity monitoring</p>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={() => navigate('/upload-module')} className="gap-2 w-full sm:w-auto bg-brand hover:bg-brand-hover">
                <Plus className="h-4 w-4" />
                Add Module
              </Button>
            </motion.div>
          </div>

          {/* Module Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger className="w-full sm:w-[200px] bg-bg-surface border-border-default touch-manipulation">
                <SelectValue placeholder="All Modules" />
              </SelectTrigger>
              <SelectContent className="bg-bg-surface z-50">
                <SelectItem value="all">All Modules</SelectItem>
                {availableModules.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Bento Grid - Metrics */}
        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-3 md:gap-4"
        >
          <motion.div variants={itemVariants} className="col-span-1 sm:col-span-1 md:col-span-2 lg:col-span-2">
            <MetricCard
              title="Total Modules"
              value={stats.totalModules}
              trend={{ value: 8, direction: 'up' }}
              info="Total number of learning modules in the system"
              showDecoration
            >
              <Layers className="h-8 w-8 text-brand opacity-40 absolute bottom-4 right-4" />
            </MetricCard>
          </motion.div>

          <motion.div variants={itemVariants} className="col-span-1 sm:col-span-1 md:col-span-2 lg:col-span-2">
            <MetricCard
              title="Active Users"
              value={stats.activeUsers}
              trend={{ value: 12, direction: 'up' }}
              info="Users with active role assignments"
            >
              <Users className="h-8 w-8 text-brand opacity-40 absolute bottom-4 right-4" />
            </MetricCard>
          </motion.div>

          <motion.div variants={itemVariants} className="col-span-1 sm:col-span-1 md:col-span-2 lg:col-span-2">
            <MetricCard
              title="Pending Requests"
              value={stats.pendingRequests}
              trend={{ value: 5, direction: 'down' }}
              info="Requests awaiting review or action"
            >
              <Clock className="h-8 w-8 text-amber-500 opacity-40 absolute bottom-4 right-4" />
            </MetricCard>
          </motion.div>

          <motion.div variants={itemVariants} className="col-span-1 sm:col-span-1 md:col-span-2 lg:col-span-2">
            <MetricCard
              title="Completion Rate"
              value={`${stats.completionRate}%`}
              trend={{ value: 3, direction: 'up' }}
              info="Average module completion rate across all users"
            >
              <CheckCircle className="h-8 w-8 text-emerald-500 opacity-40 absolute bottom-4 right-4" />
            </MetricCard>
          </motion.div>

          {/* Issues Chart */}
          <motion.div variants={itemVariants} className="col-span-1 sm:col-span-2 md:col-span-4 lg:col-span-8">
            <MetricCard
              title="Issues Raised vs Resolved"
              headerAction={
                <div className="flex gap-1">
                  {(['week', 'month', 'year', 'max'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setChartTimeRange(range)}
                      className={`px-2 py-1 text-xs rounded-md transition-colors ${
                        chartTimeRange === range
                          ? 'bg-brand text-white'
                          : 'bg-bg-canvas text-text-muted hover:bg-bg-surface-hover'
                      }`}
                    >
                      {range.charAt(0).toUpperCase() + range.slice(1)}
                    </button>
                  ))}
                </div>
              }
            >
              <ResponsiveContainer width="100%" height={isMobile ? 140 : 180}>
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
          </motion.div>

          {/* Recent Uploads */}
          <motion.div variants={itemVariants} className="col-span-1 sm:col-span-2 md:col-span-4 lg:col-span-4">
            <MetricCard
              title="Recent Uploads"
            >
              <div className="space-y-3">
                {recentUploads.length > 0 ? (
                  recentUploads.map((upload, index) => (
                    <motion.div
                      key={upload.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      className="flex items-center justify-between p-3 bg-bg-canvas rounded-lg hover:bg-bg-surface-hover transition-colors cursor-pointer"
                      onClick={() => navigate(`/edit-module/${upload.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{upload.title}</p>
                        <p className="text-xs text-text-muted">{upload.author}</p>
                      </div>
                      <span className="text-xs text-text-muted ml-2 flex-shrink-0">{upload.date}</span>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-sm text-text-muted text-center py-4">No recent uploads</p>
                )}
              </div>
            </MetricCard>
          </motion.div>

          {/* AI Insights Panel */}
          <motion.div variants={itemVariants} className="col-span-1 sm:col-span-2 md:col-span-4 lg:col-span-12">
            <InsightsPanel metricsData={{
              totalModules: stats.totalModules,
              activeUsers: stats.activeUsers,
              pendingRequests: stats.pendingRequests,
              completionRate: stats.completionRate,
              avgEngagement: stats.avgEngagement,
              weeklyTrends: chartData,
            }} />
          </motion.div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { icon: Layers, label: 'Manage Modules', path: '/view-modules', color: 'text-brand' },
            { icon: Users, label: 'Manage Users', path: '/view-users', color: 'text-brand' },
            { icon: GitPullRequest, label: 'View Requests', path: '/admin/tweak-requests', color: 'text-brand' },
            { icon: Plus, label: 'Upload Module', path: '/upload-module', color: 'text-brand' },
          ].map((action, index) => (
            <motion.div key={action.path} variants={itemVariants}>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="outline" 
                  onClick={() => navigate(action.path)} 
                  className="h-auto py-6 flex flex-col items-center gap-2 hover:bg-bg-surface-hover hover:border-brand w-full touch-manipulation"
                >
                  <action.icon className={`h-6 w-6 ${action.color}`} />
                  <span className="font-semibold text-sm">{action.label}</span>
                </Button>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
      </PullToRefresh>
    </DashboardLayout>
  );
};

export default AdminDashboardNew;
