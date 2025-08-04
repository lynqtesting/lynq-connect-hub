import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Package, Shield, Users, BookOpen, Heart, Search, X } from "lucide-react";
import { toast } from "sonner";

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

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setModules(data || []);
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
      
      // Check if category name matches
      if (category.toLowerCase().includes(searchTerm.toLowerCase())) return true;
      
      // Check if any modules in category match
      return getModulesByCategory(category).length > 0;
    });
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setModalOpen(true);
  };

  const handleModuleClick = (moduleId: string) => {
    navigate(`/module/${moduleId}`);
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
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-foreground">LYNQ Library</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Learning resources organized by category</p>
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
      <div className="px-4 py-4 pb-8">
        <div className="grid grid-cols-2 gap-3">
          {getFilteredCategories().map((category) => {
            const categoryInfo = categoryData[category as keyof typeof categoryData];
            const Icon = categoryInfo.icon;
            const moduleCount = getModulesByCategory(category).length;

            return (
              <Card key={category} className="overflow-hidden">
                <Button
                  variant="ghost"
                  onClick={() => handleCategoryClick(category)}
                  className="w-full p-4 h-auto flex flex-col items-center space-y-3 hover:bg-muted/50"
                >
                  <div className={`w-12 h-12 ${categoryInfo.bgColor} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${categoryInfo.textColor}`} />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-foreground text-sm mb-1">{category}</h3>
                    <p className="text-xs text-muted-foreground leading-tight">
                      {category === 'Product' && 'Product knowledge & features'}
                      {category === 'Compliance' && 'Regulatory & policy guidelines'}
                      {category === 'Soft Skills' && 'Communication & leadership'}
                      {category === 'Customer Awareness' && 'Customer service & relations'}
                    </p>
                    <Badge variant="secondary" className={`mt-2 text-xs ${categoryInfo.badgeColor}`}>
                      {moduleCount} Lynqs
                    </Badge>
                  </div>
                </Button>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Module Details Modal */}
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
            {selectedCategory && getModulesByCategory(selectedCategory).map((module) => (
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
              </Card>
            ))}
            {selectedCategory && getModulesByCategory(selectedCategory).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No modules found in this category</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}