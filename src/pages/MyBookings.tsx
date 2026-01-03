import React from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Clock, MapPin, ChevronRight } from "lucide-react";
import { useBooking } from "@/context/BookingContext";
import { Booking, BookingStatus } from "@/data/servicesData";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const statusLabels: Record<BookingStatus, { label: string; color: string }> = {
  searching: { label: "Finding Pro", color: "bg-primary/10 text-primary" },
  assigned: { label: "Assigned", color: "bg-success/10 text-success" },
  on_the_way: { label: "On the Way", color: "bg-warning/10 text-warning" },
  in_progress: { label: "In Progress", color: "bg-accent/10 text-accent" },
  completed: { label: "Completed", color: "bg-success/10 text-success" },
};

const MyBookings: React.FC = () => {
  const navigate = useNavigate();
  const { bookings, setCurrentBooking } = useBooking();

  const handleBookingClick = (booking: Booking) => {
    setCurrentBooking(booking);
    navigate("/");
  };

  const activeBookings = bookings.filter(b => b.status !== "completed");
  const pastBookings = bookings.filter(b => b.status === "completed");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="container max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button size="icon" variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-foreground">My Service Bookings</h1>
          </div>
        </div>
      </header>

      <main className="container max-w-md mx-auto px-4 py-6 space-y-8">
        {bookings.length === 0 ? (
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
            {activeBookings.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                  Active Bookings
                </h2>
                <div className="space-y-3">
                  {activeBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      onClick={() => handleBookingClick(booking)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Past Bookings */}
            {pastBookings.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                  Past Bookings
                </h2>
                <div className="space-y-3">
                  {pastBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      onClick={() => handleBookingClick(booking)}
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

interface BookingCardProps {
  booking: Booking;
  onClick: () => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onClick }) => {
  const Icon = booking.service.icon;
  const status = statusLabels[booking.status];

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
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", booking.service.bgColor)}>
        <Icon className={cn("w-6 h-6", booking.service.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-foreground">{booking.service.name}</h4>
          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", status.color)}>
            {status.label}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-2">{booking.serviceType.name}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{format(booking.date, "MMM d")}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{booking.timeSlot.label}</span>
          </div>
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
    </button>
  );
};

export default MyBookings;
