import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardChart } from '@/components/dashboard/DashboardChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Clock, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthPersistence } from '@/hooks/useAuthPersistence';

const UserDashboardNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthPersistence();
  const [stats, setStats] = useState({
    objectiveScore: 0,
    strScore: 0,
    engagement: 0,
    completion: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      setLoading(true);

      // Fetch user's assigned modules
      const { data: assignments } = await supabase
        .from('user_module_assignments')
        .select('*, modules(*)')
        .eq('user_id', user?.id);

      if (assignments) {
        const completed = assignments.filter(a => a.completed_at).length;
        const total = assignments.length;
        const completionRate = total > 0 ? (completed / total) * 100 : 0;

        setStats({
          objectiveScore: 88,
          strScore: 92,
          engagement: 78,
          completion: Math.round(completionRate),
        });
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

  // Mock chart data
  const performanceData = [
    { name: 'Week 1', score: 75 },
    { name: 'Week 2', score: 82 },
    { name: 'Week 3', score: 78 },
    { name: 'Week 4', score: 88 },
    { name: 'Week 5', score: 92 },
  ];

  if (loading) {
    return (
      <DashboardLayout role="user">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading dashboard...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="user">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {user?.email?.split('@')[0] || 'User'}</p>
          </div>
          <Button onClick={() => navigate('/lynq-library')} variant="outline">
            View All Modules
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Objective Score"
            value={`${stats.objectiveScore}%`}
            icon={Target}
            trend={{ value: 12, positive: true }}
          />
          <StatCard
            title="STR Score"
            value={stats.strScore}
            icon={TrendingUp}
            trend={{ value: 5, positive: true }}
          />
          <StatCard
            title="Engagement"
            value={`${stats.engagement}%`}
            icon={Sparkles}
            trend={{ value: 3, positive: false }}
          />
          <StatCard
            title="Completion"
            value={`${stats.completion}%`}
            icon={Clock}
            trend={{ value: 8, positive: true }}
          />
        </div>

        {/* AI Insights & Performance Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-semibold">AI Strategic Insights</CardTitle>
                <Button size="sm" className="ml-auto">
                  Generate Analysis
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <p>Click generate to receive a deep-dive analysis of your module</p>
                  <p>performance using our multi-agent AI system.</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <StatCard
              title="Avg Rating"
              value="4.8"
              trend={{ value: 2, positive: false }}
            />
            <StatCard
              title="Time Saved"
              value="12h"
              trend={{ value: 12, positive: true }}
            />
          </div>
        </div>

        {/* Performance Chart */}
        <DashboardChart
          title="Performance Trend"
          data={performanceData}
          type="area"
          dataKeys={['score']}
          colors={['hsl(var(--primary))']}
          height={250}
        />
      </div>
    </DashboardLayout>
  );
};

export default UserDashboardNew;
