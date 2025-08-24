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
  const [users, setUsers] = useState([]);
  const [selectedModules, setSelectedModules] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchModules();
    fetchUsers();
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

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, id')
        .order('username');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    }
  };

  const handleModuleToggle = (moduleId: string) => {
    setSelectedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAssignModules = async () => {
    if (selectedModules.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one module",
        variant: "destructive"
      });
      return;
    }

    if (selectedUsers.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one user",
        variant: "destructive"
      });
      return;
    }

    setAssigning(true);
    try {
      const assignments = [];
      for (const userId of selectedUsers) {
        for (const moduleId of selectedModules) {
          assignments.push({
            user_id: userId,
            module_id: moduleId
          });
        }
      }

      console.log('AssignModules: Creating assignments with user IDs:', selectedUsers);
      console.log('AssignModules: Assignment data:', assignments);

      // Check for existing assignments first
      const { data: existingAssignments, error: checkError } = await supabase
        .from('user_module_assignments')
        .select('user_id, module_id')
        .in('user_id', selectedUsers)
        .in('module_id', selectedModules);

      if (checkError) throw checkError;

      // Filter out existing assignments
      const existingSet = new Set(
        existingAssignments?.map(a => `${a.user_id}-${a.module_id}`) || []
      );
      
      const newAssignments = assignments.filter(
        a => !existingSet.has(`${a.user_id}-${a.module_id}`)
      );

      if (newAssignments.length === 0) {
        toast({
          title: "Info",
          description: "All selected assignments already exist",
          variant: "default"
        });
        setSelectedModules([]);
        setSelectedUsers([]);
        return;
      }

      const { error } = await supabase
        .from('user_module_assignments')
        .insert(newAssignments);

      if (error) throw error;

      const skippedCount = assignments.length - newAssignments.length;
      let message = `Successfully assigned ${selectedModules.length} modules to ${selectedUsers.length} users`;
      
      if (skippedCount > 0) {
        message += ` (${skippedCount} existing assignments skipped)`;
      }

      toast({
        title: "Success",
        description: message
      });

      setSelectedModules([]);
      setSelectedUsers([]);
    } catch (error) {
      console.error('Assignment error:', error);
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
          <CardContent className="space-y-6">
            {modules.length === 0 ? (
              <p className="text-muted-foreground text-center">
                No modules available. Upload some modules first.
              </p>
            ) : users.length === 0 ? (
              <p className="text-muted-foreground text-center">
                No users available. Create some users first.
              </p>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-3">Select Modules:</h3>
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
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Select Users:</h3>
                    <div className="space-y-3">
                       {users.map((user) => (
                         <div key={user.user_id} className="flex items-center space-x-3">
                           <Checkbox
                             checked={selectedUsers.includes(user.user_id)}
                             onCheckedChange={() => handleUserToggle(user.user_id)}
                           />
                           <div className="flex-1">
                             <p className="font-medium">{user.username}</p>
                           </div>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleAssignModules}
                  className="w-full"
                  disabled={assigning || selectedModules.length === 0 || selectedUsers.length === 0}
                >
                  {assigning ? 'Assigning...' : `Assign ${selectedModules.length} modules to ${selectedUsers.length} users`}
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