import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, BarChart3, MessageSquare, Clock, Folder, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { TweakLynqForm } from './TweakLynqForm';
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
  status?: string;
  created_at: string;
  module_id: string | null;
}

interface ResponseUpload {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  created_at: string;
  metadata: any;
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
  const [responseUploads, setResponseUploads] = useState<ResponseUpload[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingResponses, setLoadingResponses] = useState(false);
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

  // Fetch response uploads for this module
  useEffect(() => {
    const fetchResponseUploads = async () => {
      setLoadingResponses(true);
      try {
        const { data, error } = await supabase
          .from('data_uploads')
          .select('id, file_name, file_url, file_size, created_at, metadata')
          .eq('module_id', module.id)
          .eq('file_type', 'response_csv')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setResponseUploads(data || []);
      } catch (error) {
        console.error('Error fetching response uploads:', error);
      } finally {
        setLoadingResponses(false);
      }
    };

    fetchResponseUploads();
  }, [module.id]);

  const refreshTweakRequests = async () => {
    const { data } = await supabase
      .from('tweak_requests')
      .select('*')
      .eq('module_id', module.id)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    setTweakRequests(data || []);
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
      <div className="flex border-b border-border-default overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative pb-3 px-2 sm:px-4 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap touch-manipulation ${
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
                  className="flex-1 h-11 bg-brand hover:bg-brand/90 text-white shadow-lg shadow-brand/20 touch-manipulation"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Module
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/user-dashboard?module=${module.id}`)}
                  className="flex-1 h-11 touch-manipulation"
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
            {/* Tweak Form */}
            <div className="bg-bg-surface-hover rounded-xl border border-border-default p-4 sm:p-6">
              <TweakLynqForm
                moduleId={module.id}
                userId={userId}
                onSubmitSuccess={refreshTweakRequests}
              />
            </div>

            {/* Request History */}
            <div className="space-y-4">
              <h4 className="text-text-primary font-semibold">History</h4>
              {loadingRequests ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-bg-surface-hover p-4 rounded-lg border border-border-default">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-3/4 mt-1" />
                    </div>
                  ))}
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
                      <div className="flex items-center gap-2">
                        <span className="text-text-primary font-medium text-sm">
                          {req.title || 'Request'}
                        </span>
                        {req.status && (
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] px-1.5 py-0 ${
                              req.status === 'resolved' 
                                ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
                                : req.status === 'in_progress'
                                ? 'bg-blue-500/20 text-blue-500 border-blue-500/30'
                                : 'bg-amber-500/20 text-amber-500 border-amber-500/30'
                            }`}
                          >
                            {req.status === 'in_progress' ? 'In Progress' : 
                             req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                          </Badge>
                        )}
                      </div>
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
            className="space-y-4"
          >
            <h4 className="text-text-primary font-semibold">Uploaded Response Data</h4>
            
            {loadingResponses ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-bg-surface-hover p-4 rounded-xl border border-border-default">
                    <div className="flex items-start gap-3">
                      <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-20 mt-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : responseUploads.length === 0 ? (
              <div className="bg-bg-surface-hover p-6 rounded-xl border border-border-default text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-text-muted mb-4" />
                <p className="text-text-primary font-medium mb-1">No response data uploaded</p>
                <p className="text-text-muted text-sm">
                  Response CSV files for this module will appear here once uploaded.
                </p>
              </div>
            ) : (
              responseUploads.map((upload, index) => (
                <motion.div
                  key={upload.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-bg-surface-hover p-4 rounded-xl border border-border-default"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary text-sm font-medium break-words line-clamp-2">
                        {upload.file_name}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                        <span className="text-xs text-text-muted">
                          {upload.file_size ? `${(upload.file_size / 1024).toFixed(1)} KB` : 'Unknown size'}
                        </span>
                        <span className="text-xs text-text-muted">
                          {formatDate(upload.created_at)}
                        </span>
                      </div>
                      {upload.metadata?.num_rows && (
                        <p className="text-xs text-text-secondary mt-2">
                          {upload.metadata.num_rows} responses recorded
                        </p>
                      )}
                      <Button
                        variant="outline"
                        size="default"
                        className="mt-3 h-10 touch-manipulation"
                        onClick={() => window.open(upload.file_url, '_blank')}
                      >
                        Download CSV
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
