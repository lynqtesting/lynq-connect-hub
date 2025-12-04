import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id?: string;
    name: string;
    email: string;
    role: string;
    initials: string;
  };
  onProfileUpdate?: (newName: string) => void;
}

export function UserProfileModal({ isOpen, onClose, user, onProfileUpdate }: UserProfileModalProps) {
  const [username, setUsername] = useState(user.name);
  const [isSaving, setIsSaving] = useState(false);

  // Sync username when user prop changes
  useEffect(() => {
    setUsername(user.name);
  }, [user.name]);

  const handleSave = async () => {
    if (!user.id) {
      toast.error('Unable to update profile');
      return;
    }

    if (!username.trim()) {
      toast.error('Username cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: username.trim() })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      onProfileUpdate?.(username.trim());
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onKeyDown={handleKeyDown}
          >
            <motion.div
              className="relative w-full max-w-sm bg-bg-surface border border-border-default rounded-2xl shadow-2xl overflow-hidden"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface-hover transition-colors"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Content */}
              <div className="p-6 pt-8">
                {/* Avatar */}
                <div className="flex justify-center mb-6">
                  <motion.div
                    className="w-20 h-20 rounded-full bg-brand/20 flex items-center justify-center"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <span className="text-2xl font-bold text-brand">{user.initials}</span>
                  </motion.div>
                </div>

                {/* Username Input */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
                    Username
                  </label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="bg-bg-canvas border-border-default focus:border-brand"
                  />
                </div>

                {/* Email (Read-only) */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
                    Email
                  </label>
                  <div className="px-3 py-2 bg-bg-canvas border border-border-default rounded-md text-text-secondary text-sm">
                    {user.email}
                  </div>
                </div>

                {/* Role Badge */}
                <div className="flex justify-center mb-6">
                  <Badge
                    variant={user.role === 'Administrator' ? 'default' : 'secondary'}
                    className={user.role === 'Administrator' 
                      ? 'bg-brand/20 text-brand border-brand/30' 
                      : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'}
                  >
                    <User className="h-3 w-3 mr-1" />
                    {user.role}
                  </Badge>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="flex-1 bg-brand hover:bg-brand/90 text-white"
                    disabled={isSaving || username === user.name}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
