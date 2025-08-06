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
        <div className="w-20 h-1 bg-primary mx-auto rounded-full"></div>
      </div>

      {/* Chart Container */}
      <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
        <div className="space-y-6">
          <div className="text-center">
            <h4 className="text-lg font-semibold text-muted-foreground mb-6">Objection Frequency Analysis</h4>
          </div>
          
          {/* Bar Chart */}
          <div className="relative">
            <div className="flex items-end justify-between h-80 bg-muted/10 rounded-lg p-6">
              {data.metrics.map((metric, index) => {
                const maxValue = Math.max(...data.metrics.map(m => typeof m.value === 'number' ? m.value : 0));
                const height = typeof metric.value === 'number' ? (metric.value / maxValue) * 100 : 0;
                
                return (
                  <div key={index} className="flex flex-col items-center flex-1 mx-2">
                    {/* Value Label on Top */}
                    <div 
                      className="text-sm font-bold mb-2 opacity-0 animate-fade-in"
                      style={{ 
                        color: metric.color,
                        animationDelay: `${1000 + (index * 200)}ms`,
                        animationFillMode: 'forwards'
                      }}
                    >
                      {metric.value}
                    </div>
                    
                    {/* Bar */}
                    <div 
                      className="w-full bg-gradient-to-t rounded-t-lg transition-all duration-1000 ease-out"
                      style={{
                        backgroundColor: metric.color,
                        height: `${height}%`,
                        backgroundImage: `linear-gradient(to top, ${metric.color}, ${metric.color}dd)`,
                        transform: 'scaleY(0)',
                        transformOrigin: 'bottom',
                        animation: 'scaleY 1s ease-out forwards',
                        animationDelay: `${600 + (index * 200)}ms`
                      }}
                    />
                    
                    {/* Label at Bottom */}
                    <div className="text-xs font-medium text-center mt-3 px-1 leading-tight text-muted-foreground">
                      {metric.label}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Y-Axis Labels */}
            <div className="absolute left-0 top-6 bottom-16 flex flex-col justify-between text-xs text-muted-foreground">
              <span>70</span>
              <span>60</span>
              <span>50</span>
              <span>40</span>
              <span>30</span>
              <span>20</span>
              <span>10</span>
              <span>0</span>
            </div>
            
            {/* X-Axis Label */}
            <div className="text-center mt-4">
              <span className="text-sm font-medium text-muted-foreground">Objection Types</span>
            </div>
          </div>
        </div>
      </div>

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