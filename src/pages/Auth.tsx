import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Wrench, User, Shield } from "lucide-react";

type AuthMode = "login" | "signup";
type UserType = "customer" | "worker" | "admin";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>("login");
  const [userType, setUserType] = useState<UserType>("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
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
            title: "Account created!",
            description: "You can now log in to your account.",
          });
          setMode("login");
        }
      } else {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">HomeServe</h1>
          <p className="text-muted-foreground mt-2">
            {mode === "login" ? "Welcome back!" : "Create your account"}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

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
        </div>
      </div>
    </div>
  );
};

export default Auth;
