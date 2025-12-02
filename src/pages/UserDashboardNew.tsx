import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { InsightsPanel } from '@/components/AI/InsightsPanel';
import { CSRHotspotsCard } from '@/components/dashboard/CSRHotspotsCard';
import { TopClientObjectionsCard } from '@/components/dashboard/TopClientObjectionsCard';
import { ConfusionAreasCard } from '@/components/dashboard/ConfusionAreasCard';
import { RegionalSTRCard } from '@/components/dashboard/RegionalSTRCard';
import { MetricCardSkeleton } from '@/components/dashboard/skeletons/MetricCardSkeleton';
import { ChartSkeleton } from '@/components/dashboard/skeletons/ChartSkeleton';
import { ErrorState } from '@/components/dashboard/ErrorState';
import { Button } from '@/components/ui/button';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthPersistence } from '@/hooks/useAuthPersistence';
import { containerVariants, itemVariants } from '@/lib/animations';
import { PullToRefresh } from '@/components/ui/PullToRefresh';

interface UserStats {
  objectiveScore: number;
  strScore: number;
  engagement: number;
  completion: number;
  avgRating: number;
  timeSaved: string;
}

// Types for new components
interface CSRHotspotItem {
  module: string;
  escalations: number;
  severity: 'high' | 'medium' | 'low';
}

interface ObjectionItem {
  label: string;
  count: number;
  priority: 'high' | 'medium' | 'low';
}

interface ConfusionItem {
  label: string;
  metricLabel: string;
  severity: 'high' | 'medium' | 'low';
}

interface RegionalSTRItem {
  region: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
}

const UserDashboardNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthPersistence();
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

  const [csrHotspots, setCsrHotspots] = useState<CSRHotspotItem[]>([]);
  const [clientObjections, setClientObjections] = useState<ObjectionItem[]>([]);
  const [confusionAreas, setConfusionAreas] = useState<ConfusionItem[]>([]);
  const [regionalSTR, setRegionalSTR] = useState<RegionalSTRItem[]>([]);
  const [availableModules, setAvailableModules] = useState<{ id: string; title: string }[]>([]);

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

        // Process confusion areas - map to new format
        const confusionMap: Record<string, number> = {};
        allConfusion.forEach((item: any) => {
          const key = item.area || item.label || item.name;
          if (key) {
            confusionMap[key] = (confusionMap[key] || 0) + (Number(item.value) || 1);
          }
        });
        const processedConfusion: ConfusionItem[] = Object.entries(confusionMap)
          .map(([label, value], index) => ({
            label,
            metricLabel: `${value} issues`,
            severity: (index === 0 ? 'high' : index === 1 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
          }))
          .slice(0, 4);

        // Process objections - map to new format
        const objectionsMap: Record<string, number> = {};
        allObjections.forEach((item: any) => {
          const key = item.objection || item.label || item.name;
          if (key) {
            objectionsMap[key] = (objectionsMap[key] || 0) + (Number(item.count) || 1);
          }
        });
        const processedObjections: ObjectionItem[] = Object.entries(objectionsMap)
          .map(([label, count], index) => ({
            label,
            count: count as number,
            priority: (index === 0 ? 'high' : index === 1 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 4);

        // Mock CSR hotspots - with new format
        const mockCSR: CSRHotspotItem[] = [
          { module: 'Product Knowledge', escalations: 24, severity: 'high' },
          { module: 'Pricing Objections', escalations: 18, severity: 'high' },
          { module: 'Technical Support', escalations: 12, severity: 'medium' },
          { module: 'Onboarding Process', escalations: 8, severity: 'low' },
        ];

        // Mock regional STR - with new format
        const mockRegionalSTR: RegionalSTRItem[] = [
          { region: 'North', value: 125000, trend: 'up' },
          { region: 'South', value: 98000, trend: 'down' },
          { region: 'East', value: 87000, trend: 'stable' },
          { region: 'West', value: 142000, trend: 'up' },
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
          { label: 'No objections data', count: 0, priority: 'low' }
        ]);
        setConfusionAreas(processedConfusion.length > 0 ? processedConfusion : [
          { label: 'No confusion data', metricLabel: '0 issues', severity: 'low' }
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
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex items-center gap-2">
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
              <InfoTooltip
                label="Module Selector"
                description="Switch between viewing combined metrics for all modules or a single module's detailed performance."
              />
            </div>

            <div className="flex items-center gap-2">
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
              <InfoTooltip
                label="Region Selector"
                description="Filter CSR hotspots and objections by region to compare where friction is highest."
              />
            </div>
          </div>
        </motion.div>

        {/* Bento Grid - Metrics */}
        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4"
        >
          <motion.div variants={itemVariants}>
            <MetricCard
              title="Objective Score"
              value={`${stats.objectiveScore}%`}
              trend={{ value: 12, direction: 'up' }}
              info="Shows how accurately learners answered the objective quiz questions we can directly verify."
              showDecoration
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <MetricCard
              title="STR Score"
              value={stats.strScore}
              trend={{ value: 8, direction: 'up' }}
              info="Single strength score that links learner skill to actual module completion and impact."
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <MetricCard
              title="Engagement"
              value={`${stats.engagement}%`}
              trend={{ value: 5, direction: 'up' }}
              info="Measures how much of the module learners truly interacted with, not just opened."
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <MetricCard
              title="Completion"
              value={`${stats.completion}%`}
              trend={{ value: 3, direction: stats.completion > 80 ? 'up' : 'down' }}
              info="Percentage of learners who fully finished this module, from start to end."
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <MetricCard
              title="Avg Rating"
              value={stats.avgRating}
              subtitle="of 5"
              trend={{ value: 0, direction: 'neutral' }}
              info="Average satisfaction rating learners gave this module based on their feedback."
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <MetricCard
              title="Time Saved"
              value={stats.timeSaved}
              subtitle="this month"
              trend={{ value: 15, direction: 'up' }}
              info="Average time each learner saves by applying the skills from this module in real work."
            />
          </motion.div>

          {/* AI Insights Panel */}
          <motion.div variants={itemVariants} className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-6">
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
          <motion.div variants={itemVariants} className="col-span-2 sm:col-span-3 md:col-span-2 lg:col-span-3">
            <CSRHotspotsCard 
              items={csrHotspots} 
              selectedRegion={selectedRegion}
              onRegionChange={setSelectedRegion}
            />
          </motion.div>

          {/* Top Client Objections */}
          <motion.div variants={itemVariants} className="col-span-2 sm:col-span-3 md:col-span-2 lg:col-span-3">
            <TopClientObjectionsCard items={clientObjections} />
          </motion.div>

          {/* Conversion Stoppers */}
          <motion.div variants={itemVariants} className="col-span-2 sm:col-span-3 md:col-span-2 lg:col-span-3">
            <ConfusionAreasCard items={confusionAreas} />
          </motion.div>

          {/* Regional STR */}
          <motion.div variants={itemVariants} className="col-span-2 sm:col-span-3 md:col-span-2 lg:col-span-3">
            <RegionalSTRCard
              data={regionalSTR}
              selectedRegion={selectedRegion}
              onRegionChange={setSelectedRegion}
            />
          </motion.div>
        </motion.div>
      </motion.div>
      </PullToRefresh>
    </DashboardLayout>
  );
};

export default UserDashboardNew;
