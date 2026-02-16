import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useWorker } from "@/context/WorkerContext";
import {
  Wrench,
  Hammer,
  Paintbrush,
  Zap,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";

type Mode = "login" | "signup" | "verify-otp";

type PendingWorker = {
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
  if (!resp.ok) {
    throw new Error(json?.error || "Request failed");
  }
  return json as T;
};

const WorkerLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useWorker();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [pending, setPending] = useState<PendingWorker | null>(null);
  const pendingEmail = useMemo(() => pending?.email || email.trim().toLowerCase(), [pending, email]);

  const sendOtp = async (targetEmail: string) => {
    await callFunction("send-otp", { email: targetEmail, type: "signup" });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ok = await login(email, password);
      if (!ok) {
        throw new Error("Access denied. This account is not registered as a worker.");
      }
      toast({ title: "Welcome!", description: "Logged in to Worker Portal." });
      navigate("/worker");
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message || "Invalid credentials", variant: "destructive" });
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
      // verify OTP
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

      // create user (server-side) with worker role + worker profile
      const result = await callFunction<{ success?: boolean; existing?: boolean; message?: string }>("create-user", {
        email: pending.email,
        password: pending.password,
        fullName: pending.fullName,
        userType: "worker",
      });

      // sign in and go to dashboard
      const ok = await login(pending.email, pending.password);
      if (!ok) throw new Error("Worker signup completed, but login failed. Please try logging in.");

      toast({
        title: result.existing ? "Worker role added" : "Account created",
        description: result.existing ? "Your existing account now has worker access." : "Welcome to the Worker Portal.",
      });
      navigate("/worker");
    } catch (err: any) {
      toast({ title: "Verification failed", description: err.message || "Could not verify", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex flex-col">
      {/* Header */}
      <div className="p-6 text-center pt-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-glow">
            <Wrench className="w-7 h-7 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold text-foreground mb-2">Worker Portal</h1>
        <p className="text-muted-foreground font-medium">
          {mode === "login" && "Log in to manage your jobs & earnings"}
          {mode === "signup" && "Create your worker account"}
          {mode === "verify-otp" && "Verify your email with OTP"}
        </p>
      </div>

      {/* Service Icons */}
      <div className="flex justify-center gap-4 py-6">
        <div className="w-12 h-12 rounded-xl bg-service-plumber/20 flex items-center justify-center">
          <Wrench className="w-6 h-6 text-service-plumber" />
        </div>
        <div className="w-12 h-12 rounded-xl bg-service-carpenter/20 flex items-center justify-center">
          <Hammer className="w-6 h-6 text-service-carpenter" />
        </div>
        <div className="w-12 h-12 rounded-xl bg-service-painter/20 flex items-center justify-center">
          <Paintbrush className="w-6 h-6 text-service-painter" />
        </div>
        <div className="w-12 h-12 rounded-xl bg-service-electrician/20 flex items-center justify-center">
          <Zap className="w-6 h-6 text-service-electrician" />
        </div>
      </div>

      <div className="flex-1 px-6 py-8">
        <div className="max-w-sm mx-auto">
          {/* Mode tabs */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            <Button
              type="button"
              variant={mode === "login" ? "default" : "outline"}
              onClick={() => setMode("login")}
            >
              Login
            </Button>
            <Button
              type="button"
              variant={mode === "signup" ? "default" : "outline"}
              onClick={() => setMode("signup")}
            >
              Sign up
            </Button>
          </div>

          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 h-12 text-base font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-semibold">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 pr-11 h-12 text-base font-medium"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-base font-bold" disabled={loading}>
                {loading ? (
                  <span className="animate-pulse">Logging in...</span>
                ) : (
                  <>
                    Login <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </form>
          )}

          {mode === "signup" && (
            <form onSubmit={handleSignup} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="font-semibold">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-12 text-base font-medium"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signupEmail" className="font-semibold">Email</Label>
                <Input
                  id="signupEmail"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-base font-medium"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signupPassword" className="font-semibold">Password</Label>
                <Input
                  id="signupPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-base font-medium"
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" className="w-full h-12 text-base font-bold" disabled={loading}>
                {loading ? (
                  <span className="animate-pulse">Sending OTP...</span>
                ) : (
                  <>
                    Send OTP <ShieldCheck className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </form>
          )}

          {mode === "verify-otp" && (
            <form onSubmit={handleVerify} className="space-y-5">
              <div className="space-y-2">
                <Label className="font-semibold">Email</Label>
                <Input value={pendingEmail} readOnly className="h-12 text-base font-medium" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp" className="font-semibold">OTP Code</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  placeholder="6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="h-12 text-base font-medium tracking-widest text-center"
                  required
                  minLength={6}
                  maxLength={6}
                />
              </div>

              <Button type="submit" className="w-full h-12 text-base font-bold" disabled={loading || otp.length !== 6}>
                {loading ? <span className="animate-pulse">Verifying...</span> : "Verify & Create Account"}
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

          <div className="mt-8 p-4 bg-muted/50 rounded-xl">
            <p className="text-sm text-muted-foreground text-center font-medium">
              Worker accounts must be approved/verified by the platform.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 text-center">
        <button
          onClick={() => navigate("/")}
          className="text-sm text-muted-foreground font-semibold hover:text-primary transition-colors"
        >
          ← Back to Customer App
        </button>
      </div>
    </div>
  );
};

export default WorkerLogin;
