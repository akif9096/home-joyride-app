import React from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Clock, ChevronRight } from "lucide-react";
import { useBooking } from "@/context/BookingContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import BottomNav from "@/components/layout/BottomNav";

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const { bookings } = useBooking();

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
        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Calendar className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">No Orders Yet</h2>
            <p className="text-muted-foreground mb-6">Once you place an order it will appear here.</p>
            <Button onClick={() => navigate("/")}>Browse Services</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <button
                key={b.id}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border",
                  "hover:border-muted-foreground/30 hover:shadow-card transition-all",
                  "text-left"
                )}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-secondary">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground">{b.service.name}</h4>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-muted">{b.status}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{b.serviceType.name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{format(b.date, "MMM d")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{b.timeSlot.label}</span>
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Orders;
