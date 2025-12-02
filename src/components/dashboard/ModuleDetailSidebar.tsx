import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, BarChart3, ChevronDown, MessageSquare, Clock, User, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

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

interface TweakRequest {
  id: string;
  title: string | null;
  notes: string | null;
  created_at: string;
  module_id: string | null;
}

interface ModuleDetailSidebarProps {
  module: Module;
  userId: string;
}

type TabType = 'overview' | 'tweaks' | 'responses';

const tabs: { id: TabType; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'tweaks', label: 'Tweak Requests' },
  { id: 'responses', label: 'Responses' },
];

export function ModuleDetailSidebar({ module, userId }: ModuleDetailSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [tweakRequests, setTweakRequests] = useState<TweakRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestType, setRequestType] = useState('Content Update');
  const [description, setDescription] = useState('');
  const navigate = useNavigate();

  // Fetch tweak requests for this module
  useEffect(() => {
    const fetchTweakRequests = async () => {
      setLoadingRequests(true);
      try {
        const { data, error } = await supabase
          .from('tweak_requests')
          .select('*')
          .eq('module_id', module.id)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTweakRequests(data || []);
      } catch (error) {
        console.error('Error fetching tweak requests:', error);
      } finally {
        setLoadingRequests(false);
      }
    };

    fetchTweakRequests();
  }, [module.id, userId]);

  const handleSubmitRequest = async () => {
    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('tweak_requests')
        .insert({
          module_id: module.id,
          user_id: userId,
          title: requestType,
          notes: description,
        });

      if (error) throw error;

      toast.success('Request submitted successfully');
      setDescription('');
      
      // Refresh requests
      const { data } = await supabase
        .from('tweak_requests')
        .select('*')
        .eq('module_id', module.id)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      setTweakRequests(data || []);
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartModule = () => {
    if (module.module_link) {
      window.open(module.module_link, '_blank');
    } else if (module.file_url) {
      window.open(module.file_url, '_blank');
    } else {
      navigate(`/module/${module.id}`);
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
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-border-default">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative pb-3 px-4 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-text-primary'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Module Screenshot */}
            {module.screenshot_url && (
              <div className="rounded-xl overflow-hidden border border-border-default">
                <img
                  src={module.screenshot_url}
                  alt={module.title}
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            {/* Module Details Card */}
            <div className="bg-bg-surface-hover rounded-xl border border-border-default p-4 sm:p-6">
              <h4 className="text-text-primary font-semibold mb-4">Module Details</h4>

              {/* Description */}
              <p className="text-text-secondary text-sm leading-relaxed mb-6">
                {module.description || 'No description available.'}
              </p>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-text-muted" />
                  <div>
                    <span className="block text-text-muted text-xs">Created</span>
                    <span className="text-text-primary">{formatDate(module.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-text-muted" />
                  <div>
                    <span className="block text-text-muted text-xs">Category</span>
                    <span className="text-text-primary">{module.category || 'General'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleStartModule}
                  className="flex-1 bg-brand hover:bg-brand/90 text-white shadow-lg shadow-brand/20"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Module
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/module/${module.id}`)}
                  className="flex-1"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'tweaks' && (
          <motion.div
            key="tweaks"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Submit Form */}
            <div className="bg-bg-surface-hover rounded-xl border border-border-default p-4 sm:p-6">
              <h4 className="text-text-primary font-semibold mb-4">
                Submit a Tweak Request
              </h4>
              <div className="space-y-4">
                {/* Request Type Dropdown */}
                <div>
                  <label className="block text-sm text-text-muted mb-1.5 font-medium">
                    Request Type
                  </label>
                  <div className="relative">
                    <select
                      value={requestType}
                      onChange={(e) => setRequestType(e.target.value)}
                      className="appearance-none w-full bg-bg-surface border border-border-default text-text-primary rounded-lg p-2.5 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none pr-10"
                    >
                      <option value="Content Update">Content Update</option>
                      <option value="Design Change">Design Change</option>
                      <option value="Bug Report">Bug Report</option>
                      <option value="Feature Request">Feature Request</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none h-4 w-4" />
                  </div>
                </div>

                {/* Description Textarea */}
                <div>
                  <label className="block text-sm text-text-muted mb-1.5 font-medium">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-bg-surface border border-border-default text-text-primary rounded-lg p-3 text-sm h-24 focus:border-brand focus:ring-1 focus:ring-brand outline-none resize-none placeholder:text-text-muted"
                    placeholder="Describe the change needed..."
                  />
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmitRequest}
                  disabled={submitting || !description.trim()}
                  className="w-full bg-brand hover:bg-brand/90 text-white shadow-lg shadow-brand/20"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </div>

            {/* Request History */}
            <div className="space-y-4">
              <h4 className="text-text-primary font-semibold">History</h4>
              {loadingRequests ? (
                <div className="bg-bg-surface-hover p-6 rounded-xl border border-border-default text-center">
                  <p className="text-text-muted text-sm">Loading...</p>
                </div>
              ) : tweakRequests.length === 0 ? (
                <div className="bg-bg-surface-hover p-6 rounded-xl border border-border-default text-center">
                  <MessageSquare className="h-8 w-8 mx-auto text-text-muted mb-2" />
                  <p className="text-text-muted text-sm">No requests for this module yet.</p>
                </div>
              ) : (
                tweakRequests.map((req) => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-bg-surface-hover p-4 rounded-lg border border-border-default"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="text-text-primary font-medium text-sm">
                        {req.title || 'Request'}
                      </span>
                      <span className="text-xs text-text-muted shrink-0">
                        {formatDate(req.created_at)}
                      </span>
                    </div>
                    <p className="text-text-secondary text-sm leading-relaxed">
                      {req.notes || 'No description'}
                    </p>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'responses' && (
          <motion.div
            key="responses"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-bg-surface-hover p-6 rounded-xl border border-border-default text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto text-text-muted mb-4" />
              <p className="text-text-muted">Response data viewer coming soon.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
