import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const buildCorsHeaders = (origin?: string) => {
  const allowOrigin = origin || "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
    ...(allowOrigin !== "*" ? { "Access-Control-Allow-Credentials": "true" } : {}),
  };
};

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin") || undefined;
  const corsHeaders = buildCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { email, password, fullName, userType } = await req.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "email and password are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Try to create the user
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      user_metadata: { full_name: fullName },
      email_confirm: true,
    } as any);

    if (createError) {
      const msg = String(createError.message || "");
      const isExisting = /already|registered|exists/i.test(msg);

      if (isExisting && userType === "worker") {
        // User exists — add worker role to existing account
        // Look up the existing user
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existingUser = listData?.users?.find(
          (u: any) => u.email?.toLowerCase() === normalizedEmail
        );

        if (!existingUser) {
          return new Response(JSON.stringify({ error: "User already exists but could not be found" }), {
            status: 409,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        // Check if already has worker role
        const { data: existingRoles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", existingUser.id)
          .eq("role", "worker")
          .maybeSingle();

        if (existingRoles) {
          // Already a worker, just let them log in
          return new Response(JSON.stringify({ success: true, existing: true, message: "Account already exists as worker. Please log in." }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        // Add worker role
        await supabase.from("user_roles").insert({
          user_id: existingUser.id,
          role: "worker",
        });

        // Create worker profile if not exists
        const { data: existingWorker } = await supabase
          .from("workers")
          .select("id")
          .eq("user_id", existingUser.id)
          .maybeSingle();

        if (!existingWorker) {
          await supabase.from("workers").insert({
            user_id: existingUser.id,
            category: "plumber",
            is_verified: false,
            is_online: false,
          });
        }

        return new Response(JSON.stringify({ success: true, existing: true, message: "Worker role added to existing account. Please log in." }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if (isExisting) {
        return new Response(JSON.stringify({ error: "User already exists" }), {
          status: 409,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      console.error("createUser error:", createError);
      return new Response(JSON.stringify({ error: msg }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const createdUser = (createData && ((createData as any).user ? (createData as any).user : createData)) as any;

    if (!createdUser || !createdUser.id) {
      console.error("create-user: unexpected createData shape", createData);
      return new Response(JSON.stringify({ error: "Failed to create user" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Insert role
    try {
      const { error: roleErr } = await supabase.from("user_roles").insert({
        user_id: createdUser.id,
        role: (userType || "customer") as any,
      });
      if (roleErr) console.error("role insert error", roleErr);
    } catch (e) {
      console.error("role insert exception", e);
    }

    // If worker, create worker profile
    if (userType === "worker") {
      try {
        const { error: workerErr } = await supabase.from("workers").insert({
          user_id: createdUser.id,
          category: "plumber",
          is_verified: false,
          is_online: false,
        });
        if (workerErr) console.error("worker insert error", workerErr);
      } catch (e) {
        console.error("worker insert exception", e);
      }
    }

    return new Response(JSON.stringify({ success: true, user: createdUser }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("create-user function error", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
