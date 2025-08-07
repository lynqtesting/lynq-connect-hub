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
          <div className="relative bg-gradient-to-br from-background to-muted/30 rounded-xl p-8 shadow-lg border border-border/50">
            {/* Grid Lines */}
            <div className="absolute inset-8 pointer-events-none">
              {[0, 10, 20, 30, 40, 50, 60, 70].map((line, idx) => (
                <div 
                  key={idx}
                  className="absolute w-full border-t border-muted/20"
                  style={{ bottom: `${(line / 70) * 100}%` }}
                />
              ))}
            </div>
            
            <div className="flex items-end justify-between h-80 relative px-8">
              {objectionData.metrics.map((metric, index) => {
                const maxValue = 70; // Fixed max value based on your reference
                const height = (metric.value / maxValue) * 100;
                
                return (
                  <div key={index} className="flex flex-col items-center flex-1 mx-1 group">
                    {/* Value Label on Top */}
                    <div 
                      className="text-sm font-bold mb-2 opacity-0 animate-fade-in transition-all duration-300 group-hover:scale-110"
                      style={{ 
                        color: metric.color,
                        animationDelay: `${1000 + (index * 150)}ms`,
                        animationFillMode: 'forwards'
                      }}
                    >
                      {metric.value}
                    </div>
                    
                    {/* Bar Container */}
                    <div className="relative w-full max-w-12">
                      {/* Bar Shadow */}
                      <div 
                        className="absolute inset-0 rounded-t-lg opacity-20 blur-sm"
                        style={{
                          backgroundColor: metric.color,
                          height: `${height}%`,
                          transform: 'scaleY(0) translateY(4px)',
                          transformOrigin: 'bottom',
                          animation: `scaleY 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
                          animationDelay: `${500 + (index * 150)}ms`
                        }}
                      />
                      
                      {/* Main Bar */}
                      <div 
                        className="relative rounded-t-lg transition-all duration-300 group-hover:scale-105 cursor-pointer"
                        style={{
                          background: metric.color,
                          height: `${height}%`,
                          transform: 'scaleY(0)',
                          transformOrigin: 'bottom',
                          animation: `scaleY 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
                          animationDelay: `${600 + (index * 150)}ms`,
                          boxShadow: `0 -4px 20px ${metric.color}30, inset 0 1px 0 rgba(255,255,255,0.2)`
                        }}
                      >
                        {/* Highlight Effect */}
                        <div 
                          className="absolute top-0 left-0 w-full h-8 rounded-t-lg opacity-30"
                          style={{
                            background: `linear-gradient(to bottom, rgba(255,255,255,0.6), transparent)`
                          }}
                        />
                        
                        {/* Pulse Animation on Hover */}
                        <div 
                          className="absolute inset-0 rounded-t-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                          style={{
                            background: `linear-gradient(45deg, transparent, ${metric.color}, transparent)`,
                            animation: 'pulse 2s infinite'
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Label at Bottom */}
                    <div className="text-xs font-medium text-center mt-4 px-1 leading-tight text-muted-foreground max-w-20 opacity-0 animate-fade-in"
                         style={{ 
                           animationDelay: `${1200 + (index * 150)}ms`,
                           animationFillMode: 'forwards'
                         }}>
                      {metric.label}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Y-Axis Labels */}
            <div className="absolute left-2 top-6 bottom-16 flex flex-col justify-between text-xs text-muted-foreground">
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