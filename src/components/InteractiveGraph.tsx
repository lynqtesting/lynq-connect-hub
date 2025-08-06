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
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>{data.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metrics Row */}
        <div className="grid grid-cols-3 gap-4">
          {data.metrics.map((metric, index) => (
            <div 
              key={index}
              className="bg-muted/50 rounded-lg p-3 text-center animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="text-2xl font-bold" style={{ color: metric.color }}>
                {metric.value}
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                {metric.label}
              </div>
            </div>
          ))}
        </div>

        {/* Network Graph */}
        {data.nodes && (
          <div className="relative bg-muted/20 rounded-lg p-4 h-80 overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 100 100">
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
                    strokeWidth="0.5"
                    className="animate-fade-in"
                    style={{ animationDelay: `${(index + 3) * 200}ms` }}
                  />
                );
              })}
              
              {/* Nodes */}
              {data.nodes.map((node, index) => (
                <g key={node.id} className="cursor-pointer hover:opacity-80 transition-opacity">
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="8"
                    fill={node.color}
                    className="animate-scale-in"
                    style={{ animationDelay: `${(index + 6) * 150}ms` }}
                  />
                  <text
                    x={node.x}
                    y={node.y + 12}
                    textAnchor="middle"
                    fontSize="3"
                    fill="currentColor"
                    className="font-semibold animate-fade-in"
                    style={{ animationDelay: `${(index + 9) * 100}ms` }}
                  >
                    {node.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        )}

        {/* Analysis Insights */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Key Insights</h4>
          <div className="space-y-2">
            <Badge variant="destructive" className="animate-fade-in" style={{ animationDelay: '1000ms' }}>
              Cost is the primary barrier to conversion
            </Badge>
            <Badge variant="secondary" className="animate-fade-in" style={{ animationDelay: '1100ms' }}>
              Investment clarity needed for better understanding
            </Badge>
            <Badge variant="outline" className="animate-fade-in" style={{ animationDelay: '1200ms' }}>
              Fund performance concerns require addressing
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};