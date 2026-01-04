import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle2, AlertCircle, PartyPopper } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Order = {
  id: string;
  service_name: string;
  service_type: string;
  total_amount: number;
  otp: string | null;
  customer_id: string;
  profiles?: { full_name: string };
};

const CompleteJob = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [jobId]);

  const fetchOrder = async () => {
    if (!jobId) {
      navigate("/worker");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    // Get worker
    const { data: worker } = await supabase
      .from("workers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!worker) {
      navigate("/worker");
      return;
    }

    // Get order
    const { data: orderData } = await supabase
      .from("orders")
      .select("*")
      .eq("id", jobId)
      .eq("worker_id", worker.id)
      .maybeSingle();

    if (!orderData) {
      toast({
        title: "Order not found",
        description: "This order does not exist or is not assigned to you",
        variant: "destructive",
      });
      navigate("/worker");
      return;
    }

    // Get customer name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", orderData.customer_id)
      .maybeSingle();

    setOrder({ ...orderData, profiles: profile || undefined } as Order);
    setLoading(false);
  };

  const handleComplete = async () => {
    if (!order) return;

    if (otp.length !== 4) {
      setError("Please enter the 4-digit OTP");
      return;
    }

    if (otp !== order.otp) {
      setError("Invalid OTP. Please try again.");
      return;
    }

    // Update order status to completed
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: "completed" })
      .eq("id", order.id);

    if (updateError) {
      toast({
        title: "Error",
        description: updateError.message,
        variant: "destructive",
      });
      return;
    }

    // Update transaction if exists (mark cash as paid)
    await supabase
      .from("transactions")
      .update({ 
        payment_status: "paid",
        paid_at: new Date().toISOString()
      })
      .eq("order_id", order.id)
      .eq("payment_method", "cash");

    // Update worker stats
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: worker } = await supabase
        .from("workers")
        .select("total_jobs")
        .eq("user_id", user.id)
        .maybeSingle();

      if (worker) {
        await supabase
          .from("workers")
          .update({ total_jobs: (worker.total_jobs || 0) + 1 })
          .eq("user_id", user.id);
      }
    }

    setIsCompleted(true);
    toast({
      title: "Job Completed! 🎉",
      description: `You earned ₹${Number(order.total_amount).toLocaleString()} for this job.`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="text-center animate-in">
          <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <PartyPopper className="w-12 h-12 text-success" />
          </div>
          <h1 className="text-2xl font-extrabold mb-2">Job Completed!</h1>
          <p className="text-muted-foreground font-medium mb-2">
            Great work! You've earned
          </p>
          <p className="text-4xl font-extrabold text-success mb-8">
            ₹{Number(order.total_amount).toLocaleString()}
          </p>
          <Button onClick={() => navigate("/worker")} className="font-bold">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 pt-12 pb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/worker")}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold">Complete Job</h1>
            <p className="text-sm text-muted-foreground font-medium">
              Enter OTP to finish
            </p>
          </div>
        </div>
      </div>

      {/* Job Details */}
      <div className="px-6 py-6">
        <Card className="shadow-card mb-6">
          <CardContent className="p-4">
            <h3 className="font-bold mb-2">{order.service_type}</h3>
            <p className="text-sm text-muted-foreground mb-1">
              Customer: {order.profiles?.full_name || "Customer"}
            </p>
            <p className="text-lg font-extrabold text-success">
              Earnings: ₹{Number(order.total_amount).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* OTP Input */}
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-lg font-bold mb-1">Enter Customer OTP</h2>
              <p className="text-sm text-muted-foreground">
                Ask the customer for the 4-digit code
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="otp" className="font-semibold">
                  OTP Code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  maxLength={4}
                  placeholder="Enter 4-digit OTP"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 4));
                    setError("");
                  }}
                  className="h-14 text-center text-2xl font-extrabold tracking-widest"
                />
                {error && (
                  <div className="flex items-center gap-2 mt-2 text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                )}
              </div>

              <Button
                onClick={handleComplete}
                className="w-full h-12 font-bold bg-success hover:bg-success/90"
                disabled={otp.length !== 4}
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Complete Job
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompleteJob;
