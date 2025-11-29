import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { SidePanel } from '@/components/dashboard/SidePanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, UserPlus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ViewUsersNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      const { data: assignments, error: assignmentsError } = await supabase
        .from('user_module_assignments')
        .select('user_id, module_id, modules(title)');

      if (assignmentsError) throw assignmentsError;

      const usersData = profiles?.map((profile) => {
        const userRole = userRoles?.find((r) => r.user_id === profile.user_id);
        const userAssignments = assignments?.filter((a) => a.user_id === profile.user_id) || [];

        return {
          id: profile.user_id,
          name: profile.username || 'User',
          email: profile.user_id,
          role: userRole?.role || 'user',
          department: 'N/A',
          lastActive: new Date(profile.updated_at).toLocaleDateString(),
          assignedModules: userAssignments.length,
          modulesList: userAssignments,
        };
      });

      setUsers(usersData || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    return (
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleUserClick = (user: any) => {
    setSelectedUser(user);
    setPanelOpen(true);
  };

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-text-muted">Loading users...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">User Management</h1>
            <p className="text-text-muted mt-1">
              Manage access and module assignments
            </p>
          </div>
          <Button onClick={() => navigate('/create-user')} className="gap-2 bg-brand hover:bg-brand-hover">
            <Plus className="h-4 w-4" />
            Create User
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-bg-surface border-border-default"
          />
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => handleUserClick(user)}
              className="bg-bg-surface border border-border-default rounded-xl p-6 hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand to-brand-glow text-white flex items-center justify-center text-lg font-bold">
                    {user.name[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">{user.name}</h3>
                    <p className="text-xs text-text-muted truncate max-w-[150px]">{user.email}</p>
                  </div>
                </div>
                <Badge
                  className={
                    user.role === 'admin'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                  }
                >
                  {user.role}
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Department:</span>
                  <span className="text-text-secondary font-medium">{user.department}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Last Active:</span>
                  <span className="text-text-secondary font-medium">{user.lastActive}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Assigned Modules:</span>
                  <span className="text-brand font-bold">{user.assignedModules}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Side Panel */}
      <SidePanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={selectedUser?.name || 'User Details'}
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand to-brand-glow text-white flex items-center justify-center text-2xl font-bold">
                {selectedUser.name[0]}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-text-primary">{selectedUser.name}</h3>
                <p className="text-sm text-text-muted">{selectedUser.email}</p>
                <Badge
                  className={`mt-2 ${
                    selectedUser.role === 'admin'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                  }`}
                >
                  {selectedUser.role}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-text-muted uppercase mb-2">User Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between py-2 border-b border-border-subtle">
                    <span className="text-text-muted">Department:</span>
                    <span className="text-text-secondary font-medium">{selectedUser.department}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border-subtle">
                    <span className="text-text-muted">Last Active:</span>
                    <span className="text-text-secondary font-medium">{selectedUser.lastActive}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-text-muted">Role:</span>
                    <span className="text-text-secondary font-medium capitalize">{selectedUser.role}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-text-muted uppercase">
                    Assigned Modules ({selectedUser.assignedModules})
                  </h3>
                  <Button size="sm" variant="outline" onClick={() => navigate('/assign-modules')}>
                    <UserPlus className="h-3 w-3 mr-1" />
                    Assign
                  </Button>
                </div>
                <div className="space-y-2">
                  {selectedUser.modulesList && selectedUser.modulesList.length > 0 ? (
                    selectedUser.modulesList.map((assignment: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-bg-canvas rounded-lg hover:bg-bg-surface-hover transition-colors"
                      >
                        <span className="text-sm text-text-secondary">
                          {assignment.modules?.title || 'Untitled Module'}
                        </span>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-text-muted text-center py-4">No modules assigned</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-text-muted uppercase mb-3">Account Actions</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    Reset Password
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                    Deactivate Account
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </SidePanel>
    </DashboardLayout>
  );
};

export default ViewUsersNew;
