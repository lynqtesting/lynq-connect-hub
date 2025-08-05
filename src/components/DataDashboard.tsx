import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Star, Monitor, Tablet, Smartphone, TrendingUp, Users, Eye } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const activityData = [
  { day: 'Day 1', opened: 10 },
  { day: 'Day 2', opened: 25 },
  { day: 'Day 3', opened: 45 },
  { day: 'Day 4', opened: 75 },
  { day: 'Day 5', opened: 150 },
  { day: 'Day 6', opened: 120 },
  { day: 'Day 7', opened: 30 },
  { day: 'Day 8', opened: 100 },
  { day: 'Day 9', opened: 85 },
  { day: 'Day 10', opened: 95 },
  { day: 'Day 11', opened: 60 },
  { day: 'Day 12', opened: 40 },
  { day: 'Day 13', opened: 55 },
  { day: 'Day 14', opened: 25 },
  { day: 'Day 15', opened: 35 },
  { day: 'Day 16', opened: 45 },
  { day: 'Day 17', opened: 30 },
  { day: 'Day 18', opened: 40 },
];

const ratingData = [
  { stars: 2, percentage: 0, learners: 5, color: '#ef4444' },
  { stars: 3, percentage: 2, learners: 44, color: '#f97316' },
  { stars: 4, percentage: 11, learners: 235, color: '#eab308' },
  { stars: 5, percentage: 83, learners: 1785, color: '#22c55e' },
];

const deviceData = [
  { name: 'Mobile', value: 2176, icon: Smartphone, color: '#3b82f6' },
  { name: 'Desktop', value: 239, icon: Monitor, color: '#8b5cf6' },
  { name: 'Tablet', value: 101, icon: Tablet, color: '#10b981' },
];

interface AnimatedNumberProps {
  value: number;
  duration?: number;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, duration = 2000 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationId: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      setDisplayValue(Math.floor(progress * value));
      
      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [value, duration]);

  return <span>{displayValue.toLocaleString()}</span>;
};

export const DataDashboard: React.FC = () => {
  const [openingProgress, setOpeningProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setOpeningProgress(79), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full h-full">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Statistics</h2>
        <p className="text-xs sm:text-sm text-muted-foreground font-medium">PROFIT MODULES</p>
      </div>

      <Tabs defaultValue="highlights" className="w-full h-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="highlights" className="text-xs sm:text-sm font-medium">Highlights</TabsTrigger>
          <TabsTrigger value="learners" className="text-xs sm:text-sm">Learners</TabsTrigger>
          <TabsTrigger value="responses" className="text-xs sm:text-sm">Responses</TabsTrigger>
        </TabsList>

        <TabsContent value="highlights" className="h-[calc(100vh-12rem)] overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-4 sm:space-y-6 pr-4">
            {/* General Stats */}
            <Card className="animate-scale-in">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold text-foreground">
                      <AnimatedNumber value={30} /> cards
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Created on Dec 4, 2024</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Shared on Dec 8, 2024</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2">All learners</p>
                    <p className="text-3xl sm:text-4xl font-bold text-foreground flex items-center gap-2">
                      <AnimatedNumber value={3313} />
                      <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Opening Rate */}
            <Card className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <CardContent className="pt-4 sm:pt-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-base sm:text-lg font-medium">Opening</span>
                    <span className="text-xl sm:text-2xl font-bold">{openingProgress}%</span>
                  </div>
                  <Progress value={openingProgress} className="h-2 sm:h-3" />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span>Opened</span>
                    <span className="font-bold text-foreground">
                      <AnimatedNumber value={2615} />
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Chart */}
            <Card className="animate-scale-in" style={{ animationDelay: '0.4s' }}>
              <CardHeader className="pb-3">
                <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-base sm:text-lg">
                  Activity
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    Opened
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 sm:h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activityData} margin={{ left: 0, right: 0, top: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="day" hide />
                      <YAxis domain={[0, 150]} fontSize={12} />
                      <Line 
                        type="monotone" 
                        dataKey="opened" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Rating Distribution */}
            <Card className="animate-scale-in" style={{ animationDelay: '0.6s' }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Rating</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ratingData.map((rating, index) => (
                  <div key={rating.stars} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 sm:h-4 sm:w-4 ${
                              i < rating.stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                      <span className="font-medium text-sm sm:text-base">{rating.percentage}%</span>
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        <AnimatedNumber value={rating.learners} duration={2000 + index * 200} /> learners
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Insights */}
            <Card className="animate-scale-in" style={{ animationDelay: '0.8s' }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="text-center p-3 sm:p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-xl sm:text-2xl font-bold text-green-600">
                      <AnimatedNumber value={470} />
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Scored more than 90%</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                    <p className="text-xl sm:text-2xl font-bold text-red-600">
                      <AnimatedNumber value={442} />
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Scored less than 50%</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                    <p className="text-xl sm:text-2xl font-bold text-yellow-600">
                      <AnimatedNumber value={103} />
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Suspiciously fast completion</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Devices */}
            <Card className="animate-scale-in" style={{ animationDelay: '1s' }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Devices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  {deviceData.map((device, index) => {
                    const Icon = device.icon;
                    return (
                      <div key={device.name} className="text-center">
                        <Icon className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2" style={{ color: device.color }} />
                        <p className="font-bold text-sm sm:text-lg">
                          <AnimatedNumber value={device.value} duration={2000 + index * 300} />
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">{device.name}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="learners" className="h-[calc(100vh-12rem)]">
          <ScrollArea className="h-full">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Learner analytics coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="responses" className="h-[calc(100vh-12rem)]">
          <ScrollArea className="h-full">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Response analytics coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};