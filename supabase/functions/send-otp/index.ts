 /// <reference lib="deno.ns" />
 import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
 import { Resend } from "https://esm.sh/resend@2.0.0";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
 
 const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
 
// Build CORS headers per-request so we can echo the request origin (required when credentials are used)
const buildCorsHeaders = (origin?: string) => {
  const allowOrigin = origin || "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
    // Only include credentials header when we have an explicit origin
    ...(allowOrigin !== "*" ? { "Access-Control-Allow-Credentials": "true" } : {}),
  };
};
 
 function generateOTP(): string {
   return Math.floor(100000 + Math.random() * 900000).toString();
 }
 
 const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    const origin = req.headers.get("origin") || undefined;
    return new Response(null, { status: 204, headers: buildCorsHeaders(origin) });
  }
 
   try {
     const { email, type } = await req.json();
 
     if (!email) {
       throw new Error("Email is required");
     }
 
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
 
     // Generate OTP
     const otpCode = generateOTP();
 
     // Delete any existing OTPs for this email
     await supabase.from("email_otps").delete().eq("email", email);
 
     // Store new OTP
     const { error: insertError } = await supabase.from("email_otps").insert({
       email,
       otp_code: otpCode,
       expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
     });
 
     if (insertError) {
       console.error("Error storing OTP:", insertError);
       throw new Error("Failed to generate OTP");
     }
 
     // Send email with OTP
     const subject = type === "signup" ? "Verify your email - HomeServe" : "Password Reset Code - HomeServe";
     const heading = type === "signup" ? "Welcome to HomeServe!" : "Password Reset Request";
     const message = type === "signup" 
       ? "Thanks for signing up! Use the code below to verify your email address:"
       : "Use the code below to reset your password:";
 
     const emailResponse = await resend.emails.send({
       from: "HomeServe <onboarding@resend.dev>", // Use Resend's test domain or your verified domain
       to: [email],
       subject,
       html: `
         <!DOCTYPE html>
         <html>
         <head>
           <meta charset="utf-8">
           <meta name="viewport" content="width=device-width, initial-scale=1.0">
         </head>
         <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px 20px; background-color: #f5f5f5;">
           <div style="max-width: 400px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
             <h1 style="margin: 0 0 20px; font-size: 24px; color: #111;">${heading}</h1>
             <p style="margin: 0 0 30px; color: #666; font-size: 16px; line-height: 1.5;">${message}</p>
             <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 12px; padding: 24px; text-align: center;">
               <span style="font-size: 36px; font-weight: 700; color: white; letter-spacing: 8px;">${otpCode}</span>
             </div>
             <p style="margin: 30px 0 0; color: #999; font-size: 14px;">This code expires in 10 minutes.</p>
             <p style="margin: 10px 0 0; color: #999; font-size: 14px;">If you didn't request this, please ignore this email.</p>
           </div>
         </body>
         </html>
       `,
     });
 
     console.log("OTP email sent successfully:", emailResponse);
 
    const origin = req.headers.get("origin") || undefined;
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...buildCorsHeaders(origin) },
    });
   } catch (error: any) {
     console.error("Error in send-otp function:", error);
    const origin = req.headers.get("origin") || undefined;
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...buildCorsHeaders(origin) },
      }
    );
   }
 };
 
 serve(handler);