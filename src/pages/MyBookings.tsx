import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Clock, MapPin, ChevronRight, RefreshCw } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import OrderStatusTracker from "@/components/services/OrderStatusTracker";
import PaymentModal from "@/components/customer/PaymentModal";

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-500/10 text-yellow-600" },
  searching: { label: "Finding Pro", color: "bg-primary/10 text-primary" },
  assigned: { label: "Assigned", color: "bg-purple-500/10 text-purple-600" },
  in_progress: { label: "In Progress", color: "bg-orange-500/10 text-orange-600" },
  completed: { label: "Completed", color: "bg-green-500/10 text-green-600" },
  cancelled: { label: "Cancelled", color: "bg-red-500/10 text-red-600" },
};

const serviceIcons: Record<string, string> = {
  plumber: "🔧",
  carpenter: "🔨",
  painter: "🎨",
  electrician: "⚡",
  cleaner: "🧹",
  ac_repair: "❄️",
};

const MyBookings: React.FC = () => {
  const navigate = useNavigate();
  const { orders, loading, refetch } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const activeOrders = orders.filter(
    (o) => !["completed", "cancelled"].includes(o.status)
  );
  const pastOrders = orders.filter((o) =>
    ["completed", "cancelled"].includes(o.status)
  );

  const handleOrderClick = (order: any) => {
    if (order.status === "assigned" && !order.worker_id) {
      setSelectedOrder(order);
      setShowPaymentModal(true);
    } else {
      setSelectedOrder(order);
    }
  };

  // Show order tracker if viewing an active order
  if (selectedOrder && ["searching", "assigned", "in_progress"].includes(selectedOrder.status)) {
    return (
      <>
        <OrderStatusTracker
          order={selectedOrder}
          onClose={() => {
            setSelectedOrder(null);
            refetch();
          }}
        />
        {selectedOrder.status === "assigned" && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            orderId={selectedOrder.id}
            amount={Number(selectedOrder.total_amount)}
            onPaymentComplete={() => {
              setShowPaymentModal(false);
              refetch();
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="container max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button size="icon" variant="ghost" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-bold text-foreground">My Bookings</h1>
            </div>
            <Button size="icon" variant="ghost" onClick={refetch}>
              <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-md mx-auto px-4 py-6 space-y-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-muted-foreground">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Calendar className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">No Bookings Yet</h2>
            <p className="text-muted-foreground mb-6">
              Book your first home service and it will appear here
            </p>
            <Button onClick={() => navigate("/")}>Browse Services</Button>
          </div>
        ) : (
          <>
            {/* Active Bookings */}
            {activeOrders.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                  Active Bookings ({activeOrders.length})
                </h2>
                <div className="space-y-3">
                  {activeOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onClick={() => handleOrderClick(order)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Past Bookings */}
            {pastOrders.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                  Past Bookings ({pastOrders.length})
                </h2>
                <div className="space-y-3">
                  {pastOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onClick={() => handleOrderClick(order)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
};

interface OrderCardProps {
  order: any;
  onClick: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onClick }) => {
  const status = statusLabels[order.status] || statusLabels.pending;
  const icon = serviceIcons[order.category] || "🔧";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border",
        "hover:border-muted-foreground/30 hover:shadow-card transition-all",
        "text-left"
      )}
    >
      {/* Service Icon */}
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-foreground">{order.service_name}</h4>
          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", status.color)}>
            {status.label}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-2">{order.service_type}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{format(new Date(order.scheduled_date), "MMM d")}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{order.scheduled_time}</span>
          </div>
        </div>
      </div>

      {/* Amount & Arrow */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-primary">
          ₹{Number(order.total_amount).toLocaleString()}
        </span>
        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      </div>
    </button>
  );
};

export default MyBookings;
