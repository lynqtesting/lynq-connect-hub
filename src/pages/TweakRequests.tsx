import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { ArrowLeft, MessageSquare, AlertCircle, Clock, CheckCircle, Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { TweakRequestDetailModal } from "@/components/TweakRequestDetailModal";
import { Skeleton } from "@/components/ui/skeleton";

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

type FilterType = 'all' | 'pending' | 'in_progress' | 'resolved';

const filterTabs: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'resolved', label: 'Resolved' },
];

function RequestCardSkeleton() {
  return (
    <div className="bg-bg-surface border border-border-default rounded-xl p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <div className="flex flex-col items-end gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

export default function TweakRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<TweakRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedRequest, setSelectedRequest] = useState<TweakRequest | null>(null);

  useEffect(() => {
    fetchTweakRequests();
  }, []);

  const fetchTweakRequests = async () => {
    try {
      // First get all tweak requests with module info
      const { data: requestsData, error: requestsError } = await supabase
        .from('tweak_requests')
        .select(`
          *,
          modules!tweak_requests_module_id_fkey (title)
        `)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Then get user profiles for the requests
      if (requestsData && requestsData.length > 0) {
        const userIds = [...new Set(requestsData.map(req => req.user_id).filter(Boolean))];
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, username')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        // Manually join the data
        const requestsWithProfiles = requestsData.map(request => ({
          ...request,
          profiles: profilesData?.find(profile => profile.user_id === request.user_id) || { username: 'Unknown' }
        }));

        setRequests(requestsWithProfiles);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching tweak requests:', error);
      toast.error('Failed to fetch tweak requests');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredRequests = () => {
    if (activeFilter === 'all') return requests;
    return requests.filter(req => req.status === activeFilter);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return AlertCircle;
      case 'in_progress': return Clock;
      case 'resolved': return CheckCircle;
      default: return AlertCircle;
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

  const getStatusIconBg = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/20 text-amber-500';
      case 'in_progress': return 'bg-blue-500/20 text-blue-500';
      case 'resolved': return 'bg-emerald-500/20 text-emerald-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeColor = (type: string | null) => {
    switch (type?.toLowerCase()) {
      case 'content update': return 'bg-teal-500/20 text-teal-400 border-teal-500/30';
      case 'design change': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'bug report': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'feature request': return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
      default: return 'bg-muted/50 text-text-muted border-border-default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredRequests = getFilteredRequests();

  return (
    <DashboardLayout role="admin">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin-dashboard')}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-text-primary">
              Tweak Requests
            </h1>
            <p className="text-sm text-text-muted mt-1">
              {requests.length} total requests
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`relative px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
              activeFilter === tab.id
                ? 'bg-brand text-white shadow-lg shadow-brand/20'
                : 'bg-bg-surface border border-border-default text-text-secondary hover:bg-bg-surface-hover'
            }`}
          >
            {tab.label}
            {tab.id !== 'all' && (
              <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
                activeFilter === tab.id
                  ? 'bg-white/20'
                  : 'bg-muted'
              }`}>
                {requests.filter(r => r.status === tab.id).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Request List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <RequestCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-bg-surface border border-border-default rounded-2xl p-8 sm:p-12 text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-text-muted mb-4" />
          <p className="text-text-primary font-medium mb-1">No requests found</p>
          <p className="text-sm text-text-muted">
            {activeFilter === 'all' 
              ? 'No tweak requests have been submitted yet.' 
              : `No ${activeFilter.replace('_', ' ')} requests.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredRequests.map((request, index) => {
              const StatusIcon = getStatusIcon(request.status);
              return (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedRequest(request)}
                  className="bg-bg-surface border border-border-default rounded-xl p-4 hover:bg-bg-surface-hover cursor-pointer transition-all group"
                >
                  <div className="flex items-start gap-3">
                    {/* Status Icon */}
                    <div className={`w-10 h-10 rounded-lg ${getStatusIconBg(request.status)} flex items-center justify-center flex-shrink-0`}>
                      <StatusIcon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-sm font-medium text-text-primary truncate group-hover:text-brand transition-colors">
                          {request.modules?.title || 'Unknown Module'}
                        </h3>
                        <Badge className={`${getStatusColor(request.status)} border text-xs flex-shrink-0`}>
                          {request.status === 'in_progress' ? 'In Progress' : 
                           request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                        <Badge variant="outline" className={`${getTypeColor(request.title)} text-[10px] px-2 py-0.5`}>
                          {request.title || 'General'}
                        </Badge>
                        <span>Requested by {request.profiles?.username || 'Unknown'}</span>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-text-muted flex-shrink-0">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(request.created_at)}
                    </div>
                  </div>

                  {/* Mobile Date */}
                  <div className="flex sm:hidden items-center gap-1.5 text-xs text-text-muted mt-2 pl-13">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(request.created_at)}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Detail Modal */}
      <TweakRequestDetailModal
        request={selectedRequest}
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onUpdate={fetchTweakRequests}
      />
    </DashboardLayout>
  );
}