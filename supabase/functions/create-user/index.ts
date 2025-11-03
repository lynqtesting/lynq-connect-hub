import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, password, domain } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: "Both username and password are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Supabase environment not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use the caller's JWT to verify admin status
    const authHeader = req.headers.get("Authorization") ?? "";
    
    if (!authHeader) {
      console.log("No authorization header provided");
      return new Response(JSON.stringify({ error: "Unauthorized: No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract the JWT token from "Bearer <token>"
    const token = authHeader.replace("Bearer ", "");

    // Use service role client to verify the token
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Verify token and get user
    const { data: { user }, error: userErr } = await adminClient.auth.getUser(token);

    if (userErr || !user) {
      console.error("Failed to verify token:", userErr);
      return new Response(JSON.stringify({ error: "Unauthorized: Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("User authenticated:", user.id);

    // Check if user is admin using the service role client
    const { data: roles, error: roleErr } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleErr || !roles) {
      console.log("Admin check failed:", roleErr);
      return new Response(JSON.stringify({ error: "Forbidden: Admins only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Admin verified:", user.id);

    const rawUsername = String(username).trim().toLowerCase();
    const sanitizedUsername = rawUsername.includes("@")
      ? rawUsername.split("@")[0]
      : rawUsername;

    const rawDomain = String(domain ?? "example.com").trim().toLowerCase();
    const sanitizedDomain = rawDomain.replace(/^@+/, "").split("@").pop() || "example.com";

    const fakeEmail = `${sanitizedUsername}@${sanitizedDomain}`;

    // Create user using the admin client
    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email: fakeEmail,
      password,
      email_confirm: true,
      user_metadata: { username },
    });

    if (createErr) {
      console.error("Create user error:", createErr);
      return new Response(
        JSON.stringify({ error: createErr.message || "Failed to create user" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Add 'user' role to the new user
    const { error: assignRoleErr } = await adminClient
      .from('user_roles')
      .insert({
        user_id: created.user!.id,
        role: 'user'
      });

    if (assignRoleErr) {
      console.error("Create role error:", assignRoleErr);
      // Don't fail the request, just log the error
    }

    return new Response(
      JSON.stringify({ success: true, userId: created.user?.id, email: fakeEmail, username }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error in create-user:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
