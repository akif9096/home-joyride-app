import { useState, useEffect } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  IndianRupee,
  User,
  Phone,
  Star,
  CheckCircle,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Order = {
  id: string;
  service_name: string;
  service_type: string;
  service_icon: string | null;
  category: string;
  status: string;
  total_amount: number;
  scheduled_date: string;
  scheduled_time: string;
  address_text: string;
  otp: string | null;
  worker_id: string | null;
  created_at: string;
};

interface OrderStatusTrackerProps {
  order: Order;
  onClose: () => void;
}

const statusConfig = {
  searching: {
    icon: Loader2,
    title: "Finding a Professional",
    description: "We're matching you with the best available worker",
    color: "text-primary",
    animate: true,
  },
  assigned: {
    icon: User,
    title: "Worker Assigned",
    description: "A professional has accepted your order",
    color: "text-purple-500",
    animate: false,
  },
  in_progress: {
    icon: Clock,
    title: "Service In Progress",
    description: "Your service is being performed",
    color: "text-orange-500",
    animate: false,
  },
  completed: {
    icon: CheckCircle,
    title: "Service Completed",
    description: "Your service has been completed successfully",
    color: "text-green-500",
    animate: false,
  },
  cancelled: {
    icon: X,
    title: "Order Cancelled",
    description: "This order has been cancelled",
    color: "text-red-500",
    animate: false,
  },
  pending: {
    icon: Loader2,
    title: "Order Pending",
    description: "Your order is being processed",
    color: "text-yellow-500",
    animate: true,
  },
};

const statusSteps = ["searching", "assigned", "in_progress", "completed"];

type Worker = {
  id: string;
  rating: number;
  total_jobs: number;
  profiles?: { full_name: string; phone: string };
};

const OrderStatusTracker = ({ order, onClose }: OrderStatusTrackerProps) => {
  const [worker, setWorker] = useState<Worker | null>(null);
  const [currentOrder, setCurrentOrder] = useState(order);

  const config = statusConfig[currentOrder.status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;

  useEffect(() => {
    if (currentOrder.worker_id) {
      fetchWorkerDetails();
    }

    // Subscribe to order updates
    const channel = supabase
      .channel(`order-${order.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          setCurrentOrder((prev) => ({ ...prev, ...payload.new }));
          if ((payload.new as any).worker_id && !(payload.old as any).worker_id) {
            fetchWorkerDetails();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id, currentOrder.worker_id]);

  const fetchWorkerDetails = async () => {
    if (!currentOrder.worker_id) return;

    const { data } = await supabase
      .from("workers")
      .select(`
        id,
        rating,
        total_jobs,
        profiles:user_id (full_name, phone)
      `)
      .eq("id", currentOrder.worker_id)
      .maybeSingle();

    if (data) {
      setWorker(data as any);
    }
  };

  const handleCancel = async () => {
    await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", currentOrder.id);
    
    onClose();
  };

  const currentStepIndex = statusSteps.indexOf(currentOrder.status);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary px-4 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-primary-foreground" />
          </button>
          <div>
            <p className="text-sm text-primary-foreground/70">Order #{currentOrder.id.slice(0, 8)}</p>
            <h1 className="text-xl font-bold text-primary-foreground">Track Order</h1>
          </div>
        </div>

        {currentOrder.otp && currentOrder.status !== "cancelled" && (
          <div className="bg-primary-foreground/10 rounded-xl p-4 text-center">
            <p className="text-xs text-primary-foreground/70 mb-1">Service OTP</p>
            <p className="text-3xl font-mono font-bold tracking-widest text-primary-foreground">
              {currentOrder.otp}
            </p>
            <p className="text-xs text-primary-foreground/70 mt-1">Share with worker to start service</p>
          </div>
        )}
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Current Status */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center",
              config.color.replace("text-", "bg-") + "/10"
            )}>
              <Icon className={cn("w-7 h-7", config.color, config.animate && "animate-spin")} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{config.title}</h2>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-6">
            {statusSteps.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              return (
                <div key={step} className="flex items-center flex-1">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                      isCompleted
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
                  </div>
                  {index < statusSteps.length - 1 && (
                    <div
                      className={cn(
                        "flex-1 h-1 mx-1",
                        index < currentStepIndex ? "bg-primary" : "bg-muted"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Worker Info */}
        {worker && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Your Professional</h3>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                👷
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-foreground">
                  {worker.profiles?.full_name || "Professional"}
                </h4>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-warning fill-warning" />
                    {Number(worker.rating).toFixed(1)}
                  </span>
                  <span>{worker.total_jobs} jobs</span>
                </div>
              </div>
              {worker.profiles?.phone && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(`tel:${worker.profiles?.phone}`)}
                >
                  <Phone className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Service Details */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Service Details</h3>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-xl">
              {currentOrder.service_icon === "plumber" ? "🔧" :
               currentOrder.service_icon === "carpenter" ? "🔨" :
               currentOrder.service_icon === "painter" ? "🎨" :
               currentOrder.service_icon === "electrician" ? "⚡" : "🔧"}
            </div>
            <div>
              <p className="font-bold text-foreground">{currentOrder.service_name}</p>
              <p className="text-sm text-muted-foreground">{currentOrder.service_type}</p>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{format(new Date(currentOrder.scheduled_date), "EEEE, MMMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{currentOrder.scheduled_time}</span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
              <span>{currentOrder.address_text}</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-bold">
              <IndianRupee className="w-4 h-4 text-primary" />
              <span className="text-primary">₹{Number(currentOrder.total_amount).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Cancel Button */}
        {currentOrder.status !== "completed" && currentOrder.status !== "cancelled" && (
          <Button
            variant="outline"
            className="w-full text-destructive border-destructive hover:bg-destructive/10"
            onClick={handleCancel}
          >
            Cancel Order
          </Button>
        )}
      </div>
    </div>
  );
};

export default OrderStatusTracker;
