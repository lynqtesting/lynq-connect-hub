import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Package, Shield, Users, BookOpen, Heart, Search, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useAuthPersistence } from "@/hooks/useAuthPersistence";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { SidePanel } from "@/components/dashboard/SidePanel";
import { ModuleDetailSidebar } from "@/components/dashboard/ModuleDetailSidebar";

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

export default function LynqLibrary() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthPersistence();

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
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading library...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="user">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">My Modules</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Learning resources organized by category
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search modules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Categories Grid */}
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
