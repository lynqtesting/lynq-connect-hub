import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface GraphData {
  type: string;
  title: string;
  metrics: Array<{
    label: string;
    value: string | number;
    color?: string;
  }>;
  nodes?: Array<{
    id: string;
    label: string;
    color: string;
    x: number;
    y: number;
  }>;
  connections?: Array<{
    from: string;
    to: string;
  }>;
}

interface InteractiveGraphProps {
  data: GraphData;
}

export const InteractiveGraph: React.FC<InteractiveGraphProps> = ({ data }) => {
  if (!data) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title with underline */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-foreground mb-2">{data.title}</h3>
        <div className="w-20 h-1 bg-blue-500 mx-auto rounded-full"></div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-3 gap-4">
        {data.metrics.map((metric, index) => (
          <Card 
            key={index}
            className="animate-scale-in hover-scale transition-all duration-300 bg-card border-border"
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <CardContent className="p-4 text-center">
              <div 
                className="text-3xl font-bold mb-2"
                style={{ color: metric.color }}
              >
                {metric.value}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                {metric.label}
              </div>
              {metric.label === "Total Objections" && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bar Chart */}
      <Card className="animate-fade-in" style={{ animationDelay: '500ms' }}>
        <CardContent className="p-10">
          <div className="space-y-8">
            <h4 className="text-2xl font-bold text-center text-foreground">Objection Frequency Analysis</h4>
            
            <div className="space-y-8">
              {data.metrics.map((metric, index) => {
                const maxValue = Math.max(...data.metrics.map(m => typeof m.value === 'number' ? m.value : 0));
                const percentage = typeof metric.value === 'number' ? (metric.value / maxValue) * 100 : 0;
                
                return (
                  <div key={index} className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-foreground">{metric.label}</span>
                      <span className="text-xl font-bold px-4 py-2 rounded-lg" 
                            style={{ 
                              color: metric.color,
                              backgroundColor: `${metric.color}20`
                            }}>
                        {metric.value}
                      </span>
                    </div>
                    <div className="relative h-16 bg-muted/30 rounded-2xl overflow-hidden shadow-inner">
                      <div
                        className="h-full rounded-2xl transition-all duration-2000 ease-out animate-scale-in shadow-lg"
                        style={{
                          backgroundColor: metric.color,
                          width: `${percentage}%`,
                          animationDelay: `${800 + (index * 300)}ms`,
                          backgroundImage: `linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.2) 75%, transparent 75%, transparent)`,
                          backgroundSize: '20px 20px'
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-foreground drop-shadow-sm">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <div className="space-y-3 animate-fade-in" style={{ animationDelay: '1400ms' }}>
        <h4 className="font-semibold text-base flex items-center gap-2">
          🎯 Key Insights
        </h4>
        <div className="space-y-3">
          <Badge 
            variant="destructive" 
            className="w-full justify-start p-4 text-left hover-scale"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse flex-shrink-0" />
              <div>
                <div className="font-medium text-sm">Primary Cost Barrier</div>
                <div className="text-xs opacity-90 mt-1">"Premium is very high" - major barrier to conversion</div>
              </div>
            </div>
          </Badge>
          
          <Badge 
            variant="secondary" 
            className="w-full justify-start p-4 text-left hover-scale"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse flex-shrink-0" />
              <div>
                <div className="font-medium text-sm">Investment Clarity Needed</div>
                <div className="text-xs opacity-90 mt-1">Confusion about "health and wealth" combo requires addressing</div>
              </div>
            </div>
          </Badge>
          
          <Badge 
            variant="outline" 
            className="w-full justify-start p-4 text-left hover-scale"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse flex-shrink-0" />
              <div>
                <div className="font-medium text-sm">Performance Concerns</div>
                <div className="text-xs opacity-90 mt-1">Fund performance and ULIP component worries</div>
              </div>
            </div>
          </Badge>
        </div>
      </div>
    </div>
  );
};