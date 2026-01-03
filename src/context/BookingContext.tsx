import React, { createContext, useContext, useState, ReactNode } from "react";
import { 
  Service, 
  ServiceType, 
  Address, 
  TimeSlot, 
  Booking, 
  BookingStatus,
  professionals,
  savedAddresses 
} from "@/data/servicesData";

interface BookingContextType {
  // Current booking flow
  selectedService: Service | null;
  selectedServiceType: ServiceType | null;
  selectedAddress: Address | null;
  selectedDate: Date | null;
  selectedTimeSlot: TimeSlot | null;
  paymentMethod: "cod" | "online";
  
  // Actions
  setSelectedService: (service: Service | null) => void;
  setSelectedServiceType: (type: ServiceType | null) => void;
  setSelectedAddress: (address: Address | null) => void;
  setSelectedDate: (date: Date | null) => void;
  setSelectedTimeSlot: (slot: TimeSlot | null) => void;
  setPaymentMethod: (method: "cod" | "online") => void;
  
  // Booking management
  bookings: Booking[];
  currentBooking: Booking | null;
  createBooking: () => Booking;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => void;
  setCurrentBooking: (booking: Booking | null) => void;
  
  // Helpers
  resetBookingFlow: () => void;
  addresses: Address[];
  getTotalAmount: () => number;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(savedAddresses[0]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);

  const getTotalAmount = () => {
    if (!selectedServiceType) return 0;
    const serviceFee = 49;
    return selectedServiceType.price + serviceFee;
  };

  const resetBookingFlow = () => {
    setSelectedService(null);
    setSelectedServiceType(null);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setPaymentMethod("cod");
  };

  const createBooking = (): Booking => {
    const booking: Booking = {
      id: `BK${Date.now()}`,
      service: selectedService!,
      serviceType: selectedServiceType!,
      address: selectedAddress!,
      date: selectedDate!,
      timeSlot: selectedTimeSlot!,
      status: "searching",
      totalAmount: getTotalAmount(),
      paymentMethod,
      createdAt: new Date(),
      otp: Math.floor(1000 + Math.random() * 9000).toString(),
    };
    
    setBookings(prev => [booking, ...prev]);
    setCurrentBooking(booking);
    return booking;
  };

  const updateBookingStatus = (bookingId: string, status: BookingStatus) => {
    setBookings(prev => 
      prev.map(b => {
        if (b.id === bookingId) {
          const updated = { ...b, status };
          if (status === "assigned" && !b.professional) {
            updated.professional = professionals[Math.floor(Math.random() * professionals.length)];
          }
          if (currentBooking?.id === bookingId) {
            setCurrentBooking(updated);
          }
          return updated;
        }
        return b;
      })
    );
  };

  return (
    <BookingContext.Provider
      value={{
        selectedService,
        selectedServiceType,
        selectedAddress,
        selectedDate,
        selectedTimeSlot,
        paymentMethod,
        setSelectedService,
        setSelectedServiceType,
        setSelectedAddress,
        setSelectedDate,
        setSelectedTimeSlot,
        setPaymentMethod,
        bookings,
        currentBooking,
        createBooking,
        updateBookingStatus,
        setCurrentBooking,
        resetBookingFlow,
        addresses: savedAddresses,
        getTotalAmount,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
};
