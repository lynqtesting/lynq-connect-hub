// Mock AI Service for generating insights
// This simulates AI analysis without requiring actual API keys

export interface InsightsData {
  dataQuality: {
    isValid: boolean;
    issues: string[];
  };
  trends: Array<{
    metric: string;
    direction: 'up' | 'down' | 'stable';
    analysis: string;
  }>;
  insights: string[];
  callToAction: string;
  confidence: number;
}

export async function generateMockInsights(metricsData?: any): Promise<InsightsData> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Generate mock insights based on typical patterns
  const insights: InsightsData = {
    dataQuality: {
      isValid: true,
      issues: [],
    },
    trends: [
      {
        metric: 'Engagement Rate',
        direction: 'up',
        analysis: '+12% increase compared to last month',
      },
      {
        metric: 'Completion Rate',
        direction: 'up',
        analysis: '+8% improvement in module completions',
      },
      {
        metric: 'Response Time',
        direction: 'down',
        analysis: '-15% reduction in average response time',
      },
    ],
    insights: [
      'Your objective score has increased by 12% this quarter, indicating strong engagement with learning materials.',
      'West region shows the highest performance at $142K STR, suggesting effective training adoption.',
      'Price concerns represent 45% of client objections, recommending enhanced value proposition training.',
      'Advanced features show 38% confusion rate, consider additional micro-learning modules for complex topics.',
    ],
    callToAction: 'Focus on addressing price objections through value-based selling training and create targeted content for advanced feature adoption.',
    confidence: 87,
  };

  // Randomly adjust confidence
  insights.confidence = Math.floor(Math.random() * 15) + 75; // 75-90%

  return insights;
}

export function validateMetricsData(data: any): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!data) {
    issues.push('No data provided for analysis');
    return { isValid: false, issues };
  }

  // Add validation logic as needed
  if (data.objectiveScore === 0) {
    issues.push('Objective score appears to be zero, data may be incomplete');
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
