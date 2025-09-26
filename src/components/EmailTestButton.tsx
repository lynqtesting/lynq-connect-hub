import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, Loader2 } from "lucide-react";

const EmailTestButton = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleTestEmail = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to test emails.",
          variant: "destructive",
        });
        return;
      }

      console.log("Testing email function with user:", user.id);

      const { data, error } = await supabase.functions.invoke('send-request-notification', {
        body: {
          requestId: crypto.randomUUID(),
          userId: user.id,
          requestType: 'other',
          title: 'Test Email',
          description: 'This is a test email to verify the Resend integration is working correctly.',
          createdAt: new Date().toISOString()
        }
      });

      console.log("Function response:", { data, error });

      if (error) {
        throw new Error(error.message || 'Function invocation failed');
      }

      toast({
        title: "Email Test Sent",
        description: data?.success 
          ? `Test email sent successfully! Email ID: ${data.emailId || 'N/A'}`
          : "Email function called but status unclear. Check function logs.",
      });

    } catch (error) {
      console.error('Email test failed:', error);
      toast({
        title: "Email Test Failed",
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleTestEmail}
      disabled={loading}
      variant="outline"
      className="w-full"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Sending Test Email...
        </>
      ) : (
        <>
          <Mail className="mr-2 h-4 w-4" />
          Send Test Email
        </>
      )}
    </Button>
  );
};

export default EmailTestButton;