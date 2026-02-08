import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Wrench, User, Shield, Eye, EyeOff, Loader2 } from "lucide-react";

type AuthMode = "login" | "signup" | "forgot-password";
type UserType = "customer" | "worker" | "admin";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setUserRole } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [userType, setUserType] = useState<UserType>("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Handle both login and signup
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        // Validation
        if (!fullName.trim()) {
          throw new Error("Please enter your full name");
        }
        if (!email || !email.includes("@")) {
          throw new Error("Please enter a valid email");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Try direct signup with Supabase
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        console.debug("signUpData:", signUpData, "signUpError:", signUpError);

        if (signUpError) {
          throw new Error(
            signUpError.message.includes("already registered")
              ? "An account with this email already exists. Please sign in."
              : signUpError.message
          );
        }

        if (!signUpData?.user) {
          throw new Error("Account creation failed. Please try again.");
        }

        // Insert user role
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: signUpData.user.id,
          role: userType,
        });

        if (roleError) {
          console.error("Role insert error:", roleError);
        }

        // If worker, create worker profile
        if (userType === "worker") {
          const { error: workerError } = await supabase.from("workers").insert({
            user_id: signUpData.user.id,
            category: "plumber",
            is_verified: false,
            is_online: false,
          });

          if (workerError) {
            console.error("Worker profile insert error:", workerError);
          }
        }

        // Try to auto sign in (if email confirmation is disabled)
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (signInError) {
          // Email confirmation required - guide user to check email
          toast({
            title: "Account created!",
            description:
              "Please check your email for a confirmation link to verify your account before signing in.",
          });
          setMode("login");
          setEmail(normalizedEmail);
          setPassword("");
          setConfirmPassword("");
          setFullName("");
        } else {
          // Auto sign-in successful
          const roleToStore: "customer" | "worker" | "admin" | null = userType;
          try {
            await setUserRole(roleToStore);
            localStorage.setItem("user_role", JSON.stringify(roleToStore));
          } catch {}

          toast({
            title: "Account created!",
            description: "You are now signed in.",
          });

          // Redirect based on role
          if (userType === "admin") {
            navigate("/admin");
          } else if (userType === "worker") {
            navigate("/worker");
          } else {
            navigate("/");
          }
        }
      } else if (mode === "login") {
        // Validate
        if (!email || !email.includes("@")) {
          throw new Error("Please enter a valid email");
        }
        if (!password || password.length < 6) {
          throw new Error("Please enter your password");
        }

        const normalizedEmail = email.trim().toLowerCase();

        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error) {
          console.error("signInWithPassword error:", error);
          const msg = String(error.message || "Invalid login credentials");

          // Provide helpful error messages
          if (/confirm|verify|verification|email.*confirm/i.test(msg)) {
            throw new Error(
              "Please confirm your email first. Check your inbox for a verification link."
            );
          }
          if (/invalid login|invalid email|invalid credentials/i.test(msg)) {
            throw new Error(
              "Invalid email or password. Check your credentials and try again, or use magic link."
            );
          }
          throw new Error(msg);
        }

        if (!data.user) {
          throw new Error(
            "Login failed. Please verify your email and try again."
          );
        }

        // Get or set user role
        const { data: roles, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id);

        let userRoles: string[] = [];
        if (!roleError && roles && roles.length > 0) {
          userRoles = roles.map((r) => r.role);
        } else {
          // No role found, use selected role
          userRoles = [userType];
          await supabase.from("user_roles").insert({
            user_id: data.user.id,
            role: userType,
          });
        }

        const roleToStore: "customer" | "worker" | "admin" | null = userRoles[0] || userType;
        try {
          await setUserRole(roleToStore);
          localStorage.setItem("user_role", JSON.stringify(roleToStore));
        } catch {}

        toast({
          title: "Welcome back!",
          description: "You are now signed in.",
        });

        // Redirect based on actual role
        if (userRoles.includes("admin")) {
          navigate("/admin");
        } else if (userRoles.includes("worker")) {
          navigate("/worker");
        } else {
          navigate("/");
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast({
        title: mode === "signup" ? "Signup Error" : "Login Error",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle magic link sign-in
  const handleMagicLink = async () => {
    if (!email || !email.includes("@")) {
      toast({
        title: "Email required",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
      });

      if (error) throw error;

      toast({
        title: "Magic link sent!",
        description: "Check your email for a sign-in link.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send magic link.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!email || !email.includes("@")) {
        throw new Error("Please enter a valid email");
      }

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase()
      );

      if (error) throw error;

      toast({
        title: "Reset link sent!",
        description: "Check your email for a password reset link.",
      });

      setMode("login");
      setEmail("");
      setPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset link.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">HomeServe</h1>
          <p className="text-muted-foreground mt-2">
            {mode === "login" && "Welcome back!"}
            {mode === "signup" && "Create your account"}
            {mode === "forgot-password" && "Reset your password"}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
          {/* Forgot Password Form */}
          {mode === "forgot-password" && (
            <>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setEmail("");
                  setPassword("");
                }}
                className="text-sm text-primary hover:underline mb-4"
              >
                ← Back to login
              </button>

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
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            </>
          )}

          {/* Login & Signup Forms */}
          {(mode === "login" || mode === "signup") && (
            <>
              {/* Role Selector */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-3 block">
                  {mode === "login" ? "Logging in as" : "I am a"}
                </Label>
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
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Please wait...
                    </>
                  ) : mode === "login" ? (
                    "Sign In"
                  ) : (
                    "Create Account"
                  )}
                </Button>

                {mode === "login" && (
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleMagicLink}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Sign in with magic link"
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      No password? Use a magic link sent to your email.
                    </p>
                  </div>
                )}
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "login" ? "signup" : "login");
                    setEmail("");
                    setPassword("");
                    setConfirmPassword("");
                    setFullName("");
                  }}
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
