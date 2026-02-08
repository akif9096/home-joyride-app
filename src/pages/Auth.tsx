import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, Mail, Lock, ShieldCheck, User } from "lucide-react";

type Mode = "login" | "signup" | "verify-otp";

type PendingCustomer = {
  email: string;
  password: string;
  fullName: string;
};

const callFunction = async <T,>(path: string, body: unknown): Promise<T> => {
  const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(json?.error || "Request failed");
  return json as T;
};

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [pending, setPending] = useState<PendingCustomer | null>(null);
  const pendingEmail = useMemo(() => pending?.email || email.trim().toLowerCase(), [pending, email]);

  const sendOtp = async (targetEmail: string) => {
    await callFunction("send-otp", { email: targetEmail, type: "signup" });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error || !data.user) throw new Error(error?.message || "Invalid login credentials");

      toast({ title: "Welcome back!", description: "You are now signed in." });
      navigate("/");
    } catch (err: any) {
      const msg = String(err?.message || "Login failed");
      toast({ title: "Login failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (!fullName.trim()) throw new Error("Please enter your full name");
      if (!normalizedEmail.includes("@")) throw new Error("Please enter a valid email");
      if (password.length < 6) throw new Error("Password must be at least 6 characters");

      await sendOtp(normalizedEmail);
      setPending({ email: normalizedEmail, password, fullName: fullName.trim() });
      setMode("verify-otp");
      toast({ title: "OTP sent", description: "Check your email for the verification code." });
    } catch (err: any) {
      toast({ title: "Signup failed", description: err.message || "Could not start signup", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pending) return;
    setLoading(true);

    try {
      const { data: otpRecord } = await supabase
        .from("email_otps")
        .select("id")
        .eq("email", pending.email)
        .eq("otp_code", otp)
        .eq("verified", false)
        .gte("expires_at", new Date().toISOString())
        .maybeSingle();

      if (!otpRecord?.id) throw new Error("Invalid or expired OTP");

      await supabase.from("email_otps").update({ verified: true }).eq("id", otpRecord.id);

      // Create account server-side (enforces unique email; returns 409 if exists)
      await callFunction("create-user", {
        email: pending.email,
        password: pending.password,
        fullName: pending.fullName,
        userType: "customer",
      });

      const { error } = await supabase.auth.signInWithPassword({
        email: pending.email,
        password: pending.password,
      });
      if (error) throw error;

      toast({ title: "Account created", description: "You are now signed in." });
      navigate("/");
    } catch (err: any) {
      const msg = String(err?.message || "Verification failed");
      if (/exists|already/i.test(msg)) {
        toast({
          title: "Account already exists",
          description: "Please log in instead (or reset your password).",
          variant: "destructive",
        });
        setMode("login");
      } else {
        toast({ title: "Verification failed", description: msg, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <header className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary mx-auto flex items-center justify-center shadow-glow mb-4">
            <User className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Customer Access</h1>
          <p className="text-muted-foreground mt-2">
            {mode === "login" && "Sign in to book services"}
            {mode === "signup" && "Create your account"}
            {mode === "verify-otp" && "Verify your email with OTP"}
          </p>
        </header>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
          <div className="grid grid-cols-2 gap-2 mb-5">
            <Button type="button" variant={mode === "login" ? "default" : "outline"} onClick={() => setMode("login")}>Login</Button>
            <Button type="button" variant={mode === "signup" ? "default" : "outline"} onClick={() => setMode("signup")}>Sign up</Button>
          </div>

          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="email" type="email" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              <Button type="button" variant="outline" className="w-full" onClick={() => navigate("/worker/login")}>
                I’m a Worker
              </Button>
            </form>
          )}

          {mode === "signup" && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signupEmail">Email</Label>
                <Input id="signupEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signupPassword">Password</Label>
                <Input id="signupPassword" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Send OTP <ShieldCheck className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          )}

          {mode === "verify-otp" && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={pendingEmail} readOnly />
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp">OTP Code</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  placeholder="6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="tracking-widest text-center"
                  required
                  minLength={6}
                  maxLength={6}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Create Account"
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={loading}
                onClick={async () => {
                  try {
                    setLoading(true);
                    await sendOtp(pendingEmail);
                    toast({ title: "OTP resent", description: "A new code was sent to your email." });
                  } catch (err: any) {
                    toast({ title: "Error", description: err.message || "Could not resend", variant: "destructive" });
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Resend OTP
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
