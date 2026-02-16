import React from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Clock, ChevronRight, ShoppingBag } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import BottomNav from "@/components/layout/BottomNav";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600",
  searching: "bg-blue-500/10 text-blue-600",
  assigned: "bg-indigo-500/10 text-indigo-600",
  in_progress: "bg-orange-500/10 text-orange-600",
  completed: "bg-green-500/10 text-green-600",
  cancelled: "bg-red-500/10 text-red-600",
};

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const { orders, loading } = useOrders();
  const { isLoggedIn } = useAuth();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="container max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button size="icon" variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-foreground">My Orders</h1>
          </div>
        </div>
      </header>

      <main className="container max-w-md mx-auto px-4 py-6 space-y-6">
        {!isLoggedIn ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground mb-4">Please sign in to view your orders</p>
            <Button onClick={() => navigate("/auth")}>Sign In</Button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <ShoppingBag className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">No Orders Yet</h2>
            <p className="text-muted-foreground mb-6">Once you book a service it will appear here.</p>
            <Button onClick={() => navigate("/")}>Browse Services</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div
                key={o.id}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border",
                  "hover:border-muted-foreground/30 hover:shadow-card transition-all"
                )}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-secondary">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground">{o.service_name}</h4>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        statusColors[o.status] || "bg-muted"
                      )}
                    >
                      {o.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{o.service_type}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{format(new Date(o.scheduled_date), "MMM d")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{o.scheduled_time}</span>
                    </div>
                    <span className="font-semibold text-foreground">₹{o.total_amount}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Orders;
