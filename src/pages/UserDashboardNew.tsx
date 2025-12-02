import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { InsightsPanel } from '@/components/AI/InsightsPanel';
import { MetricCardSkeleton } from '@/components/dashboard/skeletons/MetricCardSkeleton';
import { ChartSkeleton } from '@/components/dashboard/skeletons/ChartSkeleton';
import { ErrorState } from '@/components/dashboard/ErrorState';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthPersistence } from '@/hooks/useAuthPersistence';
import { containerVariants, itemVariants } from '@/lib/animations';
import { useIsMobile } from '@/hooks/use-mobile';
import { PullToRefresh } from '@/components/ui/PullToRefresh';

interface UserStats {
  objectiveScore: number;
  strScore: number;
  engagement: number;
  completion: number;
  avgRating: number;
  timeSaved: string;
}

const UserDashboardNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthPersistence();
  const isMobile = useIsMobile();
  const [selectedRegion, setSelectedRegion] = useState('global');
  const [selectedModule, setSelectedModule] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<UserStats>({
    objectiveScore: 0,
    strScore: 0,
    engagement: 0,
    completion: 0,
    avgRating: 0,
    timeSaved: '0h',
  });

  const [csrHotspots, setCsrHotspots] = useState<any[]>([]);
  const [clientObjections, setClientObjections] = useState<any[]>([]);
  const [confusionAreas, setConfusionAreas] = useState<any[]>([]);
  const [regionalSTR, setRegionalSTR] = useState<any[]>([]);
  const [availableModules, setAvailableModules] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user, selectedModule]);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user's assigned modules with their data (filtered by selected module)
      let assignmentsQuery = supabase
        .from('user_module_assignments')
        .select('*, modules!user_module_assignments_module_id_fkey(*)')
        .eq('user_id', user?.id);
      
      if (selectedModule !== 'all') {
        assignmentsQuery = assignmentsQuery.eq('module_id', selectedModule);
      }
      const { data: assignments, error: assignmentsError } = await assignmentsQuery;

      if (assignmentsError) throw assignmentsError;

      if (assignments && assignments.length > 0) {
        const completed = assignments.filter(a => a.completed_at).length;
        const total = assignments.length;
        const completionRate = Math.round((completed / total) * 100);

        // Calculate aggregate KPIs from modules
        let totalObjective = 0;
        let totalSTR = 0;
        let totalEngagement = 0;
        let totalRating = 0;
        let moduleCount = 0;

        const allConfusion: any[] = [];
        const allObjections: any[] = [];

        assignments.forEach((assignment: any) => {
          const module = assignment.modules;
          if (module && module.kpis) {
            const kpis = module.kpis;
            if (kpis.objectiveScore) totalObjective += Number(kpis.objectiveScore);
            if (kpis.strScore) totalSTR += Number(kpis.strScore);
            if (kpis.engagement) totalEngagement += Number(kpis.engagement);
            if (kpis.rating) totalRating += Number(kpis.rating);
            moduleCount++;
          }

          // Aggregate confusion data
          if (module && module.confusion_data && Array.isArray(module.confusion_data)) {
            allConfusion.push(...module.confusion_data);
          }

          // Aggregate objections
          if (module && module.objections && Array.isArray(module.objections)) {
            allObjections.push(...module.objections);
          }
        });

        const avgObjective = moduleCount > 0 ? Math.round(totalObjective / moduleCount) : 88;
        const avgSTR = moduleCount > 0 ? Math.round(totalSTR / moduleCount) : 92;
        const avgEngagement = moduleCount > 0 ? Math.round(totalEngagement / moduleCount) : 78;
        const avgRating = moduleCount > 0 ? (totalRating / moduleCount).toFixed(1) : '4.5';

        // Process confusion areas
        const confusionMap: any = {};
        allConfusion.forEach((item: any) => {
          const key = item.area || item.label || item.name;
          if (key) {
            confusionMap[key] = (confusionMap[key] || 0) + (Number(item.value) || 1);
          }
        });
        const processedConfusion = Object.entries(confusionMap)
          .map(([label, value]) => ({ label, value }))
          .sort((a: any, b: any) => b.value - a.value)
          .slice(0, 4);

        // Process objections
        const objectionsMap: any = {};
        allObjections.forEach((item: any) => {
          const key = item.objection || item.label || item.name;
          if (key) {
            objectionsMap[key] = (objectionsMap[key] || 0) + (Number(item.count) || 1);
          }
        });
        const processedObjections = Object.entries(objectionsMap)
          .map(([label, value]) => ({ label, value }))
          .sort((a: any, b: any) => b.value - a.value)
          .slice(0, 4);

        // Mock CSR hotspots and regional STR (would come from actual data in production)
        const mockCSR = [
          { label: 'North Region', value: avgObjective },
          { label: 'South Region', value: avgObjective - 10 },
          { label: 'East Region', value: avgObjective - 15 },
          { label: 'West Region', value: avgObjective + 5 },
        ];

        const mockRegionalSTR = [
          { region: 'North', value: 125000 },
          { region: 'South', value: 98000 },
          { region: 'East', value: 87000 },
          { region: 'West', value: 142000 },
        ];

        setStats({
          objectiveScore: avgObjective,
          strScore: avgSTR,
          engagement: avgEngagement,
          completion: completionRate,
          avgRating: Number(avgRating),
          timeSaved: `${Math.round(completed * 2)}h`,
        });

        setCsrHotspots(mockCSR);
        setClientObjections(processedObjections.length > 0 ? processedObjections : [
          { label: 'No objections data', value: 0 }
        ]);
        setConfusionAreas(processedConfusion.length > 0 ? processedConfusion : [
          { label: 'No confusion data', value: 0 }
        ]);
        setRegionalSTR(mockRegionalSTR);
        setAvailableModules(assignments.map((a: any) => ({
          id: a.modules?.id,
          title: a.modules?.title || 'Module',
        })));
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to load user statistics';
      setError(errorMessage);
      toast({
        title: 'Error Loading Statistics',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="user">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Header Skeleton */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <div className="h-8 w-32 bg-bg-surface-hover rounded animate-pulse" />
                <div className="h-4 w-48 bg-bg-surface-hover rounded animate-pulse" />
              </div>
              <div className="h-10 w-36 bg-bg-surface-hover rounded animate-pulse" />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="h-10 w-full sm:w-[200px] bg-bg-surface-hover rounded animate-pulse" />
              <div className="h-10 w-full sm:w-[200px] bg-bg-surface-hover rounded animate-pulse" />
            </div>
          </div>

          {/* Bento Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-4">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton colSpan="col-span-1 md:col-span-2 lg:col-span-3" />
            <MetricCardSkeleton colSpan="col-span-1 md:col-span-2 lg:col-span-3" />
            <ChartSkeleton />
            <ChartSkeleton colSpan="col-span-2 md:col-span-4 lg:col-span-6" height="h-[160px]" />
            <ChartSkeleton colSpan="col-span-2 md:col-span-4 lg:col-span-6" height="h-[160px]" />
            <ChartSkeleton colSpan="col-span-2 md:col-span-4 lg:col-span-6" height="h-[160px]" />
            <ChartSkeleton colSpan="col-span-2 md:col-span-4 lg:col-span-6" height="h-[160px]" />
          </div>
        </motion.div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="user">
        <ErrorState
          title="Failed to Load Dashboard"
          message={error}
          onRetry={fetchUserStats}
          fullPage
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="user">
      <PullToRefresh onRefresh={fetchUserStats}>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
        {/* Header with Filters */}
        <motion.div variants={itemVariants} className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
                Dashboard
              </h1>
              <p className="text-sm text-text-muted mt-1">
                Welcome back, {user?.email?.split('@')[0] || 'User'}
              </p>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => navigate('/lynq-library')}
                className="w-full sm:w-auto bg-brand hover:bg-brand-hover"
              >
                View All Modules
              </Button>
            </motion.div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger className="w-full sm:w-[200px] bg-bg-surface border-border-default touch-manipulation">
                <SelectValue placeholder="Select Module" />
              </SelectTrigger>
              <SelectContent className="bg-bg-surface z-50">
                <SelectItem value="all">All Modules</SelectItem>
                {availableModules.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-full sm:w-[200px] bg-bg-surface border-border-default touch-manipulation">
                <SelectValue placeholder="Select Region" />
              </SelectTrigger>
              <SelectContent className="bg-bg-surface z-50">
                <SelectItem value="global">Global</SelectItem>
                <SelectItem value="north">North</SelectItem>
                <SelectItem value="south">South</SelectItem>
                <SelectItem value="east">East</SelectItem>
                <SelectItem value="west">West</SelectItem>
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
              title="Objective Score"
              value={`${stats.objectiveScore}%`}
              trend={{ value: 12, direction: 'up' }}
              info="Overall learning effectiveness based on module completion and assessments"
              showDecoration
            />
          </motion.div>

          <motion.div variants={itemVariants} className="col-span-1 sm:col-span-1 md:col-span-2 lg:col-span-2">
            <MetricCard
              title="STR Score"
              value={stats.strScore}
              trend={{ value: 8, direction: 'up' }}
              info="Single Strength Rating - measures individual performance"
            />
          </motion.div>

          <motion.div variants={itemVariants} className="col-span-1 sm:col-span-1 md:col-span-2 lg:col-span-2">
            <MetricCard
              title="Engagement Rate"
              value={`${stats.engagement}%`}
              trend={{ value: 5, direction: 'up' }}
              info="Module interaction and participation rate"
            />
          </motion.div>

          <motion.div variants={itemVariants} className="col-span-1 sm:col-span-1 md:col-span-2 lg:col-span-2">
            <MetricCard
              title="Completion Rate"
              value={`${stats.completion}%`}
              trend={{ value: 3, direction: stats.completion > 80 ? 'up' : 'down' }}
              info="Percentage of assigned modules completed"
            />
          </motion.div>

          <motion.div variants={itemVariants} className="col-span-1 sm:col-span-1 md:col-span-2 lg:col-span-2">
            <MetricCard
              title="Average Rating"
              value={stats.avgRating}
              subtitle="out of 5 stars"
              trend={{ value: 0, direction: 'neutral' }}
            />
          </motion.div>

          <motion.div variants={itemVariants} className="col-span-1 sm:col-span-1 md:col-span-2 lg:col-span-2">
            <MetricCard
              title="Time Saved"
              value={stats.timeSaved}
              subtitle="this month"
              trend={{ value: 15, direction: 'up' }}
              info="Estimated time saved through efficient learning"
            />
          </motion.div>

          {/* AI Insights Panel */}
          <motion.div variants={itemVariants} className="col-span-1 sm:col-span-2 md:col-span-4 lg:col-span-12">
            <InsightsPanel metricsData={{
              objectiveScore: stats.objectiveScore,
              strScore: stats.strScore,
              engagement: stats.engagement,
              completion: stats.completion,
              avgRating: stats.avgRating,
              regionalSTR,
              csrHotspots,
              clientObjections,
              confusionAreas,
            }} />
          </motion.div>

          {/* CSR Hotspots */}
          <motion.div variants={itemVariants} className="col-span-1 sm:col-span-2 md:col-span-4 lg:col-span-6">
            <MetricCard
              title="CSR Hotspots"
            >
              <div className="space-y-3">
                {csrHotspots.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-secondary font-medium">{item.label}</span>
                      <span className="text-text-primary font-bold">{item.value}%</span>
                    </div>
                    <Progress value={item.value} className="h-2" />
                  </motion.div>
                ))}
              </div>
            </MetricCard>
          </motion.div>

          {/* Client Objections */}
          <motion.div variants={itemVariants} className="col-span-1 sm:col-span-2 md:col-span-4 lg:col-span-6">
            <MetricCard
              title="Top Client Objections"
            >
              <ResponsiveContainer width="100%" height={isMobile ? 120 : 160}>
                <BarChart data={clientObjections} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--text-muted))' }} width={isMobile ? 80 : 100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--bg-surface))',
                      border: '1px solid hsl(var(--border-default))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--brand))" radius={[0, 4, 4, 0]} barSize={isMobile ? 12 : 16} />
                </BarChart>
              </ResponsiveContainer>
            </MetricCard>
          </motion.div>

          {/* Confusion Areas */}
          <motion.div variants={itemVariants} className="col-span-1 sm:col-span-2 md:col-span-4 lg:col-span-6">
            <MetricCard
              title="Confusion Areas"
            >
              <ResponsiveContainer width="100%" height={isMobile ? 120 : 160}>
                <BarChart data={confusionAreas} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--text-muted))' }} width={isMobile ? 80 : 100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--bg-surface))',
                      border: '1px solid hsl(var(--border-default))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} barSize={isMobile ? 12 : 16} />
                </BarChart>
              </ResponsiveContainer>
            </MetricCard>
          </motion.div>

          {/* Regional STR */}
          <motion.div variants={itemVariants} className="col-span-1 sm:col-span-2 md:col-span-4 lg:col-span-6">
            <MetricCard
              title="Regional STR"
            >
              <ResponsiveContainer width="100%" height={isMobile ? 120 : 160}>
                <BarChart data={regionalSTR}>
                  <XAxis dataKey="region" tick={{ fontSize: 10, fill: 'hsl(var(--text-muted))' }} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--bg-surface))',
                      border: '1px solid hsl(var(--border-default))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => `$${(value / 1000).toFixed(0)}K`}
                  />
                  <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} barSize={isMobile ? 30 : 40} />
                </BarChart>
              </ResponsiveContainer>
            </MetricCard>
          </motion.div>
        </motion.div>
      </motion.div>
      </PullToRefresh>
    </DashboardLayout>
  );
};

export default UserDashboardNew;
