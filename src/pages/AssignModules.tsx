import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, Plus, Minus, Trash2 } from 'lucide-react';

const AssignModules = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [modules, setModules] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedModules, setSelectedModules] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [currentAssignments, setCurrentAssignments] = useState([]);
  const [selectedAssignments, setSelectedAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [unassigning, setUnassigning] = useState(false);

  useEffect(() => {
    fetchModules();
    fetchUsers();
    fetchCurrentAssignments();
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

  const fetchCurrentAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('user_module_assignments')
        .select(`
          id,
          user_id,
          module_id,
          assigned_at,
          profiles!inner(username),
          modules!inner(title, description)
        `)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      setCurrentAssignments(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch current assignments",
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

  const handleAssignmentToggle = (assignmentId: string) => {
    setSelectedAssignments(prev => 
      prev.includes(assignmentId) 
        ? prev.filter(id => id !== assignmentId)
        : [...prev, assignmentId]
    );
  };

  const handleUnassignModules = async () => {
    if (selectedAssignments.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one assignment to remove",
        variant: "destructive"
      });
      return;
    }

    setUnassigning(true);
    try {
      const { error } = await supabase
        .from('user_module_assignments')
        .delete()
        .in('id', selectedAssignments);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Successfully removed ${selectedAssignments.length} assignments`
      });

      setSelectedAssignments([]);
      fetchCurrentAssignments(); // Refresh the assignments list
    } catch (error) {
      console.error('Unassignment error:', error);
      toast({
        title: "Error",
        description: "Failed to remove assignments",
        variant: "destructive"
      });
    } finally {
      setUnassigning(false);
    }
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

      // Use upsert to handle existing assignments properly
      const { error } = await supabase
        .from('user_module_assignments')
        .upsert(assignments, {
          onConflict: 'user_id,module_id',
          ignoreDuplicates: false
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Successfully assigned ${selectedModules.length} modules to ${selectedUsers.length} users`
      });

      setSelectedModules([]);
      setSelectedUsers([]);
      fetchCurrentAssignments(); // Refresh the assignments list
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
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">Loading modules and users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
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
              Manage Module Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="assign" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="assign" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Assign Modules
                </TabsTrigger>
                <TabsTrigger value="unassign" className="flex items-center gap-2">
                  <Minus className="h-4 w-4" />
                  Remove Assignments
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="assign" className="space-y-6">
                {modules.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No modules available. Upload some modules first.
                  </p>
                ) : users.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No users available. Create some users first.
                  </p>
                ) : (
                  <>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-medium mb-3">Select Modules:</h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto border rounded-lg p-3">
                          {modules.map((module) => (
                            <div key={module.id} className="flex items-center space-x-3">
                              <Checkbox
                                checked={selectedModules.includes(module.id)}
                                onCheckedChange={() => handleModuleToggle(module.id)}
                              />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{module.title}</p>
                                {module.description && (
                                  <p className="text-xs text-muted-foreground">
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
                        <div className="space-y-3 max-h-64 overflow-y-auto border rounded-lg p-3">
                          {users.map((user) => (
                            <div key={user.user_id} className="flex items-center space-x-3">
                              <Checkbox
                                checked={selectedUsers.includes(user.user_id)}
                                onCheckedChange={() => handleUserToggle(user.user_id)}
                              />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{user.username}</p>
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
              </TabsContent>

              <TabsContent value="unassign" className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">Current Assignments:</h3>
                    <Badge variant="secondary">{currentAssignments.length} total</Badge>
                  </div>
                  
                  {currentAssignments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No assignments found.
                    </p>
                  ) : (
                    <>
                      <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-3">
                        {currentAssignments.map((assignment) => (
                          <div key={assignment.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded">
                            <Checkbox
                              checked={selectedAssignments.includes(assignment.id)}
                              onCheckedChange={() => handleAssignmentToggle(assignment.id)}
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-sm">{assignment.profiles.username}</p>
                                  <p className="text-xs text-muted-foreground">{assignment.modules.title}</p>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {new Date(assignment.assigned_at).toLocaleDateString()}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Button 
                        onClick={handleUnassignModules}
                        variant="destructive"
                        className="w-full"
                        disabled={unassigning || selectedAssignments.length === 0}
                      >
                        {unassigning ? 'Removing...' : `Remove ${selectedAssignments.length} assignments`}
                        <Trash2 className="ml-2 h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssignModules;