import { Wrench, Hammer, Paintbrush, Zap } from "lucide-react";

export interface ServiceType {
  id: string;
  name: string;
  price: number;
  duration: string;
  description: string;
}

export interface Service {
  id: string;
  name: string;
  icon: typeof Wrench;
  color: string;
  bgColor: string;
  description: string;
  rating: number;
  totalBookings: string;
  types: ServiceType[];
}

export const services: Service[] = [
  {
    id: "plumber",
    name: "Plumber",
    icon: Wrench,
    color: "text-service-plumber",
    bgColor: "bg-service-plumber/10",
    description: "Tap repair, pipe fitting, drainage & more",
    rating: 4.8,
    totalBookings: "12K+",
    types: [
      { id: "tap-repair", name: "Tap Repair", price: 199, duration: "30 mins", description: "Fix leaky or damaged taps" },
      { id: "pipe-fitting", name: "Pipe Fitting", price: 349, duration: "1 hour", description: "Install or repair pipes" },
      { id: "drainage", name: "Drainage Cleaning", price: 449, duration: "1-2 hours", description: "Clear blocked drains" },
      { id: "toilet-repair", name: "Toilet Repair", price: 299, duration: "45 mins", description: "Fix toilet flush & leaks" },
      { id: "water-tank", name: "Water Tank Cleaning", price: 799, duration: "2-3 hours", description: "Complete tank cleaning" },
    ],
  },
  {
    id: "carpenter",
    name: "Carpenter",
    icon: Hammer,
    color: "text-service-carpenter",
    bgColor: "bg-service-carpenter/10",
    description: "Furniture repair, assembly & installation",
    rating: 4.7,
    totalBookings: "8K+",
    types: [
      { id: "furniture-assembly", name: "Furniture Assembly", price: 299, duration: "1-2 hours", description: "Assemble new furniture" },
      { id: "door-repair", name: "Door Repair", price: 349, duration: "1 hour", description: "Fix hinges, locks & frames" },
      { id: "cabinet-repair", name: "Cabinet Repair", price: 399, duration: "1-2 hours", description: "Fix shelves & cabinets" },
      { id: "bed-repair", name: "Bed Repair", price: 449, duration: "1-2 hours", description: "Fix bed frame & supports" },
      { id: "custom-work", name: "Custom Woodwork", price: 999, duration: "3-4 hours", description: "Custom furniture work" },
    ],
  },
  {
    id: "painter",
    name: "Painter",
    icon: Paintbrush,
    color: "text-service-painter",
    bgColor: "bg-service-painter/10",
    description: "Wall painting, texture & waterproofing",
    rating: 4.9,
    totalBookings: "15K+",
    types: [
      { id: "wall-painting", name: "Wall Painting (1 Room)", price: 2999, duration: "1 day", description: "Complete room painting" },
      { id: "texture-painting", name: "Texture Painting", price: 1499, duration: "4-5 hours", description: "Decorative texture walls" },
      { id: "waterproofing", name: "Waterproofing", price: 1999, duration: "1 day", description: "Prevent water seepage" },
      { id: "touch-up", name: "Touch Up Painting", price: 599, duration: "2-3 hours", description: "Minor paint fixes" },
      { id: "exterior", name: "Exterior Painting", price: 4999, duration: "2-3 days", description: "Outdoor wall painting" },
    ],
  },
  {
    id: "electrician",
    name: "Electrician",
    icon: Zap,
    color: "text-service-electrician",
    bgColor: "bg-service-electrician/10",
    description: "Wiring, fan, AC & appliance installation",
    rating: 4.8,
    totalBookings: "20K+",
    types: [
      { id: "fan-installation", name: "Fan Installation", price: 249, duration: "30 mins", description: "Install ceiling/wall fan" },
      { id: "switch-repair", name: "Switch & Socket Repair", price: 149, duration: "20 mins", description: "Replace switches & sockets" },
      { id: "wiring", name: "Wiring Work", price: 499, duration: "1-2 hours", description: "New wiring & repairs" },
      { id: "mcb-repair", name: "MCB & Fuse Repair", price: 299, duration: "30 mins", description: "Fix electrical panels" },
      { id: "ac-service", name: "AC Installation", price: 799, duration: "1-2 hours", description: "Install split/window AC" },
    ],
  },
];

export interface Address {
  id: string;
  type: "home" | "work" | "other";
  label: string;
  address: string;
  isDefault: boolean;
}

export const savedAddresses: Address[] = [
  {
    id: "1",
    type: "home",
    label: "Home",
    address: "123 Park Street, Apartment 4B, Mumbai 400001",
    isDefault: true,
  },
  {
    id: "2",
    type: "work",
    label: "Work",
    address: "Tech Park Tower, Floor 12, Bangalore 560001",
    isDefault: false,
  },
];

export interface Professional {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  totalJobs: number;
  experience: string;
  phone: string;
}

export const professionals: Professional[] = [
  { id: "1", name: "Rajesh Kumar", avatar: "", rating: 4.9, totalJobs: 342, experience: "5 years", phone: "+91 98765 43210" },
  { id: "2", name: "Amit Singh", avatar: "", rating: 4.8, totalJobs: 256, experience: "4 years", phone: "+91 87654 32109" },
  { id: "3", name: "Suresh Patel", avatar: "", rating: 4.7, totalJobs: 189, experience: "3 years", phone: "+91 76543 21098" },
];

export interface TimeSlot {
  id: string;
  time: string;
  label: string;
  available: boolean;
}

export const timeSlots: TimeSlot[] = [
  { id: "1", time: "08:00", label: "8:00 AM", available: true },
  { id: "2", time: "09:00", label: "9:00 AM", available: true },
  { id: "3", time: "10:00", label: "10:00 AM", available: true },
  { id: "4", time: "11:00", label: "11:00 AM", available: false },
  { id: "5", time: "12:00", label: "12:00 PM", available: true },
  { id: "6", time: "14:00", label: "2:00 PM", available: true },
  { id: "7", time: "15:00", label: "3:00 PM", available: true },
  { id: "8", time: "16:00", label: "4:00 PM", available: true },
  { id: "9", time: "17:00", label: "5:00 PM", available: false },
  { id: "10", time: "18:00", label: "6:00 PM", available: true },
];

export type BookingStatus = "searching" | "assigned" | "on_the_way" | "in_progress" | "completed";

export interface Booking {
  id: string;
  service: Service;
  serviceType: ServiceType;
  address: Address;
  date: Date;
  timeSlot: TimeSlot;
  professional?: Professional;
  status: BookingStatus;
  totalAmount: number;
  paymentMethod: "cod" | "online";
  createdAt: Date;
  otp?: string;
}
