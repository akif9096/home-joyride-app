import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Calendar,
  Clock,
  IndianRupee,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Order = {
  id: string;
  service_name: string;
  service_type: string;
  category: string;
  address_text: string;
  scheduled_date: string;
  scheduled_time: string;
  total_amount: number;
};

interface PendingOrdersCardProps {
  orders: Order[];
  onAccept: (orderId: string) => Promise<{ error: any }>;
  onReject: (orderId: string) => void;
}

const PendingOrdersCard = ({
  orders,
  onAccept,
  onReject,
}: PendingOrdersCardProps) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const handleAccept = async (orderId: string) => {
    setAcceptingId(orderId);
    await onAccept(orderId);
    setAcceptingId(null);
    setSelectedOrder(null);
  };

  const handleReject = (orderId: string) => {
    setRejectingId(orderId);
    onReject(orderId);
    setRejectingId(null);
    setSelectedOrder(null);
  };

  if (orders.length === 0) return null;

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-6">
          <h2 className="text-lg font-bold flex-1">
            Pending Orders ({orders.length})
          </h2>
          <Badge variant="secondary" className="bg-primary/20 text-primary font-bold">
            New
          </Badge>
        </div>

        {orders.slice(0, 3).map((order) => (
          <div key={order.id} className="px-6">
            <Card className="shadow-card border-l-4 border-l-primary cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">{order.service_name}</h3>
                    <p className="text-sm text-muted-foreground">{order.service_type}</p>
                  </div>
                  <span className="text-lg font-extrabold text-success flex items-center gap-1">
                    <IndianRupee className="w-4 h-4" />
                    {Number(order.total_amount).toLocaleString()}
                  </span>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="line-clamp-1">{order.address_text}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>{format(new Date(order.scheduled_date), "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span>{order.scheduled_time}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-destructive hover:bg-destructive/10"
                    disabled={rejectingId === order.id}
                    onClick={() => handleReject(order.id)}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    {rejectingId === order.id ? "Rejecting..." : "Reject"}
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-success hover:bg-success/90"
                    disabled={acceptingId === order.id}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    {acceptingId === order.id ? "Accepting..." : "Accept"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}

        {orders.length > 3 && (
          <div className="px-6">
            <Button variant="ghost" className="w-full text-primary font-semibold">
              View all {orders.length} pending orders
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedOrder?.service_name}</DialogTitle>
            <DialogDescription>
              {selectedOrder?.service_type}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="text-lg font-bold text-success">
                    ₹{Number(selectedOrder.total_amount).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span className="text-sm font-medium text-right flex-1 ml-2">
                    {selectedOrder.address_text}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {format(new Date(selectedOrder.scheduled_date), "MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">{selectedOrder.scheduled_time}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 text-destructive"
                  onClick={() => handleReject(selectedOrder.id)}
                  disabled={rejectingId === selectedOrder.id}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  className="flex-1 bg-success hover:bg-success/90"
                  onClick={() => handleAccept(selectedOrder.id)}
                  disabled={acceptingId === selectedOrder.id}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {acceptingId === selectedOrder.id ? "Accepting..." : "Accept"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PendingOrdersCard;
