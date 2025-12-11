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

export interface RateLimitInfo {
  isRateLimited: boolean;
  limit?: number;
  used?: number;
  resetsAt?: string;
}

/**
 * Generates AI-powered insights from metrics data using OpenAI via Supabase Edge Function
 */
export async function generateAIInsights(metricsData: unknown): Promise<InsightOutput & { rateLimitInfo?: RateLimitInfo }> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-insights', {
      body: { metricsData },
    });

    if (error) {
      // Check for rate limit error (429)
      const errorContext = error.context as { status?: number; body?: string } | undefined;
      
      if (errorContext?.status === 429) {
        let rateLimitDetails = { limit: 10, used: 10, resetsAt: 'midnight UTC' };
        
        try {
          if (errorContext?.body) {
            const parsed = JSON.parse(errorContext.body);
            rateLimitDetails = {
              limit: parsed.limit || 10,
              used: parsed.used || 10,
              resetsAt: parsed.resetsAt || 'midnight UTC'
            };
          }
        } catch {
          // Use defaults if parsing fails
        }
        
        return {
          dataQuality: { isValid: false, issues: ['Rate limit exceeded'] },
          trends: [],
          insights: [
            `You have reached your daily limit of ${rateLimitDetails.limit} AI insight requests.`,
            'Your limit will reset at midnight UTC.',
            'Please try again tomorrow.'
          ],
          callToAction: 'Wait until tomorrow to generate more insights.',
          confidence: 0,
          rateLimitInfo: {
            isRateLimited: true,
            limit: rateLimitDetails.limit,
            used: rateLimitDetails.used,
            resetsAt: rateLimitDetails.resetsAt
          }
        };
      }

      // Check for authentication error (401)
      if (errorContext?.status === 401) {
        return {
          dataQuality: { isValid: false, issues: ['Authentication required'] },
          trends: [],
          insights: [
            'You must be logged in to generate AI insights.',
            'Please sign in and try again.'
          ],
          callToAction: 'Sign in to use AI insights.',
          confidence: 0
        };
      }

      throw new Error(error.message || 'Failed to generate insights');
    }

    if (!data) {
      throw new Error('No data returned from edge function');
    }

    return data as InsightOutput;
    
  } catch (error) {
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
