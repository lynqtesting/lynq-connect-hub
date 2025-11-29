import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INSIGHTS_SYSTEM_PROMPT = `
You are a Senior Data Analyst AI for a Learning Management System (LMS) analytics platform.

Analyze the provided metrics data and generate insights.

STRICT RULES:
- Output MUST be valid JSON only.
- You MUST return exactly this structure:
{
  "dataQuality": { "isValid": boolean, "issues": [] },
  "trends": [{ "metric": string, "direction": "up"|"down"|"stable", "analysis": string }],
  "insights": [max 4 bullet points as strings],
  "callToAction": "1 short actionable sentence",
  "confidence": number between 0-100
}
- NO extra commentary before or after the JSON.
- NO markdown code blocks.
- NO emojis.
- NO greetings.
- NO generic advice.
- ONLY data-driven insights.
- Each insight must be actionable and specific.
- Analyze key metrics, trends, and patterns in the data.
- If performance is excellent, suggest advanced optimization strategies.
- Focus on learning engagement, completion rates, user activity, and module effectiveness.
`;

interface InsightTrend {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  analysis: string;
}

interface DataQuality {
  isValid: boolean;
  issues?: string[];
}

interface InsightOutput {
  dataQuality: DataQuality;
  trends: InsightTrend[];
  insights: string[];
  callToAction: string;
  confidence: number;
}

function validateAndNormalizeOutput(parsed: any): InsightOutput {
  const data = parsed as Record<string, any>;
  
  // Validate dataQuality
  const dataQuality = data.dataQuality as Record<string, any> | undefined;
  const normalizedDataQuality = {
    isValid: typeof dataQuality?.isValid === 'boolean' ? dataQuality.isValid : true,
    issues: Array.isArray(dataQuality?.issues) 
      ? (dataQuality.issues as string[]).filter((i: any) => typeof i === 'string')
      : undefined,
  };
  
  // Validate trends
  const trends: InsightTrend[] = [];
  if (Array.isArray(data.trends)) {
    for (const trend of data.trends) {
      const t = trend as Record<string, any>;
      if (
        typeof t.metric === 'string' &&
        ['up', 'down', 'stable'].includes(t.direction as string) &&
        typeof t.analysis === 'string'
      ) {
        trends.push({
          metric: t.metric,
          direction: t.direction as 'up' | 'down' | 'stable',
          analysis: t.analysis,
        });
      }
    }
  }
  
  // Validate insights (max 4)
  let insights: string[] = [];
  if (Array.isArray(data.insights)) {
    insights = (data.insights as any[])
      .filter((i: any) => typeof i === 'string')
      .slice(0, 4) as string[];
  }
  
  // Ensure at least one insight
  if (insights.length === 0) {
    insights = ['Analysis completed. Review the metrics for detailed information.'];
  }
  
  // Validate callToAction
  const callToAction = typeof data.callToAction === 'string' 
    ? data.callToAction 
    : 'Review the analysis and take appropriate action.';
  
  // Validate confidence (0-100)
  let confidence = 75;
  if (typeof data.confidence === 'number') {
    confidence = Math.max(0, Math.min(100, data.confidence));
  }
  
  return {
    dataQuality: normalizedDataQuality,
    trends,
    insights,
    callToAction,
    confidence,
  };
}

function handleError(error: any): InsightOutput {
  console.error('OpenAI API error:', error);
  
  if (error.message?.includes('API key')) {
    return {
      dataQuality: {
        isValid: false,
        issues: ['API key not configured'],
      },
      trends: [],
      insights: [
        'OpenAI API key is not configured.',
        'Please add OPENAI_API_KEY to Supabase secrets.',
      ],
      callToAction: 'Configure the API key to enable AI insights.',
      confidence: 0,
    };
  }
  
  if (error.message?.includes('401') || error.message?.includes('invalid_api_key')) {
    return {
      dataQuality: {
        isValid: false,
        issues: ['Invalid API key'],
      },
      trends: [],
      insights: [
        'The OpenAI API key is invalid or expired.',
        'Please check your API key in Supabase secrets.',
      ],
      callToAction: 'Update your API key in Supabase settings.',
      confidence: 0,
    };
  }
  
  return {
    dataQuality: {
      isValid: false,
      issues: [error.message || 'Unknown error occurred'],
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { metricsData } = await req.json();
    
    console.log('Generating insights for metrics data');
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in Supabase secrets.');
    }
    
    // Convert data to string if needed
    const metricsString = typeof metricsData === 'string' 
      ? metricsData 
      : JSON.stringify(metricsData, null, 2);

    console.log('Calling OpenAI API...');
    
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: INSIGHTS_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: `Analyze this metrics data and provide insights:\n\n${metricsString}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error response:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    console.log('OpenAI response received, parsing...');
    
    // Parse and validate
    const parsed = JSON.parse(content);
    const result = validateAndNormalizeOutput(parsed);
    
    console.log('Insights generated successfully');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error: any) {
    console.error('Error in generate-insights function:', error);
    const errorResult = handleError(error);
    
    return new Response(JSON.stringify(errorResult), {
      status: error.message?.includes('API key') ? 500 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
