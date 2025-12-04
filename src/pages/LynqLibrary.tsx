import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Package, Shield, Users, BookOpen, Heart, Search, ArrowRight, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useAuthPersistence } from "@/hooks/useAuthPersistence";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { SidePanel } from "@/components/dashboard/SidePanel";
import { ModuleDetailSidebar } from "@/components/dashboard/ModuleDetailSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from 'framer-motion';

interface Module {
  id: string;
  title: string;
  description: string;
  category: string;
  file_url: string;
  screenshot_url: string;
  created_at: string;
  module_link?: string;
}

const categoryData = {
  'Product': {
    icon: Package,
    description: 'Product knowledge & features',
    bgGradient: 'from-primary/20 to-primary/5',
    iconColor: 'text-primary'
  },
  'Compliance': {
    icon: Shield,
    description: 'Regulatory & policy guidelines',
    bgGradient: 'from-chart-1/20 to-chart-1/5',
    iconColor: 'text-chart-1'
  },
  'Soft Skills': {
    icon: Users,
    description: 'Communication & leadership',
    bgGradient: 'from-chart-2/20 to-chart-2/5',
    iconColor: 'text-chart-2'
  },
  'Customer Awareness': {
    icon: Heart,
    description: 'Customer service & relations',
    bgGradient: 'from-destructive/20 to-destructive/5',
    iconColor: 'text-destructive'
  }
};

// Skeleton for compact mobile module card
function CompactModuleCardSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 bg-bg-surface border border-border-default rounded-xl">
      <div className="w-9 h-9 rounded-lg bg-bg-surface-hover animate-pulse flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="h-4 w-3/4 bg-bg-surface-hover rounded animate-pulse" />
        <div className="h-3 w-1/2 bg-bg-surface-hover rounded animate-pulse" />
      </div>
      <div className="w-4 h-4 bg-bg-surface-hover rounded animate-pulse flex-shrink-0" />
    </div>
  );
}

// Compact mobile module card component
function CompactModuleCard({ module, onClick }: { module: Module; onClick: () => void }) {
  const categoryInfo = categoryData[module.category as keyof typeof categoryData];
  const Icon = categoryInfo?.icon || BookOpen;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center gap-3 p-3 bg-bg-surface border border-border-default rounded-xl hover:bg-bg-surface-hover active:bg-bg-surface-hover transition-colors cursor-pointer touch-manipulation"
    >
      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${categoryInfo?.bgGradient || 'from-primary/20 to-primary/5'} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${categoryInfo?.iconColor || 'text-primary'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">
          {module.title}
        </p>
        <p className="text-[11px] text-text-muted truncate">
          {module.category}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
    </motion.div>
  );
}

