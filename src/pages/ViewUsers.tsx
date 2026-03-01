import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, User, Mail, ChevronDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserRow {
  user_id: string;
  username: string;
  created_at: string;
  email?: string;
}

interface ModuleOption {
  id: string;
  title: string;
}

const ViewUsers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Email dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [userModules, setUserModules] = useState<ModuleOption[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [loadingModules, setLoadingModules] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch profiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, username, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch emails via admin function
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      let emailMap: Record<string, string> = {};

      if (token) {
        try {
          const res = await supabase.functions.invoke('admin-get-user-emails', {
            body: {},
          });
          emailMap = res.data?.emails ?? {};
        } catch {
          // emails are optional — silently continue
        }
      }

      setUsers(
        (profiles ?? []).map((p) => ({
          ...p,
          email: emailMap[p.user_id] ?? '',
        }))
      );
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openEmailDialog = async (user: UserRow) => {
    setSelectedUser(user);
    setSelectedModuleId('');
    setDialogOpen(true);
    setLoadingModules(true);

    try {
      const { data, error } = await supabase
        .from('user_module_assignments')
        .select('module_id, modules(id, title)')
        .eq('user_id', user.user_id);

      if (error) throw error;

      const mods: ModuleOption[] = (data ?? [])
        .map((row: any) => row.modules)
        .filter(Boolean)
        .map((m: any) => ({ id: m.id, title: m.title }));

      setUserModules(mods);
      if (mods.length === 1) setSelectedModuleId(mods[0].id);
    } catch (err) {
      console.error('Error fetching modules:', err);
      toast({ title: "Error", description: "Could not load modules for this user", variant: "destructive" });
    } finally {
      setLoadingModules(false);
    }
  };

  const sendEmail = async () => {
    if (!selectedUser || !selectedModuleId) return;
    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-performance-email', {
        body: { userId: selectedUser.user_id, moduleId: selectedModuleId },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? 'Send failed');

      toast({
        title: "Email sent!",
        description: `Performance update sent to ${selectedUser.email || selectedUser.username}`,
      });
      setDialogOpen(false);
    } catch (err: any) {
      console.error('Send email error:', err);
      toast({
        title: "Failed to send",
        description: err.message ?? "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
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
              All Users ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {users.length === 0 ? (
              <p className="text-muted-foreground text-center">
                No users found. Create some users first.
              </p>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.user_id}
                    className="flex items-center space-x-3 p-3 border rounded-lg"
                  >
                    <User className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.username}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email || 'No email on record'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Joined: {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => openEmailDialog(user)}
                      className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      SEND EMAIL
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Send Email Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-indigo-600" />
              Send LYNQ Performance Email
            </DialogTitle>
            <DialogDescription>
              This will send a branded performance update to{' '}
              <strong>{selectedUser?.email || selectedUser?.username}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-4">
            {loadingModules ? (
              <p className="text-sm text-muted-foreground">Loading modules…</p>
            ) : userModules.length === 0 ? (
              <p className="text-sm text-destructive">
                This user has no assigned modules. Assign a module first.
              </p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Select module to report on</label>
                  <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a module…" />
                    </SelectTrigger>
                    <SelectContent>
                      {userModules.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3 text-xs text-indigo-700 space-y-1">
                  <p><strong>Email heading:</strong> LYNQ Performance Update</p>
                  <p><strong>Includes:</strong> Engagement %, STR Score, Completion Rate, Time Saved, At-Risk count</p>
                  <p><strong>Sent from:</strong> Ishani Behl · ishanibehl@skillopp.com</p>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={sending}>
              Cancel
            </Button>
            <Button
              onClick={sendEmail}
              disabled={!selectedModuleId || sending || userModules.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {sending ? 'Sending…' : 'Send Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViewUsers;
