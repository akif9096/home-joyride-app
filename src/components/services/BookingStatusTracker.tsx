import React, { useEffect } from "react";
import { format } from "date-fns";
import { 
  Search, 
  UserCheck, 
  Navigation, 
  Wrench, 
  CheckCircle2, 
  Phone, 
  MessageCircle,
  Star,
  MapPin,
  Shield
} from "lucide-react";
import { Booking, BookingStatus } from "@/data/servicesData";
import { useBooking } from "@/context/BookingContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BookingStatusTrackerProps {
  booking: Booking;
  onClose: () => void;
}

const statusConfig: Record<BookingStatus, {
  icon: typeof Search;
  title: string;
  description: string;
  color: string;
}> = {
  searching: {
    icon: Search,
    title: "Finding Professional",
    description: "We're matching you with the best professional nearby...",
    color: "text-primary",
  },
  assigned: {
    icon: UserCheck,
    title: "Professional Assigned",
    description: "Your service professional has been assigned",
    color: "text-success",
  },
  on_the_way: {
    icon: Navigation,
    title: "On the Way",
    description: "Professional is heading to your location",
    color: "text-warning",
  },
  in_progress: {
    icon: Wrench,
    title: "Work in Progress",
    description: "Service is being performed",
    color: "text-accent",
  },
  completed: {
    icon: CheckCircle2,
    title: "Service Completed",
    description: "Your service has been completed successfully!",
    color: "text-success",
  },
};

const statusOrder: BookingStatus[] = ["searching", "assigned", "on_the_way", "in_progress", "completed"];

const BookingStatusTracker: React.FC<BookingStatusTrackerProps> = ({ booking, onClose }) => {
  const { updateBookingStatus } = useBooking();
  const currentStatus = statusConfig[booking.status];
  const CurrentIcon = currentStatus.icon;
  const currentIndex = statusOrder.indexOf(booking.status);

  // Simulate status progression
  useEffect(() => {
    if (booking.status === "completed") return;

    const timeouts: NodeJS.Timeout[] = [];

    if (booking.status === "searching") {
      timeouts.push(setTimeout(() => updateBookingStatus(booking.id, "assigned"), 3000));
    }
    if (booking.status === "assigned") {
      timeouts.push(setTimeout(() => updateBookingStatus(booking.id, "on_the_way"), 4000));
    }
    if (booking.status === "on_the_way") {
      timeouts.push(setTimeout(() => updateBookingStatus(booking.id, "in_progress"), 5000));
    }
    if (booking.status === "in_progress") {
      timeouts.push(setTimeout(() => updateBookingStatus(booking.id, "completed"), 6000));
    }

    return () => timeouts.forEach(clearTimeout);
  }, [booking.status, booking.id, updateBookingStatus]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Booking ID</p>
              <p className="font-mono font-semibold text-foreground">{booking.id}</p>
            </div>
            {booking.otp && booking.status !== "completed" && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">OTP</p>
                <p className="font-mono font-bold text-xl text-primary">{booking.otp}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Current Status Card */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-card">
          <div className="flex flex-col items-center text-center">
            {/* Animated Icon */}
            <div className="relative mb-4">
              <div className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center",
                booking.status === "searching" ? "bg-primary/10" : "bg-success/10"
              )}>
                <CurrentIcon className={cn("w-10 h-10", currentStatus.color)} />
              </div>
              {booking.status === "searching" && (
                <>
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-ring" />
                  <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse-ring" style={{ animationDelay: "0.5s" }} />
                </>
              )}
            </div>

            <h2 className="text-xl font-bold text-foreground mb-2">{currentStatus.title}</h2>
            <p className="text-muted-foreground">{currentStatus.description}</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-card rounded-2xl p-5 border border-border">
          <div className="space-y-0">
            {statusOrder.map((status, index) => {
              const config = statusConfig[status];
              const Icon = config.icon;
              const isCompleted = index < currentIndex;
              const isCurrent = index === currentIndex;
              const isLast = index === statusOrder.length - 1;

              return (
                <div key={status} className="flex gap-4">
                  {/* Timeline */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                        isCompleted || isCurrent
                          ? "bg-success text-success-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    {!isLast && (
                      <div
                        className={cn(
                          "w-0.5 h-12 transition-all",
                          isCompleted ? "bg-success" : "bg-muted"
                        )}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className={cn("pb-6", isLast && "pb-0")}>
                    <p className={cn(
                      "font-medium transition-all",
                      isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {config.title}
                    </p>
                    {isCurrent && (
                      <p className="text-sm text-muted-foreground mt-0.5 animate-fade-in">
                        {config.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Professional Card */}
        {booking.professional && booking.status !== "searching" && (
          <div className="bg-card rounded-2xl p-5 border border-border animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">
                  {booking.professional.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{booking.professional.name}</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="w-4 h-4 fill-warning text-warning" />
                  <span>{booking.professional.rating}</span>
                  <span>•</span>
                  <span>{booking.professional.totalJobs} jobs</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="icon" variant="secondary">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="secondary">
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-2 text-sm text-success">
              <Shield className="w-4 h-4" />
              <span>Background verified professional</span>
            </div>
          </div>
        )}

        {/* Service Details */}
        <div className="bg-card rounded-2xl p-5 border border-border">
          <h4 className="font-semibold text-foreground mb-4">Service Details</h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service</span>
              <span className="font-medium text-foreground">{booking.service.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium text-foreground">{booking.serviceType.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium text-foreground">
                {format(booking.date, "MMM d, yyyy")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time</span>
              <span className="font-medium text-foreground">{booking.timeSlot.label}</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="font-medium text-foreground">Total Amount</span>
              <span className="font-bold text-foreground">₹{booking.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-card rounded-2xl p-5 border border-border">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium text-foreground">{booking.address.label}</p>
              <p className="text-sm text-muted-foreground">{booking.address.address}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {booking.status === "completed" ? (
          <div className="space-y-3">
            <Button size="xl" className="w-full">
              Rate & Review
            </Button>
            <Button size="xl" variant="outline" onClick={onClose} className="w-full">
              Back to Home
            </Button>
          </div>
        ) : (
          <Button size="xl" variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10">
            Cancel Booking
          </Button>
        )}
      </div>
    </div>
  );
};

export default BookingStatusTracker;