export default function LynqLibrary() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthPersistence();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    fetchModules(user.id);
    
    const channel = supabase
      .channel('modules-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'modules'
        },
        () => {
          fetchModules(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, authLoading, navigate]);

  const fetchModules = async (userId: string) => {
    try {
      const { data: assignments, error } = await supabase
        .from('user_module_assignments')
        .select(`
          module_id,
          modules!user_module_assignments_module_id_fkey (
            id,
            title,
            description,
            category,
            file_url,
            screenshot_url,
            created_at,
            module_link
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;
      
      const assignedModules = assignments?.map(a => a.modules).filter(Boolean) || [];
      setModules(assignedModules as Module[]);
    } catch (error) {
      console.error('Error fetching modules:', error);
      toast.error('Failed to load modules');
    } finally {
      setLoading(false);
    }
  };

  const getModulesByCategory = (category: string) => {
    return modules.filter(module => 
      module.category === category &&
      (searchTerm === '' || 
       module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
       module.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const getFilteredCategories = () => {
    return Object.keys(categoryData).filter(category => {
      if (searchTerm === '') return true;
      if (category.toLowerCase().includes(searchTerm.toLowerCase())) return true;
      return getModulesByCategory(category).length > 0;
    });
  };

  const getAllFilteredModules = () => {
    return modules.filter(module => 
      searchTerm === '' || 
      module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleModuleClick = (module: Module) => {
    if (!module.id || module.id === 'undefined' || module.id === 'null') {
      toast.error('Invalid module selected');
      return;
    }
    setSelectedModule(module);
  };

  if (loading) {
    return (
      <DashboardLayout role="user">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1 sm:mb-2">My Modules</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Loading modules...</p>
        </div>

        {/* Search Bar Skeleton */}
        <div className="mb-4 sm:mb-6">
          <div className="relative max-w-md">
            <div className="h-10 w-full bg-bg-surface-hover rounded-md animate-pulse" />
          </div>
        </div>

        {/* Mobile: Skeleton list */}
        {isMobile ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <CompactModuleCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          /* Desktop: Skeleton grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-bg-surface border border-border-default rounded-xl p-6 animate-pulse">
                <div className="w-12 h-12 rounded-lg bg-bg-surface-hover mb-3" />
                <div className="h-5 w-24 bg-bg-surface-hover rounded mb-2" />
                <div className="h-4 w-32 bg-bg-surface-hover rounded mb-4" />
                <div className="h-6 w-16 bg-bg-surface-hover rounded-full mb-4" />
                <div className="space-y-2">
                  <div className="h-16 bg-bg-surface-hover rounded-lg" />
                  <div className="h-16 bg-bg-surface-hover rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="user">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1 sm:mb-2">My Modules</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {modules.length} modules assigned to you
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-4 sm:mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search modules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 touch-manipulation"
          />
        </div>
      </div>

      {/* Mobile: Compact list view */}
      {isMobile ? (
        <div className="space-y-2">
          {getAllFilteredModules().length > 0 ? (
            getAllFilteredModules().map((module) => (
              <CompactModuleCard
                key={module.id}
                module={module}
                onClick={() => handleModuleClick(module)}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Search className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">No modules found</p>
              <p className="text-xs text-muted-foreground">
                Try adjusting your search
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Desktop: Category grid view */
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {getFilteredCategories().map((category) => {
              const categoryInfo = categoryData[category as keyof typeof categoryData];
              const Icon = categoryInfo.icon;
              const moduleCount = getModulesByCategory(category).length;
              const categoryModules = getModulesByCategory(category);

              return (
                <Card key={category} className="hover:shadow-lg transition-all">
                  <CardHeader className="pb-4">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${categoryInfo.bgGradient} flex items-center justify-center mb-3`}>
                      <Icon className={`w-6 h-6 ${categoryInfo.iconColor}`} />
                    </div>
                    <CardTitle className="text-lg">{category}</CardTitle>
                    <CardDescription className="text-sm">
                      {categoryInfo.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="secondary" className="text-xs">
                          {moduleCount} {moduleCount === 1 ? 'Module' : 'Modules'}
                        </Badge>
                      </div>
                      {categoryModules.length > 0 ? (
                        <div className="space-y-2">
                          {categoryModules.slice(0, 3).map((module) => (
                            <div
                              key={module.id}
                              onClick={() => handleModuleClick(module)}
                              className="group p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-all"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                    {module.title}
                                  </p>
                                  {module.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                      {module.description}
                                    </p>
                                  )}
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
                              </div>
                            </div>
                          ))}
                          {categoryModules.length > 3 && (
                            <p className="text-xs text-muted-foreground text-center pt-2">
                              +{categoryModules.length - 3} more
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <BookOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                          <p className="text-xs text-muted-foreground">No modules yet</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {getFilteredCategories().length === 0 && (
            <Card className="mt-8">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">No results found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search terms
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Module Detail Side Panel */}
      <SidePanel
        isOpen={!!selectedModule}
        onClose={() => setSelectedModule(null)}
        title={selectedModule?.title || 'Module Details'}
      >
        {selectedModule && user && (
          <ModuleDetailSidebar module={selectedModule} userId={user.id} />
        )}
      </SidePanel>
    </DashboardLayout>
  );
}
