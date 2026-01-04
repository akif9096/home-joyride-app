import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/layout/BottomNav";
import { useBooking } from "@/context/BookingContext";

const Notifications: React.FC = () => {
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
            <h1 className="text-lg font-bold text-foreground">Notifications</h1>
          </div>
        </div>
      </header>

      <main className="container max-w-md mx-auto px-4 py-6">
        {bookings.length === 0 ? (
          <div className="text-center">
            <p className="text-muted-foreground">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="bg-card p-4 rounded-xl border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">{b.service.name} — {b.serviceType.name}</div>
                    <div className="text-sm text-muted-foreground">{b.address.label} • {b.timeSlot.label}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">{b.status}</div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">Booking ID: {b.id}</div>
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
