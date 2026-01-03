import React from "react";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, CreditCard, Banknote, Shield } from "lucide-react";
import { useBooking } from "@/context/BookingContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BookingSummaryProps {
  onConfirm: () => void;
}

const BookingSummary: React.FC<BookingSummaryProps> = ({ onConfirm }) => {
  const {
    selectedService,
    selectedServiceType,
    selectedAddress,
    selectedDate,
    selectedTimeSlot,
    paymentMethod,
    setPaymentMethod,
    getTotalAmount,
  } = useBooking();

  if (!selectedService || !selectedServiceType || !selectedDate || !selectedTimeSlot) {
    return null;
  }

  const Icon = selectedService.icon;
  const serviceFee = 49;

  return (
    <div className="p-5 space-y-5 pb-8">
      {/* Service Info */}
      <div className="flex items-center gap-4 p-4 bg-secondary rounded-xl">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", selectedService.bgColor)}>
          <Icon className={cn("w-6 h-6", selectedService.color)} />
        </div>
        <div>
          <h4 className="font-semibold text-foreground">{selectedService.name}</h4>
          <p className="text-sm text-muted-foreground">{selectedServiceType.name}</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">Date & Time</p>
            <p className="font-medium text-foreground">
              {format(selectedDate, "EEEE, MMMM d")} • {selectedTimeSlot.label}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">Service Address</p>
            <p className="font-medium text-foreground">{selectedAddress?.label}</p>
            <p className="text-sm text-muted-foreground">{selectedAddress?.address}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">Estimated Duration</p>
            <p className="font-medium text-foreground">{selectedServiceType.duration}</p>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div>
        <h4 className="font-medium text-foreground mb-3">Payment Method</h4>
        <div className="flex gap-3">
          <button
            onClick={() => setPaymentMethod("cod")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border transition-all",
              paymentMethod === "cod"
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border bg-card hover:border-muted-foreground/30"
            )}
          >
            <Banknote className={cn("w-5 h-5", paymentMethod === "cod" ? "text-primary" : "text-muted-foreground")} />
            <span className={cn("font-medium", paymentMethod === "cod" ? "text-primary" : "text-foreground")}>
              Cash
            </span>
          </button>
          <button
            onClick={() => setPaymentMethod("online")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border transition-all",
              paymentMethod === "online"
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border bg-card hover:border-muted-foreground/30"
            )}
          >
            <CreditCard className={cn("w-5 h-5", paymentMethod === "online" ? "text-primary" : "text-muted-foreground")} />
            <span className={cn("font-medium", paymentMethod === "online" ? "text-primary" : "text-foreground")}>
              Online
            </span>
          </button>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="bg-secondary rounded-xl p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Service Charge</span>
          <span className="text-foreground">₹{selectedServiceType.price}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Convenience Fee</span>
          <span className="text-foreground">₹{serviceFee}</span>
        </div>
        <div className="border-t border-border pt-3 flex justify-between">
          <span className="font-semibold text-foreground">Total</span>
          <span className="font-bold text-lg text-foreground">₹{getTotalAmount()}</span>
        </div>
      </div>

      {/* Safety Badge */}
      <div className="flex items-center gap-3 p-3 bg-success/10 rounded-xl">
        <Shield className="w-5 h-5 text-success" />
        <div className="text-sm">
          <p className="font-medium text-success">100% Safe & Verified</p>
          <p className="text-success/80">Background verified professionals</p>
        </div>
      </div>

      {/* Confirm Button */}
      <Button onClick={onConfirm} size="xl" className="w-full">
        Confirm Booking • ₹{getTotalAmount()}
      </Button>
    </div>
  );
};

export default BookingSummary;
