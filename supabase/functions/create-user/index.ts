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
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser();

    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin using secured SQL function
    const { data: isAdmin, error: adminErr } = await userClient.rpc("is_admin_user");

    if (adminErr) {
      console.error("Admin check error:", adminErr);
      return new Response(JSON.stringify({ error: "Failed to verify permissions" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: Admins only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawUsername = String(username).trim().toLowerCase();
    const sanitizedUsername = rawUsername.includes("@")
      ? rawUsername.split("@")[0]
      : rawUsername;

    const rawDomain = String(domain ?? "example.com").trim().toLowerCase();
    const sanitizedDomain = rawDomain.replace(/^@+/, "").split("@").pop() || "example.com";

    const fakeEmail = `${sanitizedUsername}@${sanitizedDomain}`;

    // Use service role for admin user creation
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
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
    const { error: roleErr } = await adminClient
      .from('user_roles')
      .insert({
        user_id: created.user!.id,
        role: 'user'
      });

    if (roleErr) {
      console.error("Create role error:", roleErr);
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
