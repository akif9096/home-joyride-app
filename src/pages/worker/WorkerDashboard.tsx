import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Star,
  Briefcase,
  Clock,
  MapPin,
  Phone,
  ChevronRight,
  User,
  TrendingUp,
  CheckCircle2,
  Bell,
  LogOut,
} from "lucide-react";
import WorkerNav from "@/components/worker/WorkerNav";
import OrderAlertModal from "@/components/worker/OrderAlertModal";
import PendingOrdersCard from "@/components/worker/PendingOrdersCard";
import { useWorkerNotifications } from "@/hooks/useWorkerNotifications";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type WorkerData = {
  id: string;
  user_id: string;
  category: "plumber" | "carpenter" | "painter" | "electrician" | "cleaner" | "ac_repair";
  rating: number;
  total_jobs: number;
  is_verified: boolean;
  is_online: boolean;
  experience_years: number;
};

type ActiveOrder = {
  id: string;
  service_name: string;
  service_type: string;
  category: string;
  status: string;
  total_amount: number;
  scheduled_date: string;
  scheduled_time: string;
  address_text: string;
  otp: string | null;
  customer_id: string;
  profiles?: { full_name: string; phone: string };
};

const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    plumber: "🔧",
    carpenter: "🔨",
    painter: "🎨",
    electrician: "⚡",
    cleaner: "🧹",
    ac_repair: "❄️",
  };
  return icons[category] || "🔧";
};

const getCategoryLabel = (category: string) => {
  return category.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
};

const WorkerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [worker, setWorker] = useState<WorkerData | null>(null);
  const [workerName, setWorkerName] = useState("Worker");
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [showAlerts, setShowAlerts] = useState(false);

  const { pendingOrders, isRinging, acceptOrder, rejectOrder } = useWorkerNotifications(
    worker?.id || null,
    worker?.category || null
  );

  useEffect(() => {
    checkWorkerAuth();
  }, []);

  useEffect(() => {
    if (worker) {
      fetchActiveOrder();
      fetchTodayEarnings();
      subscribeToOrders();
    }
  }, [worker]);

  // Show modal when there are pending orders
  useEffect(() => {
    if (pendingOrders.length > 0 && worker?.is_online) {
      setShowAlerts(true);
    }
  }, [pendingOrders, worker?.is_online]);

  const checkWorkerAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    // Check if user is a worker
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isWorker = roles?.some((r) => r.role === "worker");
    if (!isWorker) {
      toast({
        title: "Access Denied",
        description: "You are not registered as a worker",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    // Fetch worker profile
    const { data: workerData, error } = await supabase
      .from("workers")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !workerData) {
      toast({
        title: "Error",
        description: "Could not fetch worker profile",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setWorker(workerData as WorkerData);

    // Fetch worker name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.full_name) {
      setWorkerName(profile.full_name);
    }

    setLoading(false);
  };

  const fetchActiveOrder = async () => {
    if (!worker) return;

    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("worker_id", worker.id)
      .in("status", ["assigned", "in_progress"])
      .maybeSingle();

    if (data) {
      // Fetch customer info
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", data.customer_id)
        .maybeSingle();

      setActiveOrder({ ...data, profiles: profile || undefined } as ActiveOrder);
    } else {
      setActiveOrder(null);
    }
  };

  const fetchTodayEarnings = async () => {
    if (!worker) return;

    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("transactions")
      .select("amount")
      .eq("worker_id", worker.id)
      .eq("payment_status", "paid")
      .gte("created_at", today);

    if (data) {
      const total = data.reduce((sum, t) => sum + Number(t.amount), 0);
      setTodayEarnings(total);
    }
  };

  const subscribeToOrders = () => {
    if (!worker) return;

    const channel = supabase
      .channel("worker-active-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `worker_id=eq.${worker.id}`,
        },
        () => {
          fetchActiveOrder();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const toggleOnlineStatus = async () => {
    if (!worker) return;

    const { error } = await supabase
      .from("workers")
      .update({ is_online: !worker.is_online })
      .eq("id", worker.id);

    if (!error) {
      setWorker({ ...worker, is_online: !worker.is_online });
      toast({
        title: worker.is_online ? "You're now offline" : "You're now online",
        description: worker.is_online
          ? "You won't receive new job requests"
          : "You'll receive new job requests",
      });
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: "pending" | "searching" | "assigned" | "in_progress" | "completed" | "cancelled") => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (!error) {
      fetchActiveOrder();
      toast({
        title: "Status Updated",
        description: `Order status changed to ${newStatus.replace("_", " ")}`,
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
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

  if (!worker) return null;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Order Alert Modal */}
      <OrderAlertModal
        orders={pendingOrders}
        isOpen={showAlerts && pendingOrders.length > 0}
        onClose={() => setShowAlerts(false)}
        onAccept={acceptOrder}
        onReject={rejectOrder}
      />

      {/* Header */}
      <div className="bg-primary px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-primary-foreground/20 flex items-center justify-center text-2xl">
              {getCategoryIcon(worker.category)}
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-primary-foreground">
                {workerName}
              </h1>
              <p className="text-primary-foreground/80 font-medium">
                {getCategoryLabel(worker.category)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingOrders.length > 0 && worker.is_online && (
              <Button
                variant="ghost"
                size="icon"
                className="relative text-primary-foreground"
                onClick={() => setShowAlerts(true)}
              >
                <Bell className={`w-5 h-5 ${isRinging ? "animate-bounce" : ""}`} />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-xs flex items-center justify-center">
                  {pendingOrders.length}
                </span>
              </Button>
            )}
            <Switch
              checked={worker.is_online}
              onCheckedChange={toggleOnlineStatus}
            />
            <span className="text-sm font-bold text-primary-foreground">
              {worker.is_online ? "Online" : "Offline"}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-primary-foreground/10 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-4 h-4 text-warning" fill="currentColor" />
              <span className="text-lg font-extrabold text-primary-foreground">
                {Number(worker.rating).toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-primary-foreground/70 font-medium">Rating</p>
          </div>
          <div className="bg-primary-foreground/10 rounded-xl p-3 text-center">
            <div className="text-lg font-extrabold text-primary-foreground mb-1">
              {worker.total_jobs}
            </div>
            <p className="text-xs text-primary-foreground/70 font-medium">Jobs Done</p>
          </div>
          <div className="bg-primary-foreground/10 rounded-xl p-3 text-center">
            <div className="text-lg font-extrabold text-primary-foreground mb-1">
              {worker.experience_years}y
            </div>
            <p className="text-xs text-primary-foreground/70 font-medium">Experience</p>
          </div>
        </div>
      </div>

      {/* Today's Earnings */}
      <div className="px-6 -mt-4">
        <Card className="shadow-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Today's Earnings</p>
                  <p className="text-2xl font-extrabold text-foreground">₹{todayEarnings.toLocaleString()}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/worker/earnings")}>
                <TrendingUp className="w-5 h-5 mr-1" />
                Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Job */}
      {activeOrder && (
        <div className="px-6 mt-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Active Job
          </h2>
          <Card className="shadow-card border-2 border-primary">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="secondary" className="font-bold">
                  {activeOrder.service_type}
                </Badge>
                <span className="text-lg font-extrabold text-success">
                  ₹{Number(activeOrder.total_amount).toLocaleString()}
                </span>
              </div>

              {activeOrder.otp && (
                <div className="bg-primary/10 rounded-lg p-3 mb-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Service OTP</p>
                  <p className="text-2xl font-mono font-bold tracking-widest text-primary">
                    {activeOrder.otp}
                  </p>
                </div>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold">{activeOrder.profiles?.full_name || "Customer"}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <span className="text-muted-foreground">{activeOrder.address_text}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">
                    {format(new Date(activeOrder.scheduled_date), "MMM d")} at {activeOrder.scheduled_time}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                {activeOrder.status === "assigned" && (
                  <Button
                    className="flex-1 font-bold"
                    onClick={() => updateOrderStatus(activeOrder.id, "in_progress")}
                  >
                    Start Work
                  </Button>
                )}
                {activeOrder.status === "in_progress" && (
                  <Button
                    className="flex-1 font-bold bg-success hover:bg-success/90"
                    onClick={() => navigate(`/worker/complete/${activeOrder.id}`)}
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Complete Job
                  </Button>
                )}
                {activeOrder.profiles?.phone && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(`tel:${activeOrder.profiles?.phone}`)}
                  >
                    <Phone className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending Orders Alert */}
      {!activeOrder && pendingOrders.length > 0 && worker.is_online && (
        <div className="px-6 mt-6">
          <Button
            className="w-full h-16 text-lg font-bold animate-pulse"
            onClick={() => setShowAlerts(true)}
          >
            <Bell className="w-6 h-6 mr-3" />
            {pendingOrders.length} New Job Request{pendingOrders.length > 1 ? "s" : ""} - Tap to View
          </Button>
        </div>
      )}

      {/* Pending Orders Card */}
      {pendingOrders.length > 0 && (
        <div className="mt-6">
          <PendingOrdersCard
            orders={pendingOrders}
            onAccept={acceptOrder}
            onReject={rejectOrder}
          />
        </div>
      )}

      {/* Quick Links */}
      <div className="px-6 mt-6 pb-6">
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-between h-14 px-4 font-semibold"
            onClick={() => navigate("/worker/jobs")}
          >
            <span className="flex items-center gap-3">
              <Briefcase className="w-5 h-5" />
              Job History
            </span>
            <ChevronRight className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-between h-14 px-4 font-semibold"
            onClick={() => navigate("/worker/availability")}
          >
            <span className="flex items-center gap-3">
              <Clock className="w-5 h-5" />
              Set Availability
            </span>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <WorkerNav />
    </div>
  );
};

export default WorkerDashboard;
