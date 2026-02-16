import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/layout/BottomNav";
import { useOrders } from "@/hooks/useOrders";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { orders, loading } = useOrders();
  const { isLoggedIn } = useAuth();

  // Generate notifications from order events
  const notifications = orders.map((o) => {
    let message = "";
    let icon = "📋";
    switch (o.status) {
      case "searching": message = "Searching for a worker..."; icon = "🔍"; break;
      case "assigned": message = "A worker has been assigned!"; icon = "✅"; break;
      case "in_progress": message = "Your service is in progress"; icon = "🔧"; break;
      case "completed": message = "Service completed successfully"; icon = "🎉"; break;
      case "cancelled": message = "Order was cancelled"; icon = "❌"; break;
      default: message = "Order placed"; icon = "📋";
    }
    return { id: o.id, serviceName: o.service_name, serviceType: o.service_type, message, icon, status: o.status, date: o.created_at };
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="container max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button size="icon" variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-foreground">Notifications</h1>
          </div>
        </div>
      </header>

      <main className="container max-w-md mx-auto px-4 py-6">
        {!isLoggedIn ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground mb-4">Sign in to see notifications</p>
            <Button onClick={() => navigate("/auth")}>Sign In</Button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className="bg-card p-4 rounded-xl border border-border">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{n.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{n.serviceName} — {n.serviceType}</p>
                    <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(n.date), "MMM d, yyyy · h:mm a")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Notifications;
