import { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { MetricCardSkeleton } from '@/components/dashboard/skeletons/MetricCardSkeleton';
import { ChartSkeleton } from '@/components/dashboard/skeletons/ChartSkeleton';
import { InsightsPanelSkeleton } from '@/components/dashboard/skeletons/InsightsPanelSkeleton';
import { ErrorState } from '@/components/dashboard/ErrorState';
import { Button } from '@/components/ui/button';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthPersistence } from '@/hooks/useAuthPersistence';
import { containerVariants, itemVariants } from '@/lib/animations';

// Lazy load heavy components
const InsightsPanel = lazy(() => import('@/components/AI/InsightsPanel').then(mod => ({ default: mod.InsightsPanel })));
const CSRHotspotsCard = lazy(() => import('@/components/dashboard/CSRHotspotsCard').then(mod => ({ default: mod.CSRHotspotsCard })));
const TopClientObjectionsCard = lazy(() => import('@/components/dashboard/TopClientObjectionsCard').then(mod => ({ default: mod.TopClientObjectionsCard })));
const ConfusionAreasCard = lazy(() => import('@/components/dashboard/ConfusionAreasCard').then(mod => ({ default: mod.ConfusionAreasCard })));
const RegionalSTRCard = lazy(() => import('@/components/dashboard/RegionalSTRCard').then(mod => ({ default: mod.RegionalSTRCard })));
const LearningProgressCard = lazy(() => import('@/components/dashboard/LearningProgressCard').then(mod => ({ default: mod.LearningProgressCard })));
const DropoffRateCard = lazy(() => import('@/components/dashboard/DropoffRateCard').then(mod => ({ default: mod.DropoffRateCard })));


interface UserStats {
  objectiveScore: number;
  strScore: number;
  engagement: number;
  completion: number;
  avgRating: number;
  timeSaved: string;
}

interface LearningProgress {
  completed: number;
  inProgress: number;
  notStarted: number;
}

// Types for new components
interface CSRHotspotItem {
  label: string;
  percentage: number;
}

