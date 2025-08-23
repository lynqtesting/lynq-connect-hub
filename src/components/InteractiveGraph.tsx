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
  // Real objection data based on your reference image
  const objectionData = {
    type: "bar",
    title: "Confusion Areas Analysis",
    metrics: [
      { label: "Cost Objection", value: 65, color: "#ef4444" },
      { label: "Investment Confusion", value: 35, color: "#f97316" },
      { label: "Premium Too High", value: 45, color: "#ec4899" },
      { label: "Poor Value Perception", value: 38, color: "#f472b6" },
      { label: "Health & Wealth Mix", value: 28, color: "#facc15" },
      { label: "Fund Performance", value: 22, color: "#eab308" }
    ]
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title with underline */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-foreground mb-2">{objectionData.title}</h3>
        <div className="w-20 h-1 bg-primary mx-auto rounded-full"></div>
      </div>

      {/* Chart Container */}
      <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
        <div className="space-y-6">
          <div className="text-center">
            <h4 className="text-lg font-semibold text-muted-foreground mb-6">Objection Frequency Analysis</h4>
          </div>
          
          {/* Bar Chart */}
          <div className="relative bg-gradient-to-br from-background to-muted/30 rounded-xl p-8 shadow-lg border border-border/50 min-w-[60vw] w-full">
              {/* Chart Container with proper dimensions */}
              <div className="relative h-[500px] ml-24 mr-8 mb-24 mt-8" style={{ pointerEvents: 'none' }}>
                {/* Grid Lines */}
                <div className="absolute inset-0 pointer-events-none">
                  {[0, 10, 20, 30, 40, 50, 60, 70].map((value, idx) => {
                    const position = ((70 - value) / 70) * 100; // Invert for top-down positioning
                    return (
                      <div 
                        key={idx}
                        className="absolute w-full border-t border-muted-foreground/20"
                        style={{ top: `${position}%` }}
                      />
                    );
                  })}
                </div>
                
                {/* Bars Container */}
                <div className="flex items-end justify-between h-full relative gap-6" style={{ pointerEvents: 'auto' }}>
                  {objectionData.metrics.map((metric, index) => {
                    const heightPercentage = (metric.value / 70) * 100; // 70 is max value
                    
                    return (
                      <div key={index} className="flex flex-col items-center w-28 group relative">
                        {/* Percentage Label on Top */}
                        <div 
                          className="text-lg font-bold mb-2 transition-all duration-300 group-hover:scale-110 absolute z-10"
                          style={{ 
                            color: metric.color,
                            top: `${100 - heightPercentage - 12}%`,
                            transform: 'translateY(-100%)',
                            left: '50%',
                            marginLeft: '-12px'
                          }}
                        >
                          {metric.value}%
                        </div>
                        
                        {/* Bar */}
                        <div 
                          className="w-16 rounded-t-lg transition-all duration-300 group-hover:scale-105 relative"
                          style={{
                            backgroundColor: metric.color,
                            height: `${heightPercentage}%`,
                            boxShadow: `0 -2px 10px ${metric.color}40`,
                            pointerEvents: 'none'
                          }}
                        >
                          {/* Highlight Effect */}
                          <div 
                            className="w-full h-3 rounded-t-lg opacity-40"
                            style={{
                              background: `linear-gradient(to bottom, rgba(255,255,255,0.8), transparent)`
                            }}
                          />
                        </div>
                        
                        {/* Label at Bottom - Better spacing and readability */}
                        <div className="text-sm font-medium text-center mt-8 leading-normal text-muted-foreground w-full px-1">
                          {metric.label.length > 12 ? `${metric.label.slice(0, 12)}...` : metric.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            
            {/* Y-Axis Labels */}
            <div className="absolute left-1 top-6 h-80 flex flex-col justify-between text-xs text-muted-foreground">
              {[70, 60, 50, 40, 30, 20, 10, 0].map(value => (
                <span key={value}>{value}</span>
              ))}
            </div>
            
            {/* X-Axis Label */}
            <div className="text-center mt-2">
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