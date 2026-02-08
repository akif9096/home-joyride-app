import React, { useState, useEffect } from "react";
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
import OrderStatusTracker from "@/components/services/OrderStatusTracker";
import PaymentModal from "@/components/customer/PaymentModal";
import { services, Service } from "@/data/servicesData";
import { useBooking } from "@/context/BookingContext";
import { useOrders } from "@/hooks/useOrders";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

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
    addresses,
    resetBookingFlow,
    getTotalAmount,
  } = useBooking();

  const { orders, createOrder } = useOrders();

  const [bookingStep, setBookingStep] = useState<BookingStep>("closed");
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { isLoggedIn } = useAuth();

  // Check for active orders that need payment
  useEffect(() => {
    const assignedOrder = orders.find(
      (o) => o.status === "assigned" && !o.worker_id
    );
    if (assignedOrder) {
      setActiveOrder(assignedOrder);
      setShowPaymentModal(true);
    }

    // Check for in-progress or assigned orders to show tracker
    const trackingOrder = orders.find((o) =>
      ["searching", "assigned", "in_progress"].includes(o.status)
    );
    if (trackingOrder) {
      setActiveOrder(trackingOrder);
    }
  }, [orders]);

  const handleServiceClick = (service: Service) => {
    if (!isLoggedIn) {
      navigate("/auth");
      return;
    }
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

  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedServiceType || !selectedDate || !selectedTimeSlot || !selectedAddress) {
      return;
    }

    // Map service ID to category
    const categoryMap: Record<string, string> = {
      plumber: "plumber",
      carpenter: "carpenter",
      painter: "painter",
      electrician: "electrician",
    };

    const order = await createOrder({
      service_name: selectedService.name,
      service_type: selectedServiceType.name,
      service_icon: selectedService.id,
      category: categoryMap[selectedService.id] || "plumber",
      address_text: selectedAddress.address,
      scheduled_date: selectedDate.toISOString().split("T")[0],
      scheduled_time: selectedTimeSlot.label,
      total_amount: getTotalAmount(),
    });

    if (order) {
      setActiveOrder(order);
      setBookingStep("closed");
      resetBookingFlow();
    }
  };

  const handleCloseSheet = () => {
    setBookingStep("closed");
    resetBookingFlow();
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

  // Show order status tracker if there's an active order being searched/assigned
  if (activeOrder && ["searching", "assigned", "in_progress"].includes(activeOrder.status)) {
    return (
      <>
        <OrderStatusTracker
          order={activeOrder}
          onClose={() => setActiveOrder(null)}
        />
        {activeOrder.status === "assigned" && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            orderId={activeOrder.id}
            amount={Number(activeOrder.total_amount)}
            onPaymentComplete={() => {
              setShowPaymentModal(false);
            }}
          />
        )}
      </>
    );
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
              <span className="text-sm font-medium opacity-90">Home Services</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {isLoggedIn ? `Welcome back!` : "Book Expert Services"}
            </h1>
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

        {/* Login prompt for non-authenticated users */}
        {!isLoggedIn && (
          <section className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground mb-3">
              Sign in to book services and track your orders
            </p>
            <Button className="w-full" onClick={() => navigate("/auth")}>
              Sign In / Sign Up
            </Button>
          </section>
        )}

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
