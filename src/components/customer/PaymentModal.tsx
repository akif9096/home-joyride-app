import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Banknote, CreditCard, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  amount: number;
  onPaymentComplete: () => void;
}

const PaymentModal = ({
  isOpen,
  onClose,
  orderId,
  amount,
  onPaymentComplete,
}: PaymentModalProps) => {
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<"cash" | "online" | null>(null);
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    if (!selectedMethod) return;
    
    setProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get the order to find worker_id
      const { data: order } = await supabase
        .from("orders")
        .select("worker_id")
        .eq("id", orderId)
        .single();

      // Create transaction record
      const { error: txError } = await supabase
        .from("transactions")
        .insert({
          order_id: orderId,
          customer_id: user.id,
          worker_id: order?.worker_id,
          amount,
          payment_method: selectedMethod,
          payment_status: selectedMethod === "cash" ? "pending" : "paid",
          paid_at: selectedMethod === "online" ? new Date().toISOString() : null,
        });

      if (txError) throw txError;

      // Update order status to in_progress
      const { error: orderError } = await supabase
        .from("orders")
        .update({ status: "in_progress" })
        .eq("id", orderId);

      if (orderError) throw orderError;

      toast({
        title: selectedMethod === "cash" ? "Payment Method Saved" : "Payment Successful!",
        description: selectedMethod === "cash" 
          ? "Pay the worker in cash after service completion" 
          : "Your payment has been processed",
      });

      onPaymentComplete();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Choose Payment Method</DialogTitle>
          <DialogDescription>
            Worker has accepted your order. Select how you'd like to pay.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-center text-2xl font-bold text-foreground mb-6">
            ₹{amount.toLocaleString()}
          </p>

          <div className="space-y-3">
            <button
              onClick={() => setSelectedMethod("cash")}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                selectedMethod === "cash"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                selectedMethod === "cash" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                <Banknote className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">Cash on Completion</p>
                <p className="text-sm text-muted-foreground">Pay after service is done</p>
              </div>
              {selectedMethod === "cash" && (
                <Check className="w-5 h-5 text-primary" />
              )}
            </button>

            <button
              onClick={() => setSelectedMethod("online")}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                selectedMethod === "online"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                selectedMethod === "online" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                <CreditCard className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">Pay Online</p>
                <p className="text-sm text-muted-foreground">UPI, Card, Net Banking</p>
              </div>
              {selectedMethod === "online" && (
                <Check className="w-5 h-5 text-primary" />
              )}
            </button>
          </div>
        </div>

        <Button
          className="w-full"
          size="lg"
          disabled={!selectedMethod || processing}
          onClick={handlePayment}
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : selectedMethod === "online" ? (
            "Pay Now"
          ) : (
            "Confirm"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
