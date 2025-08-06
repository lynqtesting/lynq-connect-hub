import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="space-y-4">
      {/* Enhanced Header */}
      <div className="text-center pb-2">
        <h3 className="text-xl font-bold animate-fade-in">{data.title}</h3>
        <div className="h-1 w-20 bg-gradient-to-r from-primary to-primary/50 mx-auto mt-2 rounded-full animate-scale-in" 
             style={{ animationDelay: '200ms' }} />
      </div>

      {/* Enhanced Metrics with Pulse Animation */}
      <div className="grid grid-cols-3 gap-3">
        {data.metrics.map((metric, index) => (
          <Card 
            key={index}
            className="relative overflow-hidden animate-scale-in hover-scale transition-all duration-300"
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <CardContent className="p-3 text-center relative">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5 rounded-lg" />
              <div 
                className="text-2xl font-bold mb-1 animate-fade-in" 
                style={{ 
                  color: metric.color,
                  animationDelay: `${(index * 150) + 300}ms`,
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {metric.value}
              </div>
              <div className="text-xs text-muted-foreground font-medium leading-tight">
                {metric.label}
              </div>
              {index === 0 && (
                <div className="absolute top-1 right-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Network Graph with Better Animations */}
      {data.nodes && (
        <Card className="animate-fade-in" style={{ animationDelay: '500ms' }}>
          <CardContent className="p-4">
            <div className="relative bg-gradient-to-br from-muted/30 to-muted/60 rounded-xl p-6 h-80 overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                  <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.3"/>
                    <stop offset="50%" stopColor="#64748b" stopOpacity="0.6"/>
                    <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.3"/>
                  </linearGradient>
                </defs>
                
                {/* Enhanced Connections with Gradient */}
                {data.connections?.map((connection, index) => {
                  const fromNode = data.nodes?.find(n => n.id === connection.from);
                  const toNode = data.nodes?.find(n => n.id === connection.to);
                  if (!fromNode || !toNode) return null;
                  
                  return (
                    <line
                      key={index}
                      x1={fromNode.x}
                      y1={fromNode.y}
                      x2={toNode.x}
                      y2={toNode.y}
                      stroke="url(#connectionGradient)"
                      strokeWidth="1"
                      className="animate-fade-in"
                      style={{ 
                        animationDelay: `${600 + (index * 200)}ms`,
                        strokeDasharray: '100',
                        strokeDashoffset: '100',
                        animation: `fadeIn 0.3s ease-out ${600 + (index * 200)}ms forwards, drawLine 1s ease-out ${800 + (index * 200)}ms forwards`
                      }}
                    />
                  );
                })}
                
                {/* Enhanced Nodes with Glow Effect */}
                {data.nodes.map((node, index) => (
                  <g key={node.id} className="cursor-pointer group">
                    {/* Node Glow Background */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="12"
                      fill={node.color}
                      opacity="0.2"
                      className="animate-scale-in group-hover:animate-pulse"
                      style={{ animationDelay: `${1000 + (index * 100)}ms` }}
                    />
                    {/* Main Node */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="8"
                      fill={node.color}
                      filter="url(#glow)"
                      className="animate-scale-in group-hover:scale-110 transition-transform duration-200"
                      style={{ animationDelay: `${1000 + (index * 100)}ms` }}
                    />
                    {/* Node Label */}
                    <text
                      x={node.x}
                      y={node.y + 15}
                      textAnchor="middle"
                      fontSize="2.5"
                      fill="currentColor"
                      className="font-bold animate-fade-in pointer-events-none"
                      style={{ 
                        animationDelay: `${1200 + (index * 100)}ms`,
                        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
                      }}
                    >
                      {node.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Key Insights with Staggered Animation */}
      <Card className="animate-fade-in" style={{ animationDelay: '1400ms' }}>
        <CardContent className="p-4">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            🎯 Key Insights
          </h4>
          <div className="space-y-3">
            <div className="animate-fade-in" style={{ animationDelay: '1600ms' }}>
              <Badge variant="destructive" className="w-full justify-start p-3 text-left hover-scale">
                <div className="w-2 h-2 bg-white rounded-full mr-3 animate-pulse" />
                <div>
                  <div className="font-medium">Primary Cost Barrier</div>
                  <div className="text-xs opacity-90">"Too much cost" - frequently mentioned by prospects</div>
                </div>
              </Badge>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '1800ms' }}>
              <Badge variant="secondary" className="w-full justify-start p-3 text-left hover-scale">
                <div className="w-2 h-2 bg-primary rounded-full mr-3 animate-pulse" />
                <div>
                  <div className="font-medium">Investment Clarity</div>
                  <div className="text-xs opacity-90">Confusion about "health and wealth" combination</div>
                </div>
              </Badge>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '2000ms' }}>
              <Badge variant="outline" className="w-full justify-start p-3 text-left hover-scale">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-3 animate-pulse" />
                <div>
                  <div className="font-medium">Performance Concerns</div>
                  <div className="text-xs opacity-90">Worries about fund performance and ULIP components</div>
                </div>
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <style>{`
        @keyframes drawLine {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
};