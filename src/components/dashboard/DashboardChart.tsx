import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

interface ChartDataPoint {
  name: string;
  [key: string]: string | number;
}

interface DashboardChartProps {
  title: string;
  data: ChartDataPoint[];
  type?: 'area' | 'bar';
  dataKeys: string[];
  colors?: string[];
  height?: number;
  action?: ReactNode;
}

export function DashboardChart({
  title,
  data,
  type = 'area',
  dataKeys,
  colors = ['hsl(var(--brand))', 'hsl(var(--destructive))'],
  height = 300,
  action,
}: DashboardChartProps) {
  const renderChart = () => {
    if (type === 'area') {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data}>
            <defs>
              {dataKeys.map((key, index) => (
                <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: 'hsl(var(--text-muted))' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(var(--text-muted))' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              wrapperStyle={{ zIndex: 99999 }}
              contentStyle={{
                backgroundColor: 'hsl(var(--bg-surface))',
                border: '1px solid hsl(var(--border-default))',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'hsl(var(--text-primary))',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
              }}
            />
            <Legend
              wrapperStyle={{
                fontSize: '12px',
                color: 'hsl(var(--text-secondary))',
              }}
            />
            {dataKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                fillOpacity={1}
                fill={`url(#gradient-${key})`}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: 'hsl(var(--text-muted))' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'hsl(var(--text-muted))' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            wrapperStyle={{ zIndex: 99999 }}
            contentStyle={{
              backgroundColor: 'hsl(var(--bg-surface))',
              border: '1px solid hsl(var(--border-default))',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'hsl(var(--text-primary))',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            }}
          />
          <Legend
            wrapperStyle={{
              fontSize: '12px',
              color: 'hsl(var(--text-secondary))',
            }}
          />
          {dataKeys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              fill={colors[index % colors.length]}
              radius={[4, 4, 0, 0]}
              barSize={40}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card className="bg-bg-surface border-border-default hover:shadow-md transition-all">
      <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
        <CardTitle className="text-base sm:text-lg font-semibold text-text-primary">{title}</CardTitle>
        {action && <div>{action}</div>}
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">{renderChart()}</CardContent>
    </Card>
  );
}
