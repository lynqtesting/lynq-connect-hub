import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TweakRequest {
  id: string;
  title: string | null;
  notes: string | null;
  status: string;
  admin_comments: string | null;
  created_at: string;
  module_id: string | null;
  user_id: string | null;
  profiles?: { username: string } | null;
  modules?: { title: string } | null;
}

interface TweakRequestDetailModalProps {
  request: TweakRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const statusOptions = [
  { value: 'pending', label: 'Pending', icon: AlertCircle },
  { value: 'in_progress', label: 'In Progress', icon: Clock },
  { value: 'resolved', label: 'Resolved', icon: CheckCircle },
];

export function TweakRequestDetailModal({ request, isOpen, onClose, onUpdate }: TweakRequestDetailModalProps) {
  const [selectedStatus, setSelectedStatus] = useState(request?.status || 'pending');
  const [adminComments, setAdminComments] = useState(request?.admin_comments || '');
  const [saving, setSaving] = useState(false);

  // Update local state when request changes
  if (request && selectedStatus !== request.status && !saving) {
    setSelectedStatus(request.status);
  }
  if (request && adminComments !== (request.admin_comments || '') && !saving) {
    setAdminComments(request.admin_comments || '');
  }

  const handleSave = async () => {
    if (!request) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('tweak_requests')
        .update({
          status: selectedStatus,
          admin_comments: adminComments || null,
        })
        .eq('id', request.id);

      if (error) throw error;

      toast.success('Request updated successfully');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error('Failed to update request');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
      case 'in_progress': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      case 'resolved': return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && request && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[10%] md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg z-50 bg-bg-surface border border-border-default rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border-default">
              <h2 className="text-lg font-semibold text-text-primary">Request Details</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-bg-surface-hover rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Status and Info Card */}
              <div className="bg-bg-surface-hover rounded-xl border border-border-default p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-text-muted">Current Status</span>
                  <Badge className={`${getStatusColor(request.status)} border`}>
                    {request.status === 'in_progress' ? 'In Progress' : 
                     request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-text-muted">Module</span>
                    <p className="text-sm text-text-primary font-medium">
                      {request.modules?.title || 'Unknown Module'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-text-muted">Request Type</span>
                    <p className="text-sm text-text-primary">{request.title || 'General Request'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-text-muted">Requested By</span>
                    <p className="text-sm text-text-primary">{request.profiles?.username || 'Unknown User'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-text-muted">Date</span>
                    <p className="text-sm text-text-primary">{formatDate(request.created_at)}</p>
                  </div>
                </div>

                {request.notes && (
                  <div className="mt-4 pt-4 border-t border-border-default">
                    <span className="text-xs text-text-muted">Description</span>
                    <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                      {request.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Update Status */}
              <div>
                <h4 className="text-sm font-medium text-text-primary mb-3">Update Status</h4>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = selectedStatus === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setSelectedStatus(option.value)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                          isSelected
                            ? option.value === 'pending'
                              ? 'bg-amber-500/20 text-amber-500 border-amber-500/50'
                              : option.value === 'in_progress'
                              ? 'bg-blue-500/20 text-blue-500 border-blue-500/50'
                              : 'bg-emerald-500/20 text-emerald-500 border-emerald-500/50'
                            : 'bg-bg-surface border-border-default text-text-secondary hover:bg-bg-surface-hover'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Admin Comments */}
              <div>
                <h4 className="text-sm font-medium text-text-primary mb-3">Admin Comments</h4>
                <textarea
                  value={adminComments}
                  onChange={(e) => setAdminComments(e.target.value)}
                  placeholder="Add internal notes or response to user..."
                  className="w-full bg-bg-surface border border-border-default text-text-primary rounded-xl p-4 text-sm h-28 focus:border-brand focus:ring-1 focus:ring-brand outline-none resize-none placeholder:text-text-muted"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 border-t border-border-default bg-bg-surface-hover/50">
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="px-4"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-brand hover:bg-brand/90 text-white px-6"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}