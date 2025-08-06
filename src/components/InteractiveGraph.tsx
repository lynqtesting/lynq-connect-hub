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

      {/* Network Graph */}
      {data.nodes && (
        <Card className="animate-fade-in" style={{ animationDelay: '500ms' }}>
          <CardContent className="p-6">
            <div className="relative bg-muted/20 rounded-xl p-8 h-96">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
                  </filter>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Connections */}
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
                      stroke="#94a3b8"
                      strokeWidth="2"
                      opacity="0.6"
                      className="animate-fade-in"
                      style={{ animationDelay: `${700 + (index * 100)}ms` }}
                    />
                  );
                })}
                
                {/* Node backgrounds (glow effect) */}
                {data.nodes.map((node, index) => (
                  <circle
                    key={`bg-${node.id}`}
                    cx={node.x}
                    cy={node.y}
                    r="12"
                    fill={node.color}
                    opacity="0.3"
                    className="animate-scale-in"
                    style={{ animationDelay: `${900 + (index * 100)}ms` }}
                  />
                ))}
                
                {/* Main Nodes */}
                {data.nodes.map((node, index) => (
                  <g key={node.id} className="cursor-pointer group">
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="8"
                      fill={node.color}
                      filter="url(#shadow)"
                      className="animate-scale-in group-hover:scale-110 transition-transform duration-200"
                      style={{ animationDelay: `${1000 + (index * 100)}ms` }}
                    />
                    <text
                      x={node.x}
                      y={node.y + 18}
                      textAnchor="middle"
                      fontSize="3"
                      fill="currentColor"
                      className="font-semibold animate-fade-in pointer-events-none"
                      style={{ animationDelay: `${1200 + (index * 100)}ms` }}
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