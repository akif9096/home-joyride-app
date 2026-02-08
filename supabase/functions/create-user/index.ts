import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

// Build CORS headers per-request so we can echo the request origin (required when credentials are used)
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
  if (req.method === "OPTIONS") {
    const origin = req.headers.get("origin") || undefined;
    // Reply to preflight with explicit allowed methods/headers
    return new Response(null, { status: 204, headers: buildCorsHeaders(origin) });
  }

  try {
    const { email, password, fullName, userType } = await req.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'email and password are required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Create user as admin and mark email confirmed
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      user_metadata: { full_name: fullName },
      email_confirm: true,
    } as any);

    if (createError) {
      console.error('createUser error:', createError);
      const msg = String(createError.message || 'Failed to create user');
      if (/already|registered|exists/i.test(msg)) {
        return new Response(JSON.stringify({ error: 'User already exists' }), { status: 409, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // normalize returned user object (some versions return { user } while others return user directly)
    const createdUser = (createData && ((createData as any).user ? (createData as any).user : createData)) as any;

    if (!createdUser || !createdUser.id) {
      console.error('create-user: unexpected createData shape', createData);
      return new Response(JSON.stringify({ error: 'Failed to create user' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // Insert role into user_roles table
    try {
      const { error: roleErr } = await supabase.from('user_roles').insert({ user_id: createdUser.id, role: userType || 'customer' });
      if (roleErr) console.error('role insert error', roleErr);
    } catch (e) {
      console.error('role insert exception', e);
    }

    // If worker, create worker profile row
    if (userType === 'worker') {
      try {
        const { error: workerErr } = await supabase.from('workers').insert({ user_id: createdUser.id, category: 'plumber', is_verified: false, is_online: false });
        if (workerErr) console.error('worker insert error', workerErr);
      } catch (e) {
        console.error('worker insert exception', e);
      }
    }

    const origin = req.headers.get("origin") || undefined;
    return new Response(JSON.stringify({ success: true, user: createdUser }), { status: 200, headers: { 'Content-Type': 'application/json', ...buildCorsHeaders(origin) } });
  } catch (error: any) {
    console.error('create-user function error', error);
    const origin = req.headers.get("origin") || undefined;
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...buildCorsHeaders(origin) } });
  }
};

serve(handler);
