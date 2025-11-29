import { supabase } from '@/integrations/supabase/client';

export interface InsightTrend {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  analysis: string;
}

export interface DataQuality {
  isValid: boolean;
  issues?: string[];
}

export interface InsightOutput {
  dataQuality: DataQuality;
  trends: InsightTrend[];
  insights: string[];
  callToAction: string;
  confidence: number;
}

/**
 * Generates AI-powered insights from metrics data using OpenAI via Supabase Edge Function
 */
export async function generateAIInsights(metricsData: unknown): Promise<InsightOutput> {
  try {
    console.log('Calling generate-insights edge function...');
    
    const { data, error } = await supabase.functions.invoke('generate-insights', {
      body: { metricsData },
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to generate insights');
    }

    if (!data) {
      throw new Error('No data returned from edge function');
    }

    console.log('Insights generated successfully');
    return data as InsightOutput;
    
  } catch (error) {
    console.error('AI service error:', error);
    
    // Return user-friendly error structure
    return {
      dataQuality: {
        isValid: false,
        issues: [error instanceof Error ? error.message : 'Unknown error occurred'],
      },
      trends: [],
      insights: [
        'Unable to generate insights at this time.',
        'Please check your connection and try again.',
      ],
      callToAction: 'Retry the analysis or contact support if the issue persists.',
      confidence: 0,
    };
  }
}

/**
 * Formats the insight output for display
 */
export function formatInsightsForDisplay(output: InsightOutput): {
  healthStatus: 'excellent' | 'good' | 'warning' | 'error';
  healthColor: string;
  confidenceLabel: string;
} {
  let healthStatus: 'excellent' | 'good' | 'warning' | 'error';
  let healthColor: string;
  
  if (!output.dataQuality.isValid || output.confidence === 0) {
    healthStatus = 'error';
    healthColor = 'text-red-500';
  } else if (output.confidence >= 80) {
    healthStatus = 'excellent';
    healthColor = 'text-emerald-500';
  } else if (output.confidence >= 60) {
    healthStatus = 'good';
    healthColor = 'text-blue-500';
  } else {
    healthStatus = 'warning';
    healthColor = 'text-yellow-500';
  }
  
  let confidenceLabel: string;
  if (output.confidence >= 80) {
    confidenceLabel = 'High Confidence';
  } else if (output.confidence >= 60) {
    confidenceLabel = 'Moderate Confidence';
  } else if (output.confidence > 0) {
    confidenceLabel = 'Low Confidence';
  } else {
    confidenceLabel = 'Analysis Failed';
  }
  
  return {
    healthStatus,
    healthColor,
    confidenceLabel,
  };
}

/**
 * Validates metrics data before sending to AI
 */
export function validateMetricsData(data: any): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!data) {
    issues.push('No data provided for analysis');
    return { isValid: false, issues };
  }

  // Check if data has meaningful content
  if (typeof data === 'object') {
    const keys = Object.keys(data);
    if (keys.length === 0) {
      issues.push('Data object is empty');
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