interface ObjectionItem {
  label: string;
  count: number;
  priority?: 'High' | 'Medium' | 'Low';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuthPersistence();
  const [selectedRegion, setSelectedRegion] = useState('global');
  const [objectionRegion, setObjectionRegion] = useState('global');
  const [selectedModule, setSelectedModule] = useState(() => {
    const moduleFromUrl = searchParams.get('module');
    return moduleFromUrl || 'all';
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync URL with module selection
  const handleModuleChange = (value: string) => {
    setSelectedModule(value);
    if (value === 'all') {
      searchParams.delete('module');
    } else {
      searchParams.set('module', value);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const [stats, setStats] = useState<UserStats>({
    objectiveScore: 0,
    strScore: 0,
    engagement: 0,
    completion: 0,
    avgRating: 0,
    timeSaved: '0h',
  });

  const [learningProgress, setLearningProgress] = useState<LearningProgress>({
    completed: 0,
    inProgress: 0,
    notStarted: 0,
  });
  const [dropoffRate, setDropoffRate] = useState(0);

  const [csrHotspots, setCsrHotspots] = useState<CSRHotspotItem[]>([]);
  const [clientObjections, setClientObjections] = useState<ObjectionItem[]>([]);
  const [confusionAreas, setConfusionAreas] = useState<ConfusionItem[]>([]);
  const [regionalSTR, setRegionalSTR] = useState<RegionalSTRItem[]>([]);
  const [availableModules, setAvailableModules] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user, selectedModule, objectionRegion]);

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
        
        // Get module IDs for fetching deduction data
        const moduleIds = assignments.map((a: any) => a.module_id).filter(Boolean);
        
        // Fetch deduction data from data_uploads
        let deductionQuery = supabase
          .from('data_uploads')
          .select('metadata, module_id')
          .eq('file_type', 'deduction_json')
          .order('created_at', { ascending: false });
        
        if (selectedModule !== 'all') {
          deductionQuery = deductionQuery.eq('module_id', selectedModule);
        } else {
          deductionQuery = deductionQuery.in('module_id', moduleIds);
        }
        
        const { data: deductionData } = await deductionQuery;
        
        // Initialize values
        let totalObjective = 0;
        let totalSTR = 0;
        let totalEngagement = 0;
        let totalRating = 0;
        let moduleCount = 0;
        let calculatedCompletion = 0;

        const allObjections: ObjectionItem[] = [];
        const allRegionalSTR: RegionalSTRItem[] = [];
        const allConfusion: ConfusionItem[] = [];
        const allCsrHotspots: CSRHotspotItem[] = [];

        // Process deduction data from uploads
        if (deductionData && deductionData.length > 0) {
          // Use the most recent deduction data per module
          const latestByModule = new Map();
          deductionData.forEach((upload: any) => {
            if (!latestByModule.has(upload.module_id)) {
              latestByModule.set(upload.module_id, upload.metadata);
            }
          });

          latestByModule.forEach((metadata: any) => {
            if (metadata) {
              // Extract KPIs from deduction metadata
              if (metadata.objective_score_overall !== undefined) {
                totalObjective += Number(metadata.objective_score_overall) * 100;
                moduleCount++;
              }
              if (metadata.STR_overall !== undefined) {
                totalSTR += Number(metadata.STR_overall) * 100;
              }
              if (metadata.engagement_rate_overall !== undefined) {
                totalEngagement += Number(metadata.engagement_rate_overall) * 100;
              }
              
              // Calculate completion from learning_progress_status
              if (metadata.learning_progress_status) {
                const progressData = metadata.learning_progress_status;
                const completedCount = progressData.Completed || 0;
                const totalCount = (progressData.Completed || 0) + (progressData['In Progress'] || 0) + (progressData['Not Started'] || 0);
                if (totalCount > 0) {
                  calculatedCompletion = Math.round((completedCount / totalCount) * 100);
                }
              }

              // Process regional STR data
              if (metadata.region_wise_STR) {
                Object.entries(metadata.region_wise_STR).forEach(([region, value]: [string, any]) => {
                  const existingRegion = allRegionalSTR.find(r => r.region === region);
                  if (!existingRegion) {
                    allRegionalSTR.push({
                      region,
                      value: Math.round(Number(value) * 100),
                      trend: Number(value) > 0.5 ? 'up' : Number(value) < 0.3 ? 'down' : 'stable',
                    });
                  }
                });
              }

              // Process client objections by region (filtered)
              if (metadata.client_objection_region_wise) {
                Object.entries(metadata.client_objection_region_wise).forEach(([region, objections]: [string, any]) => {
                  // Filter by selected objection region
                  const shouldInclude = objectionRegion === 'global' || 
                    region.toLowerCase() === objectionRegion.toLowerCase();
                  
                  if (shouldInclude && objections && typeof objections === 'object') {
                    Object.entries(objections).forEach(([label, count]: [string, any]) => {
                      const existing = allObjections.find(o => o.label === label);
                      if (existing) {
                        existing.count += Number(count);
                      } else {
                        allObjections.push({
                          label,
                          count: Number(count),
                        });
                      }
                    });
                  }
                });
              }

              // Process confusion/conversion stoppers data
              if (metadata.confusion_areas || metadata.conversion_stoppers) {
                const confusionData = metadata.confusion_areas || metadata.conversion_stoppers;
                if (Array.isArray(confusionData)) {
                  confusionData.forEach((item: any, index: number) => {
                    allConfusion.push({
                      label: item.label || item.area || item.name || 'Unknown',
                      metricLabel: `${item.percentage || item.value || 0}%`,
                      severity: index === 0 ? 'high' : index === 1 ? 'medium' : 'low',
                    });
                  });
                }
              }

              // Process CSR Hotspots from cod_by_theme
              if (metadata.cod_by_theme && metadata.cod_total_hits) {
                const totalHits = Number(metadata.cod_total_hits);
                if (totalHits > 0) {
                  Object.entries(metadata.cod_by_theme).forEach(([cardName, count]: [string, any]) => {
                    // Format card name: "Card_11_Quiz" → "Card 11 Quiz"
                    const formattedLabel = cardName
                      .replace(/_/g, ' ')
                      .replace(/Card (\d+)/, 'Card $1');
                    const percentage = Math.round((Number(count) / totalHits) * 100);
                    
                    const existing = allCsrHotspots.find(h => h.label === formattedLabel);
                    if (existing) {
                      existing.percentage = Math.max(existing.percentage, percentage);
                    } else {
                      allCsrHotspots.push({
                        label: formattedLabel,
                        percentage,
                      });
                    }
                  });
                }
              }
            }
          });
        }

        // Calculate averages or use fallback
        const avgObjective = moduleCount > 0 ? Math.round(totalObjective / moduleCount) : 0;
        const avgSTR = moduleCount > 0 ? Math.round(totalSTR / moduleCount) : 0;
        const avgEngagement = moduleCount > 0 ? Math.round(totalEngagement / moduleCount) : 0;
        const completionRate = calculatedCompletion > 0 ? calculatedCompletion : Math.round((completed / total) * 100);

        // Sort objections by count and add priority
        allObjections.sort((a, b) => b.count - a.count);
        allObjections.forEach((obj, index) => {
          obj.priority = index === 0 ? 'High' : index < 3 ? 'Medium' : 'Low';
        });

        // Sort CSR Hotspots by percentage descending, take top 4
        allCsrHotspots.sort((a, b) => b.percentage - a.percentage);

        // Extract time saved and dropoff rate from latest metadata
        let timeSavedValue = 0;
        let dropoffValue = 0;
        let progressData = { completed: 0, inProgress: 0, notStarted: 0 };

        if (deductionData && deductionData.length > 0) {
          const latestMetadata = deductionData[0].metadata as any;
          if (latestMetadata) {
            // Extract productivity_time_saved_avg_hours
            if (latestMetadata.productivity_time_saved_avg_hours !== undefined) {
              timeSavedValue = Number(latestMetadata.productivity_time_saved_avg_hours);
            }
            // Extract dropoff_rate_%
            if (latestMetadata['dropoff_rate_%'] !== undefined) {
              dropoffValue = Number(latestMetadata['dropoff_rate_%']);
            }
            // Extract learning_progress_status
            if (latestMetadata.learning_progress_status) {
              const lps = latestMetadata.learning_progress_status;
              progressData = {
                completed: lps.Completed || lps.completed || 0,
                inProgress: lps['In-Progress'] || lps['In Progress'] || lps.inProgress || 0,
                notStarted: lps['Not Started'] || lps['Not_Started'] || lps.notStarted || 0,
              };
            }
          }
        }

        setLearningProgress(progressData);
        setDropoffRate(dropoffValue);

        setStats({
          objectiveScore: avgObjective,
          strScore: avgSTR,
          engagement: avgEngagement,
          completion: completionRate,
          avgRating: 4.5,
          timeSaved: timeSavedValue > 0 ? `${timeSavedValue.toFixed(1)}h` : `${Math.round(completed * 2)}h`,
        });

        setCsrHotspots(allCsrHotspots.length > 0 ? allCsrHotspots.slice(0, 4) : [
          { label: 'No data', percentage: 0 }
        ]);
        setClientObjections(allObjections.length > 0 ? allObjections.slice(0, 4) : [
          { label: 'No objections data', count: 0 }
        ]);
        setConfusionAreas(allConfusion.length > 0 ? allConfusion.slice(0, 4) : [
          { label: 'No conversion data', metricLabel: '0%', severity: 'low' }
        ]);
        setRegionalSTR(allRegionalSTR.length > 0 ? allRegionalSTR : [
          { region: 'No data', value: 0, trend: 'stable' }
        ]);
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
              <Select value={selectedModule} onValueChange={handleModuleChange}>
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
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4 max-w-full"
        >
          <motion.div variants={itemVariants}>
            <MetricCard
              title="Objective Score"
              value={`${stats.objectiveScore}%`}
              trend={{ value: 12, direction: 'up' }}
              info="Shows how accurately learners answered the objective quiz questions we can directly verify."
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

          {/* Learning Progress */}
          <motion.div variants={itemVariants} className="col-span-2 sm:col-span-3 md:col-span-2 lg:col-span-3">
            <Suspense fallback={<ChartSkeleton height="h-[180px]" />}>
              <LearningProgressCard data={learningProgress} />
            </Suspense>
          </motion.div>

          {/* Dropoff Rate */}
          <motion.div variants={itemVariants} className="col-span-2 sm:col-span-3 md:col-span-2 lg:col-span-3">
            <Suspense fallback={<ChartSkeleton height="h-[180px]" />}>
              <DropoffRateCard rate={dropoffRate} />
            </Suspense>
          </motion.div>

          {/* AI Insights Panel */}
          <motion.div variants={itemVariants} className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-6">
            <Suspense fallback={<InsightsPanelSkeleton />}>
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
            </Suspense>
          </motion.div>

          {/* CSR Hotspots */}
          <motion.div variants={itemVariants} className="col-span-2 sm:col-span-3 md:col-span-2 lg:col-span-3">
            <Suspense fallback={<ChartSkeleton height="h-[180px]" />}>
              <CSRHotspotsCard 
                items={csrHotspots} 
                selectedRegion={selectedRegion}
                onRegionChange={setSelectedRegion}
              />
            </Suspense>
          </motion.div>

          {/* Top Client Objections */}
          <motion.div variants={itemVariants} className="col-span-2 sm:col-span-3 md:col-span-2 lg:col-span-3">
            <Suspense fallback={<ChartSkeleton height="h-[180px]" />}>
              <TopClientObjectionsCard 
                items={clientObjections}
                selectedRegion={objectionRegion}
                onRegionChange={setObjectionRegion}
              />
            </Suspense>
          </motion.div>

          {/* Conversion Stoppers */}
          <motion.div variants={itemVariants} className="col-span-2 sm:col-span-3 md:col-span-2 lg:col-span-3">
            <Suspense fallback={<ChartSkeleton height="h-[180px]" />}>
              <ConfusionAreasCard items={confusionAreas} />
            </Suspense>
          </motion.div>

          {/* Regional STR */}
          <motion.div variants={itemVariants} className="col-span-2 sm:col-span-3 md:col-span-2 lg:col-span-3">
            <Suspense fallback={<ChartSkeleton height="h-[180px]" />}>
              <RegionalSTRCard
                data={regionalSTR}
                selectedRegion={selectedRegion}
                onRegionChange={setSelectedRegion}
              />
            </Suspense>
          </motion.div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default UserDashboardNew;
