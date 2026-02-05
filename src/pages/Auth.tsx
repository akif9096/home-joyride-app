import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Wrench, User, Shield, Eye, EyeOff, ArrowLeft } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

type AuthMode = "login" | "signup" | "forgot-password" | "verify-otp" | "reset-password";
type UserType = "customer" | "worker" | "admin";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>("login");
  const [userType, setUserType] = useState<UserType>("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        if (password !== confirmPassword) {
          toast({
            title: "Error",
            description: "Passwords do not match",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          // Add role based on user type
          if (userType !== "customer") {
            const { error: roleError } = await supabase
              .from("user_roles")
              .insert({ user_id: data.user.id, role: userType });
            
            if (roleError) console.error("Role insert error:", roleError);
          }

          // If worker, create worker profile
          if (userType === "worker") {
            const { error: workerError } = await supabase
              .from("workers")
              .insert({ 
                user_id: data.user.id, 
                category: "plumber",
                is_verified: false,
                is_online: false 
              });
            
            if (workerError) console.error("Worker insert error:", workerError);
          }

          toast({
            title: "Verification email sent!",
            description: "Please check your email to verify your account.",
          });
          setPendingEmail(email);
          setMode("verify-otp");
        }
      } else if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Check user roles and redirect accordingly
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id);

        const userRoles = roles?.map((r) => r.role) || [];

        if (userRoles.includes("admin")) {
          navigate("/admin");
        } else if (userRoles.includes("worker")) {
          navigate("/worker");
        } else {
          navigate("/");
        }

        toast({
          title: "Welcome back!",
          description: "You have been logged in successfully.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Reset email sent!",
        description: "Check your email for the password reset link.",
      });
      setMode("login");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token: otp,
        type: "email",
      });

      if (error) throw error;

      toast({
        title: "Email verified!",
        description: "Your account has been verified. You can now log in.",
      });
      setMode("login");
      setOtp("");
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid or expired code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: pendingEmail,
      });

      if (error) throw error;

      toast({
        title: "Code resent!",
        description: "A new verification code has been sent to your email.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderBackButton = () => (
    <button
      type="button"
      onClick={() => setMode("login")}
      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to login
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">HomeServe</h1>
          <p className="text-muted-foreground mt-2">
            {mode === "login" && "Welcome back!"}
            {mode === "signup" && "Create your account"}
            {mode === "forgot-password" && "Reset your password"}
            {mode === "verify-otp" && "Verify your email"}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
          {/* Forgot Password Form */}
          {mode === "forgot-password" && (
            <>
              {renderBackButton()}
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            </>
          )}

          {/* OTP Verification Form */}
          {mode === "verify-otp" && (
            <>
              {renderBackButton()}
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Enter the 6-digit code sent to <strong>{pendingEmail}</strong>
                  </p>
                  <div className="flex justify-center">
                    <InputOTP
                      value={otp}
                      onChange={setOtp}
                      maxLength={6}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                  {loading ? "Verifying..." : "Verify Email"}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-sm text-primary hover:underline"
                    disabled={loading}
                  >
                    Didn't receive the code? Resend
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Login & Signup Forms */}
          {(mode === "login" || mode === "signup") && (
            <>
              {mode === "signup" && (
            <div className="mb-6">
              <Label className="text-sm font-medium mb-3 block">I am a</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { type: "customer" as UserType, icon: User, label: "Customer" },
                  { type: "worker" as UserType, icon: Wrench, label: "Worker" },
                  { type: "admin" as UserType, icon: Shield, label: "Admin" },
                ].map(({ type, icon: Icon, label }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setUserType(type)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                      userType === type
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>
              )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => setMode("forgot-password")}
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
              <Input
                id="password"
                      type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                      className="pr-10"
              />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-sm text-primary hover:underline"
            >
              {mode === "login"
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
