import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Clock, Shield, Star } from "lucide-react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import ServiceCard from "@/components/services/ServiceCard";
import BottomSheet from "@/components/services/BottomSheet";
import ServiceTypeSelector from "@/components/services/ServiceTypeSelector";
import DateTimeSelector from "@/components/services/DateTimeSelector";
import AddressSelector from "@/components/services/AddressSelector";
import BookingSummary from "@/components/services/BookingSummary";
import BookingStatusTracker from "@/components/services/BookingStatusTracker";
import { services, Service } from "@/data/servicesData";
import { useBooking } from "@/context/BookingContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BookingStep = "closed" | "service-type" | "datetime" | "address" | "summary";

const Index: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedService,
    selectedServiceType,
    selectedAddress,
    selectedDate,
    selectedTimeSlot,
    setSelectedService,
    setSelectedServiceType,
    setSelectedAddress,
    setSelectedDate,
    setSelectedTimeSlot,
    createBooking,
    currentBooking,
    setCurrentBooking,
    addresses,
    resetBookingFlow,
  } = useBooking();

  const [bookingStep, setBookingStep] = useState<BookingStep>("closed");
  const [showStatusTracker, setShowStatusTracker] = useState(false);

  const handleServiceClick = (service: Service) => {
    setSelectedService(service);
    setBookingStep("service-type");
  };

  const handleServiceTypeSelect = (type: typeof services[0]["types"][0]) => {
    setSelectedServiceType(type);
  };

  const handleNextStep = () => {
    if (bookingStep === "service-type" && selectedServiceType) {
      setBookingStep("datetime");
    } else if (bookingStep === "datetime" && selectedDate && selectedTimeSlot) {
      setBookingStep("address");
    } else if (bookingStep === "address" && selectedAddress) {
      setBookingStep("summary");
    }
  };

  const handleConfirmBooking = () => {
    const booking = createBooking();
    setBookingStep("closed");
    setShowStatusTracker(true);
    resetBookingFlow();
  };

  const handleCloseSheet = () => {
    setBookingStep("closed");
    resetBookingFlow();
  };

  const handleBackFromStatus = () => {
    setShowStatusTracker(false);
    setCurrentBooking(null);
  };

  const isNextEnabled = () => {
    switch (bookingStep) {
      case "service-type":
        return !!selectedServiceType;
      case "datetime":
        return !!selectedDate && !!selectedTimeSlot;
      case "address":
        return !!selectedAddress;
      default:
        return false;
    }
  };

  const getSheetTitle = () => {
    switch (bookingStep) {
      case "service-type":
        return `Select ${selectedService?.name} Service`;
      case "datetime":
        return "Select Date & Time";
      case "address":
        return "Select Address";
      case "summary":
        return "Confirm Booking";
      default:
        return "";
    }
  };

  // Show status tracker if there's an active booking
  if (showStatusTracker && currentBooking) {
    return <BookingStatusTracker booking={currentBooking} onClose={handleBackFromStatus} />;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="container max-w-md mx-auto px-4 py-6 space-y-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">New Feature</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">Home Services</h1>
            <p className="text-sm opacity-90 mb-4">
              Expert professionals at your doorstep. Book trusted services in minutes.
            </p>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>30 min arrival</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                <span>Verified pros</span>
              </div>
            </div>
          </div>
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-primary-foreground/10" />
          <div className="absolute -right-4 bottom-0 w-20 h-20 rounded-full bg-primary-foreground/5" />
        </section>

        {/* Services Grid */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-foreground">Our Services</h2>
            <button className="flex items-center gap-1 text-sm text-primary font-medium hover:opacity-80 transition-opacity">
              View All
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {services.map((service, index) => (
              <div
                key={service.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <ServiceCard service={service} onClick={() => handleServiceClick(service)} />
              </div>
            ))}
          </div>
        </section>

        {/* Trust Badges */}
        <section className="grid grid-cols-3 gap-3">
          {[
            { icon: Star, label: "4.8 Rating", sub: "50K+ reviews" },
            { icon: Shield, label: "Verified", sub: "Background check" },
            { icon: Clock, label: "On-time", sub: "95% punctual" },
          ].map((badge, index) => (
            <div
              key={badge.label}
              className={cn(
                "flex flex-col items-center p-4 rounded-xl bg-card border border-border",
                "animate-fade-in"
              )}
              style={{ animationDelay: `${index * 100 + 400}ms` }}
            >
              <badge.icon className="w-6 h-6 text-primary mb-2" />
              <span className="text-sm font-semibold text-foreground">{badge.label}</span>
              <span className="text-xs text-muted-foreground">{badge.sub}</span>
            </div>
          ))}
        </section>

        {/* Worker Portal Link */}
        <section className="mt-6">
          <Button
            variant="outline"
            className="w-full h-14 font-bold border-2 border-dashed"
            onClick={() => navigate("/worker/login")}
          >
            Are you a professional? Join as a Worker →
          </Button>
        </section>
      </main>

      <BottomNav />

      {/* Booking Bottom Sheet */}
      <BottomSheet
        isOpen={bookingStep !== "closed"}
        onClose={handleCloseSheet}
        title={getSheetTitle()}
      >
        {bookingStep === "service-type" && selectedService && (
          <>
            <ServiceTypeSelector
              types={selectedService.types}
              selectedType={selectedServiceType}
              onSelect={handleServiceTypeSelect}
            />
            <div className="p-5 pt-0">
              <Button
                size="xl"
                className="w-full"
                disabled={!isNextEnabled()}
                onClick={handleNextStep}
              >
                Continue
              </Button>
            </div>
          </>
        )}

        {bookingStep === "datetime" && (
          <>
            <DateTimeSelector
              selectedDate={selectedDate}
              selectedTimeSlot={selectedTimeSlot}
              onDateSelect={setSelectedDate}
              onTimeSlotSelect={setSelectedTimeSlot}
            />
            <div className="p-5 pt-0">
              <Button
                size="xl"
                className="w-full"
                disabled={!isNextEnabled()}
                onClick={handleNextStep}
              >
                Continue
              </Button>
            </div>
          </>
        )}

        {bookingStep === "address" && (
          <>
            <AddressSelector
              addresses={addresses}
              selectedAddress={selectedAddress}
              onSelect={setSelectedAddress}
            />
            <div className="p-5 pt-0">
              <Button
                size="xl"
                className="w-full"
                disabled={!isNextEnabled()}
                onClick={handleNextStep}
              >
                Continue
              </Button>
            </div>
          </>
        )}

        {bookingStep === "summary" && <BookingSummary onConfirm={handleConfirmBooking} />}
      </BottomSheet>
    </div>
  );
};

export default Index;
