import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorker } from "@/context/WorkerContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wrench, Hammer, Paintbrush, Zap, Phone, Lock, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WorkerLogin = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useWorker();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise((r) => setTimeout(r, 800));

    const success = login(phone, password);
    if (success) {
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });
      navigate("/worker");
    } else {
      toast({
        title: "Login failed",
        description: "Invalid credentials. Try 'demo' as phone number.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
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
        <h1 className="text-3xl font-extrabold text-foreground mb-2">
          Worker Portal
        </h1>
        <p className="text-muted-foreground font-medium">
          Login to manage your jobs & earnings
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

      {/* Login Form */}
      <div className="flex-1 px-6 py-8">
        <form onSubmit={handleLogin} className="space-y-5 max-w-sm mx-auto">
          <div className="space-y-2">
            <Label htmlFor="phone" className="font-semibold">
              Phone Number
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="Enter phone or 'demo'"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-11 h-12 text-base font-medium"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="font-semibold">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Enter password (any)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-11 h-12 text-base font-medium"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-bold"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="animate-pulse">Logging in...</span>
            ) : (
              <>
                Login <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </Button>
        </form>

        {/* Demo hint */}
        <div className="mt-8 p-4 bg-muted/50 rounded-xl max-w-sm mx-auto">
          <p className="text-sm text-muted-foreground text-center font-medium">
            <span className="font-bold text-foreground">Demo Mode:</span> Enter "demo" as phone number with any password
          </p>
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
