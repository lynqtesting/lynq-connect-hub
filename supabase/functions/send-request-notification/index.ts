import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@3.2.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestNotificationData {
  requestId: string;
  userId: string;
  moduleId?: string;
  requestType: string;
  title: string;
  description?: string;
  duration?: number;
  quantity?: number;
  createdAt: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create auth client to verify token
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: { user: authUser }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !authUser) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestData: RequestNotificationData = await req.json();
    console.log("Processing notification for request:", requestData.requestId);

    // Create Supabase client with service role for admin access
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch user details from profiles and auth
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('user_id', requestData.userId)
      .single();

    // Fetch user email from auth.users (only accessible with service role)
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(requestData.userId);
    
    if (userError) {
      console.error("Failed to fetch user");
      throw new Error("Failed to fetch user email");
    }

    // Fetch module details if moduleId is provided
    let moduleTitle = "N/A";
    if (requestData.moduleId) {
      const { data: module } = await supabase
        .from('modules')
        .select('title')
        .eq('id', requestData.moduleId)
        .single();
      
      if (module) {
        moduleTitle = module.title;
      }
    }

    // Format request type for display
    const requestTypeDisplayMap: Record<string, string> = {
      'adapt': 'Adaptation Request',
      'adaptive': 'Adaptive Request', 
      'tweak': 'Tweak Request',
      'new': 'New Module Request',
      'other': 'General Request'
    };

    const requestTypeDisplay = requestTypeDisplayMap[requestData.requestType] || requestData.requestType;

    // Build email content
    const emailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">🔔 New Client Request Submitted</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">A new request requires your attention</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
              <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #667eea;">
                <h2 style="color: #667eea; margin: 0 0 15px 0; font-size: 18px;">👤 Client Information</h2>
                <p style="margin: 5px 0;"><strong>Name:</strong> ${profile?.username || 'Unknown User'}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${user?.email || 'N/A'}</p>
                <p style="margin: 5px 0;"><strong>User ID:</strong> ${requestData.userId}</p>
              </div>

              <div style="background: white; padding: 25px; border-radius: 8px; border-left: 4px solid #28a745;">
                <h2 style="color: #28a745; margin: 0 0 15px 0; font-size: 18px;">📋 Request Details</h2>
                <p style="margin: 5px 0;"><strong>Type:</strong> ${requestTypeDisplay}</p>
                <p style="margin: 5px 0;"><strong>Title:</strong> ${requestData.title}</p>
                <p style="margin: 5px 0;"><strong>Description:</strong></p>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; border-left: 3px solid #dee2e6;">
                  ${requestData.description || 'No description provided'}
                </div>
                <p style="margin: 5px 0;"><strong>Timestamp:</strong> ${new Date(requestData.createdAt).toLocaleString()}</p>
                ${requestData.duration ? `<p style="margin: 5px 0;"><strong>Duration:</strong> ${requestData.duration} minutes</p>` : ''}
                ${requestData.quantity ? `<p style="margin: 5px 0;"><strong>Quantity:</strong> ${requestData.quantity}</p>` : ''}
                ${requestData.moduleId ? `<p style="margin: 5px 0;"><strong>Related Module:</strong> ${moduleTitle}</p>` : ''}
              </div>

              <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin-top: 20px; text-align: center; border-left: 4px solid #2196f3;">
                <p style="margin: 0; color: #1976d2; font-weight: 500;">
                  🚀 Please review this request in your admin dashboard
                </p>
              </div>
            </div>

            <div style="text-align: center; margin-top: 20px; padding: 20px; color: #666; font-size: 12px;">
              <p>This is an automated notification from your platform.</p>
              <p>© ${new Date().getFullYear()} Your Platform Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email via Resend
    console.log("Sending notification email for request:", requestData.requestId);

    const emailResponse = await resend.emails.send({
      from: "Platform Notifications <onboarding@resend.dev>",
      to: ["ishanibehl@skillopp.com"],
      subject: `New Client Request Submitted - ${requestTypeDisplay}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse.data?.id ? "yes" : "no");

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Notification function error");
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
