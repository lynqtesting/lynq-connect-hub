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

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch total modules
      const { count: modulesCount, error: modulesError } = await supabase
        .from('modules')
        .select('*', { count: 'exact', head: true });

      if (modulesError) throw modulesError;

      // Fetch active users
      const { count: usersCount, error: usersError } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Fetch pending requests
      const { count: requestsCount, error: requestsError } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (requestsError) throw requestsError;

      // Fetch completion rate from user_module_assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('user_module_assignments')
        .select('completed_at');

      if (assignmentsError) throw assignmentsError;

      const completed = assignments?.filter(a => a.completed_at).length || 0;
      const total = assignments?.length || 1;
      const completionRate = Math.round((completed / total) * 100);

      // Fetch modules with KPIs for avg engagement
      const { data: modules, error: modulesDataError } = await supabase
        .from('modules')
        .select('kpis');

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

      // Fetch recent requests for chart data
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: requests, error: requestsDataError } = await supabase
        .from('requests')
        .select('created_at, status')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (requestsDataError) throw requestsDataError;

      // Process chart data
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const chartDataMap: any = {};
      
      requests?.forEach(req => {
        const dayIndex = new Date(req.created_at).getDay();
        const dayName = days[dayIndex === 0 ? 6 : dayIndex - 1];
        
        if (!chartDataMap[dayName]) {
          chartDataMap[dayName] = { name: dayName, raised: 0, resolved: 0 };
        }
        
        chartDataMap[dayName].raised++;
        if (req.status === 'completed' || req.status === 'resolved') {
          chartDataMap[dayName].resolved++;
        }
      });

      const processedChartData = days.map(day => 
        chartDataMap[day] || { name: day, raised: 0, resolved: 0 }
      );

      // Fetch recent module uploads
      const { data: recentModules, error: recentModulesError } = await supabase
        .from('modules')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

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
        {/* Header */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
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
        </motion.div>

        {/* Bento Grid - Metrics */}
        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-4"
        >
          <motion.div variants={itemVariants}>
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
          </motion.div>

          <motion.div variants={itemVariants}>
            <MetricCard
              title="Active Users"
              value={stats.activeUsers}
              trend={{ value: 12, direction: 'up' }}
              info="Users with active role assignments"
              colSpan="col-span-2 md:col-span-2 lg:col-span-3"
            >
              <Users className="h-8 w-8 text-brand opacity-20 absolute bottom-4 right-4" />
            </MetricCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <MetricCard
              title="Pending Requests"
              value={stats.pendingRequests}
              trend={{ value: 5, direction: 'down' }}
              info="Requests awaiting review or action"
              colSpan="col-span-2 md:col-span-2 lg:col-span-3"
            >
              <Clock className="h-8 w-8 text-amber-500 opacity-20 absolute bottom-4 right-4" />
            </MetricCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <MetricCard
              title="Completion Rate"
              value={`${stats.completionRate}%`}
              trend={{ value: 3, direction: 'up' }}
              info="Average module completion rate across all users"
              colSpan="col-span-2 md:col-span-2 lg:col-span-3"
            >
              <CheckCircle className="h-8 w-8 text-emerald-500 opacity-20 absolute bottom-4 right-4" />
            </MetricCard>
          </motion.div>

          {/* Issues Chart */}
          <motion.div variants={itemVariants} className="col-span-2 md:col-span-4 lg:col-span-8">
            <MetricCard
              title="Issues Raised vs Resolved"
              colSpan="col-span-full"
            >
              <ResponsiveContainer width="100%" height={isMobile ? 150 : 200}>
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
          <motion.div variants={itemVariants} className="col-span-2 md:col-span-4 lg:col-span-4">
            <MetricCard
              title="Recent Uploads"
              colSpan="col-span-full"
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
                      onClick={() => navigate(`/module/${upload.id}`)}
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
          <motion.div variants={itemVariants} className="col-span-2 md:col-span-4 lg:col-span-12">
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
