import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users } from 'lucide-react';

const AssignModules = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [modules, setModules] = useState([]);
  const [selectedModules, setSelectedModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

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
      toast({
        title: "Error",
        description: "Failed to fetch modules",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModuleToggle = (moduleId: string) => {
    setSelectedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleAssignToAll = async () => {
    if (selectedModules.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one module",
        variant: "destructive"
      });
      return;
    }

    setAssigning(true);
    try {
      // For demo purposes, we'll create a placeholder user assignment
      // In a real app, you'd have a user selection interface
      const assignments = selectedModules.map(moduleId => ({
        user_id: '00000000-0000-0000-0000-000000000000', // Placeholder
        module_id: moduleId
      }));

      const { error } = await supabase
        .from('user_module_assignments')
        .insert(assignments);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Assigned ${selectedModules.length} modules to users`
      });

      setSelectedModules([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign modules",
        variant: "destructive"
      });
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center">Loading modules...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/admin-dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Assign Modules to Users
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {modules.length === 0 ? (
              <p className="text-muted-foreground text-center">
                No modules available. Upload some modules first.
              </p>
            ) : (
              <>
                <div className="space-y-3">
                  {modules.map((module) => (
                    <div key={module.id} className="flex items-center space-x-3">
                      <Checkbox
                        checked={selectedModules.includes(module.id)}
                        onCheckedChange={() => handleModuleToggle(module.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{module.title}</p>
                        {module.description && (
                          <p className="text-sm text-muted-foreground">
                            {module.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={handleAssignToAll}
                  className="w-full"
                  disabled={assigning || selectedModules.length === 0}
                >
                  {assigning ? 'Assigning...' : `Assign Selected (${selectedModules.length})`}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssignModules;