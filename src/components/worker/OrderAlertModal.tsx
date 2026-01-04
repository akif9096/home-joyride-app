import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  IndianRupee,
  Bell,
  X,
  Check
} from "lucide-react";

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

interface OrderAlertModalProps {
  orders: Order[];
  isOpen: boolean;
  onClose: () => void;
  onAccept: (orderId: string) => Promise<{ error: any }>;
  onReject: (orderId: string) => void;
}

const OrderAlertModal = ({
  orders,
  isOpen,
  onClose,
  onAccept,
  onReject,
}: OrderAlertModalProps) => {
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const handleAccept = async (orderId: string) => {
    setAcceptingId(orderId);
    await onAccept(orderId);
    setAcceptingId(null);
  };

  if (orders.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary animate-pulse" />
            New Order Requests ({orders.length})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-muted/50 rounded-xl p-4 border border-border animate-pulse"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {order.service_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {order.service_type}
                  </p>
                </div>
                <Badge className="capitalize bg-primary/20 text-primary">
                  {order.category}
                </Badge>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="line-clamp-1">{order.address_text}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(new Date(order.scheduled_date), "MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{order.scheduled_time}</span>
                </div>
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <IndianRupee className="w-4 h-4" />
                  <span>₹{Number(order.total_amount).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => onReject(order.id)}
                >
                  <X className="w-4 h-4 mr-1" />
                  Reject
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleAccept(order.id)}
                  disabled={acceptingId === order.id}
                >
                  <Check className="w-4 h-4 mr-1" />
                  {acceptingId === order.id ? "Accepting..." : "Accept"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderAlertModal;
