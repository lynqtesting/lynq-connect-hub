import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { InsightsPanel } from '@/components/AI/InsightsPanel';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthPersistence } from '@/hooks/useAuthPersistence';

const UserDashboardNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthPersistence();
  const [selectedRegion, setSelectedRegion] = useState('global');
  const [selectedModule, setSelectedModule] = useState('all');
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    objectiveScore: 88,
    strScore: 92,
    engagement: 78,
    completion: 85,
    avgRating: 4.5,
    timeSaved: '12h',
  });

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      const { data: assignments } = await supabase
        .from('user_module_assignments')
        .select('*, modules(*)')
        .eq('user_id', user?.id);

      if (assignments) {
        const completed = assignments.filter(a => a.completed_at).length;
        const total = assignments.length;
        const completionRate = total > 0 ? (completed / total) * 100 : 0;

        setStats(prev => ({
          ...prev,
          completion: Math.round(completionRate),
        }));
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch user stats',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Mock data for visualizations
  const csrHotspots = [
    { label: 'North Region', value: 85 },
    { label: 'South Region', value: 72 },
    { label: 'East Region', value: 68 },
    { label: 'West Region', value: 91 },
  ];

  const clientObjections = [
    { label: 'Price Concerns', value: 45 },
    { label: 'Feature Gaps', value: 32 },
    { label: 'Support Issues', value: 28 },
    { label: 'Integration', value: 22 },
  ];

  const confusionAreas = [
    { label: 'Advanced Features', value: 38 },
    { label: 'Setup Process', value: 29 },
    { label: 'Best Practices', value: 24 },
    { label: 'Reporting', value: 18 },
  ];

  const regionalSTR = [
    { region: 'North', value: 125000 },
    { region: 'South', value: 98000 },
    { region: 'East', value: 87000 },
    { region: 'West', value: 142000 },
  ];

  const handleGenerateInsights = async () => {
    // Simulate AI insights generation
    return new Promise<any>((resolve) => {
      setTimeout(() => {
        resolve({
          dataQuality: { isValid: true, issues: [] },
          trends: [
            { metric: 'Engagement', direction: 'up', analysis: '+12% vs last month' },
            { metric: 'Completion', direction: 'up', analysis: '+8% improvement' },
          ],
          insights: [
            'Your objective score has increased by 12% this quarter, showing strong learning progress.',
            'West region shows the highest STR at $142K, indicating strong product adoption.',
            'Price concerns are the top client objection at 45%, suggesting need for value demonstration.',
            'Advanced features confusion is at 38%, recommend additional training modules.',
          ],
          callToAction: 'Focus on addressing price concerns and provide advanced feature tutorials to improve engagement further.',
          confidence: 87,
        });
      }, 1500);
    });
  };

  if (loading) {
    return (
      <DashboardLayout role="user">
        <div className="flex items-center justify-center h-64">
          <div className="text-text-muted">Loading dashboard...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="user">
      <div className="space-y-6">
        {/* Header with Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
                Dashboard
              </h1>
              <p className="text-sm text-text-muted mt-1">
                Welcome back, {user?.email?.split('@')[0] || 'User'}
              </p>
            </div>
            <Button
              onClick={() => navigate('/lynq-library')}
              className="w-full sm:w-auto bg-brand hover:bg-brand-hover"
            >
              View All Modules
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger className="w-full sm:w-[200px] bg-bg-surface border-border-default">
                <SelectValue placeholder="Select Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                <SelectItem value="module1">Sales Training</SelectItem>
                <SelectItem value="module2">Product Demo</SelectItem>
                <SelectItem value="module3">Customer Success</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-full sm:w-[200px] bg-bg-surface border-border-default">
                <SelectValue placeholder="Select Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global</SelectItem>
                <SelectItem value="north">North</SelectItem>
                <SelectItem value="south">South</SelectItem>
                <SelectItem value="east">East</SelectItem>
                <SelectItem value="west">West</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bento Grid - Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-4">
          <MetricCard
            title="Objective Score"
            value={`${stats.objectiveScore}%`}
            trend={{ value: 12, direction: 'up' }}
            info="Overall learning effectiveness based on module completion and assessments"
            colSpan="col-span-2 md:col-span-2 lg:col-span-3"
            showDecoration
          />

          <MetricCard
            title="STR Score"
            value={stats.strScore}
            trend={{ value: 8, direction: 'up' }}
            info="Single Strength Rating - measures individual performance"
            colSpan="col-span-2 md:col-span-2 lg:col-span-3"
          />

          <MetricCard
            title="Engagement Rate"
            value={`${stats.engagement}%`}
            trend={{ value: 5, direction: 'up' }}
            info="Module interaction and participation rate"
            colSpan="col-span-2 md:col-span-2 lg:col-span-3"
          />

          <MetricCard
            title="Completion Rate"
            value={`${stats.completion}%`}
            trend={{ value: 3, direction: 'down' }}
            info="Percentage of assigned modules completed"
            colSpan="col-span-2 md:col-span-2 lg:col-span-3"
          />

          <MetricCard
            title="Average Rating"
            value={stats.avgRating}
            subtitle="out of 5 stars"
            trend={{ value: 0, direction: 'neutral' }}
            colSpan="col-span-1 md:col-span-2 lg:col-span-3"
          />

          <MetricCard
            title="Time Saved"
            value={stats.timeSaved}
            subtitle="this month"
            trend={{ value: 15, direction: 'up' }}
            info="Estimated time saved through efficient learning"
            colSpan="col-span-1 md:col-span-2 lg:col-span-3"
          />

          {/* AI Insights Panel */}
          <InsightsPanel onGenerate={handleGenerateInsights} />

          {/* CSR Hotspots */}
          <MetricCard
            title="CSR Hotspots"
            colSpan="col-span-2 md:col-span-4 lg:col-span-6"
          >
            <div className="space-y-3">
              {csrHotspots.map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary font-medium">{item.label}</span>
                    <span className="text-text-primary font-bold">{item.value}%</span>
                  </div>
                  <Progress value={item.value} className="h-2" />
                </div>
              ))}
            </div>
          </MetricCard>

          {/* Client Objections */}
          <MetricCard
            title="Top Client Objections"
            colSpan="col-span-2 md:col-span-4 lg:col-span-6"
          >
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={clientObjections} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--brand))" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </MetricCard>

          {/* Confusion Areas */}
          <MetricCard
            title="Confusion Areas"
            colSpan="col-span-2 md:col-span-4 lg:col-span-6"
          >
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={confusionAreas} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </MetricCard>

          {/* Regional STR */}
          <MetricCard
            title="Regional STR"
            colSpan="col-span-2 md:col-span-4 lg:col-span-6"
          >
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={regionalSTR}>
                <XAxis dataKey="region" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => `$${(value / 1000).toFixed(0)}K`}
                />
                <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </MetricCard>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserDashboardNew;
