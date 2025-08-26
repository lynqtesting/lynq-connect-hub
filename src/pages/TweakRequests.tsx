import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MessageSquare, CheckCircle, XCircle, Clock } from 'lucide-react';

const TweakRequests = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTweakRequests();
  }, []);

  const fetchTweakRequests = async () => {
    try {
      console.log('Fetching tweak requests...');
      const { data, error } = await supabase
        .from('tweak_requests')
        .select(`
          *,
          profiles!inner (
            username
          )
        `)
        .order('created_at', { ascending: false });

      console.log('Tweak requests query result:', { data, error });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching tweak requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tweak requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, status: string) => {
    try {
      // For now, we'll just show a message since the status field doesn't exist yet
      toast({
        title: "Info",
        description: "Status update feature will be available after database types are updated"
      });
      
      // TODO: Enable after status field is added to tweak_requests table
      // const { error } = await supabase
      //   .from('tweak_requests')
      //   .update({ status })
      //   .eq('id', requestId);

      // if (error) throw error;

      // toast({
      //   title: "Success",
      //   description: `Tweak request ${status} successfully`
      // });

      // fetchTweakRequests();
    } catch (error) {
      console.error('Error updating tweak request:', error);
      toast({
        title: "Error",
        description: "Failed to update tweak request",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string = 'pending') => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
    }
  };

  const getStatusIcon = (status: string = 'pending') => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'processing': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Loading tweak requests...</div>
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
          Back to Admin Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              Tweak Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No tweak requests yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <Card key={request.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Tweak Request #{request.id.slice(0, 8)}</h3>
                          <Badge className={getStatusColor(request.status || 'pending')}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(request.status || 'pending')}
                              {request.status || 'pending'}
                            </span>
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>User: {request.profiles?.username || 'Unknown'}</p>
                          <p>Question ID: {request.question_id || 'N/A'}</p>
                          <p>Created: {new Date(request.created_at).toLocaleDateString()}</p>
                        </div>
                        
                        {request.notes && (
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <h4 className="font-medium text-sm mb-1">Notes:</h4>
                            <p className="text-sm">{request.notes}</p>
                          </div>
                        )}

                        {/* Show placeholder status management buttons */}
                        <div className="bg-muted/30 p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-2">
                            Status management will be available after database updates
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              disabled
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Clock className="mr-1 h-3 w-3" />
                              Process
                            </Button>
                            <Button
                              size="sm"
                              disabled
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled
                            >
                              <XCircle className="mr-1 h-3 w-3" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TweakRequests;