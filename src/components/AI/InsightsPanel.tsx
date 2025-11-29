import { useState } from 'react';
import { Sparkles, TrendingUp, TrendingDown, Minus, Zap, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { generateAIInsights, type InsightOutput } from '@/services/aiService';

interface InsightsPanelProps {
  metricsData?: any;
}

export function InsightsPanel({ metricsData }: InsightsPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<InsightOutput | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await generateAIInsights(metricsData);
      setInsights(result);
      
      // Only show error for configuration issues
      if (result.confidence === 0 && result.dataQuality.issues && result.dataQuality.issues.length > 0) {
        const isConfigError = result.dataQuality.issues.some(
          issue => issue.includes('API key') || issue.includes('configured')
        );
        if (isConfigError) {
          setError('API configuration issue. Please check Supabase secrets.');
        }
      }
    } catch (err) {
      console.error('Generate insights error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    if (direction === 'up') return <TrendingUp className="h-4 w-4" />;
    if (direction === 'down') return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = (direction: 'up' | 'down' | 'stable') => {
    if (direction === 'up') return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-500/30';
    if (direction === 'down') return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-500/30';
    return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-500/30';
  };

  return (
    <div className="col-span-2 md:col-span-4 lg:col-span-8 bg-bg-surface border border-border-default rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-200 min-h-[250px] relative overflow-hidden">
      {/* Subtle Background Gradient (Light Mode Only) */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-transparent dark:from-indigo-900/5 pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20">
              <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-indigo-800 dark:text-indigo-100">
                AI Strategic Insights
              </h3>
              <p className="text-xs text-indigo-500 dark:text-indigo-300/60">
                Powered by AI Analysis
              </p>
            </div>
          </div>

          {insights && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Confidence:</span>
              <div className="flex items-center gap-2 min-w-[80px]">
                <Progress value={insights.confidence} className="h-1.5" />
                <span className="text-xs font-bold text-text-primary">{insights.confidence}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Content States */}
        {!insights && !isLoading && !error && (
          <div className="text-center py-8">
            <p className="text-text-muted mb-4">
              Generate AI-powered insights from your module data
            </p>
            <Button onClick={handleGenerate} className="bg-brand hover:bg-brand-hover">
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Analysis
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-brand" />
            <p className="text-text-muted">AI agents analyzing your data...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={handleGenerate} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {insights && (
          <div className="space-y-6">
            {/* Data Quality Warnings */}
            {!insights.dataQuality.isValid && insights.dataQuality.issues.length > 0 && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">
                      Data Quality Issues
                    </p>
                    <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                      {insights.dataQuality.issues.map((issue, i) => (
                        <li key={i}>• {issue}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Trend Indicators */}
            {insights.trends.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {insights.trends.map((trend, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getTrendColor(trend.direction)}`}
                  >
                    {getTrendIcon(trend.direction)}
                    {trend.metric}
                  </span>
                ))}
              </div>
            )}

            {/* Insights List */}
            <div className="space-y-3">
              {insights.insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-3 animate-in fade-in slide-in-from-left" style={{ animationDelay: `${i * 100}ms` }}>
                  <CheckCircle2 className="h-5 w-5 text-brand flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-text-primary">{insight}</p>
                </div>
              ))}
            </div>

            {/* Call to Action */}
            {insights.callToAction && (
              <div className="p-4 bg-brand/5 dark:bg-brand/10 border border-brand/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-brand flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-text-primary mb-1">
                      Recommended Action
                    </p>
                    <p className="text-sm text-text-secondary">
                      {insights.callToAction}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Regenerate Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleGenerate}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Sparkles className="mr-2 h-3 w-3" />
                Regenerate
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
