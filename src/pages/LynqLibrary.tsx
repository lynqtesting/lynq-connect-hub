
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Package, Shield, Users, BookOpen, Heart, Search, X, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuthPersistence } from "@/hooks/useAuthPersistence";

interface Module {
  id: string;
  title: string;
  description: string;
  category: string;
  file_url: string;
  screenshot_url: string;
  created_at: string;
}

const categoryData = {
  'Product': {
    icon: Package,
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
    badgeColor: 'text-blue-600'
  },
  'Compliance': {
    icon: Shield,
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-600',
    badgeColor: 'text-green-600'
  },
  'Soft Skills': {
    icon: Users,
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-600',
    badgeColor: 'text-purple-600'
  },
  'Customer Awareness': {
    icon: Heart,
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-600',
    badgeColor: 'text-red-600'
  }
};

export default function LynqLibrary() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, loading: authLoading } = useAuthPersistence();

  useEffect(() => {
    if (authLoading) return; // wait for auth to resolve
    if (!user) {
      navigate('/login');
      return;
    }

    fetchModules(user.id);
    
    // Set up real-time subscription for module updates
    const channel = supabase
      .channel('modules-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'modules'
        },
        (payload) => {
          console.log('LynqLibrary: Real-time module change detected:', payload);
          // Refresh modules when any module is updated
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
      console.log('LynqLibrary: Fetching modules for user:', userId);

      // Fetch only assigned modules for this user
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
            created_at
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;
      
      console.log('LynqLibrary: Raw assignments data:', assignments);
      
      // Extract modules from assignments
      const assignedModules = assignments?.map(a => a.modules).filter(Boolean) || [];
      console.log('LynqLibrary: Extracted modules:', assignedModules);
      console.log('LynqLibrary: Total module count:', assignedModules.length);
      
      setModules(assignedModules);
    } catch (error) {
      console.error('Error fetching modules:', error);
      toast.error('Failed to load modules');
    } finally {
      setLoading(false);
    }
  };

  const getModulesByCategory = (category: string) => {
    const filteredModules = modules.filter(module => 
      module.category === category &&
      (searchTerm === '' || 
       module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
       module.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    console.log(`LynqLibrary: Modules in ${category}:`, filteredModules);
    return filteredModules;
  };

  const getFilteredCategories = () => {
    return Object.keys(categoryData).filter(category => {
      if (searchTerm === '') return true;
      
      // Check if category name matches
      if (category.toLowerCase().includes(searchTerm.toLowerCase())) return true;
      
      // Check if any modules in category match
      return getModulesByCategory(category).length > 0;
    });
  };

  const handleCategoryClick = (category: string) => {
    console.log('LynqLibrary: Category clicked:', category);
    setSelectedCategory(category);
    setModalOpen(true);
  };

  const handleModuleClick = (moduleId: string) => {
    console.log('LynqLibrary: Module clicked, navigating to:', `/module/${moduleId}`);
    console.log('LynqLibrary: Module ID type:', typeof moduleId);
    
    // Ensure we have a valid module ID
    if (!moduleId || moduleId === 'undefined' || moduleId === 'null') {
      console.error('LynqLibrary: Invalid module ID:', moduleId);
      toast.error('Invalid module selected');
      return;
    }
    
    // Close modal first
    setModalOpen(false);
    
    // Navigate to module details
    navigate(`/module/${moduleId}`);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">LYNQ Library</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Learning resources organized by category</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3 bg-card border-b sticky top-16 z-10">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search Lynqs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-muted border-0 focus:bg-card"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="px-3 py-4 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {getFilteredCategories().map((category) => {
            const categoryInfo = categoryData[category as keyof typeof categoryData];
            const Icon = categoryInfo.icon;
            const moduleCount = getModulesByCategory(category).length;

            return (
              <Card key={category} className="overflow-hidden">
                <Button
                  variant="ghost"
                  onClick={() => handleCategoryClick(category)}
                  className="w-full p-6 h-auto flex flex-col items-center space-y-4 hover:bg-muted/50 min-h-[140px]"
                >
                  <div className={`w-16 h-16 ${categoryInfo.bgColor} rounded-2xl flex items-center justify-center`}>
                    <Icon className={`w-8 h-8 ${categoryInfo.textColor}`} />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="font-semibold text-foreground text-base leading-tight">{category}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed px-2">
                      {category === 'Product' && 'Product knowledge & features'}
                      {category === 'Compliance' && 'Regulatory & policy guidelines'}
                      {category === 'Soft Skills' && 'Communication & leadership'}
                      {category === 'Customer Awareness' && 'Customer service & relations'}
                    </p>
                    <Badge variant="secondary" className={`mt-3 text-sm ${categoryInfo.badgeColor} px-3 py-1`}>
                      {moduleCount} Lynqs
                    </Badge>
                  </div>
                </Button>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Module Details Modal/Drawer */}
      {isMobile ? (
        <Drawer open={modalOpen} onOpenChange={setModalOpen}>
          <DrawerContent>
            <DrawerHeader className="pb-4">
              <div className="flex items-center justify-between">
                <DrawerTitle>{selectedCategory}</DrawerTitle>
                <DrawerClose asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <X className="h-4 w-4" />
                  </Button>
                </DrawerClose>
              </div>
            </DrawerHeader>
            <div className="px-4 pb-8 max-h-[60vh] overflow-y-auto space-y-3">
              {selectedCategory && getModulesByCategory(selectedCategory).map((module) => {
                console.log('LynqLibrary: Rendering module in drawer:', module);
                return (
                  <Card
                    key={module.id}
                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors active:bg-muted"
                    onClick={() => handleModuleClick(module.id)}
                  >
                    <div className="font-medium text-foreground text-sm leading-tight">
                      {module.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 leading-tight">
                      {module.description}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      ID: {module.id}
                    </div>
                  </Card>
                );
              })}
              {selectedCategory && getModulesByCategory(selectedCategory).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No modules found in this category</p>
                </div>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-h-[80vh] overflow-hidden">
            <DialogHeader className="flex flex-row items-center justify-between">
              <DialogTitle>{selectedCategory}</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setModalOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[60vh] space-y-3">
              {selectedCategory && getModulesByCategory(selectedCategory).map((module) => {
                console.log('LynqLibrary: Rendering module in modal:', module);
                return (
                  <Card
                    key={module.id}
                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleModuleClick(module.id)}
                  >
                    <div className="font-medium text-foreground text-sm leading-tight">
                      {module.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 leading-tight">
                      {module.description}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      ID: {module.id}
                    </div>
                  </Card>
                );
              })}
              {selectedCategory && getModulesByCategory(selectedCategory).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No modules found in this category</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
