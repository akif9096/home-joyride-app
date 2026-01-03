import { Service, ServiceType, Address, professionals } from "./servicesData";

export type WorkerServiceCategory = "plumber" | "carpenter" | "painter" | "electrician";

export interface Worker {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  category: WorkerServiceCategory;
  rating: number;
  totalJobs: number;
  completedJobs: number;
  experience: string;
  isAvailable: boolean;
  isVerified: boolean;
  earnings: {
    today: number;
    week: number;
    month: number;
    total: number;
  };
  documents: {
    aadhar: boolean;
    pan: boolean;
    bankDetails: boolean;
  };
  createdAt: Date;
}

export type JobStatus = "pending" | "accepted" | "on_the_way" | "arrived" | "in_progress" | "completed" | "cancelled";

export interface Job {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: Address;
  serviceCategory: WorkerServiceCategory;
  serviceType: ServiceType;
  scheduledDate: Date;
  scheduledTime: string;
  status: JobStatus;
  amount: number;
  workerEarnings: number;
  otp?: string;
  notes?: string;
  createdAt: Date;
  acceptedAt?: Date;
  completedAt?: Date;
  rating?: number;
  review?: string;
}

export interface Availability {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  isAvailable: boolean;
  startTime: string;
  endTime: string;
}

export interface WorkerReview {
  id: string;
  jobId: string;
  customerName: string;
  rating: number;
  review: string;
  date: Date;
  serviceType: string;
}

// Dummy worker accounts for demo
export const dummyWorkers: Worker[] = [
  {
    id: "w1",
    name: "Rajesh Kumar",
    phone: "+91 98765 43210",
    email: "rajesh@example.com",
    avatar: "",
    category: "plumber",
    rating: 4.9,
    totalJobs: 342,
    completedJobs: 338,
    experience: "5 years",
    isAvailable: true,
    isVerified: true,
    earnings: {
      today: 1450,
      week: 8750,
      month: 32500,
      total: 425000,
    },
    documents: {
      aadhar: true,
      pan: true,
      bankDetails: true,
    },
    createdAt: new Date("2020-03-15"),
  },
  {
    id: "w2",
    name: "Amit Singh",
    phone: "+91 87654 32109",
    email: "amit@example.com",
    avatar: "",
    category: "electrician",
    rating: 4.8,
    totalJobs: 256,
    completedJobs: 251,
    experience: "4 years",
    isAvailable: true,
    isVerified: true,
    earnings: {
      today: 980,
      week: 6200,
      month: 24800,
      total: 312000,
    },
    documents: {
      aadhar: true,
      pan: true,
      bankDetails: true,
    },
    createdAt: new Date("2021-01-10"),
  },
  {
    id: "w3",
    name: "Suresh Patel",
    phone: "+91 76543 21098",
    email: "suresh@example.com",
    avatar: "",
    category: "carpenter",
    rating: 4.7,
    totalJobs: 189,
    completedJobs: 185,
    experience: "3 years",
    isAvailable: false,
    isVerified: true,
    earnings: {
      today: 0,
      week: 4500,
      month: 18200,
      total: 198000,
    },
    documents: {
      aadhar: true,
      pan: false,
      bankDetails: true,
    },
    createdAt: new Date("2021-08-20"),
  },
  {
    id: "w4",
    name: "Vikram Sharma",
    phone: "+91 65432 10987",
    email: "vikram@example.com",
    avatar: "",
    category: "painter",
    rating: 4.9,
    totalJobs: 145,
    completedJobs: 143,
    experience: "6 years",
    isAvailable: true,
    isVerified: true,
    earnings: {
      today: 2200,
      week: 12500,
      month: 45000,
      total: 520000,
    },
    documents: {
      aadhar: true,
      pan: true,
      bankDetails: true,
    },
    createdAt: new Date("2019-06-01"),
  },
];

// Dummy jobs for demo
export const dummyJobs: Job[] = [
  {
    id: "j1",
    customerId: "c1",
    customerName: "Priya Sharma",
    customerPhone: "+91 99887 76655",
    customerAddress: {
      id: "1",
      type: "home",
      label: "Home",
      address: "123 Park Street, Apartment 4B, Mumbai 400001",
      isDefault: true,
    },
    serviceCategory: "plumber",
    serviceType: { id: "tap-repair", name: "Tap Repair", price: 199, duration: "30 mins", description: "Fix leaky or damaged taps" },
    scheduledDate: new Date(),
    scheduledTime: "10:00 AM",
    status: "pending",
    amount: 248,
    workerEarnings: 180,
    otp: "4521",
    createdAt: new Date(),
  },
  {
    id: "j2",
    customerId: "c2",
    customerName: "Rahul Verma",
    customerPhone: "+91 88776 65544",
    customerAddress: {
      id: "2",
      type: "work",
      label: "Office",
      address: "Tech Park Tower, Floor 12, Bangalore 560001",
      isDefault: false,
    },
    serviceCategory: "plumber",
    serviceType: { id: "pipe-fitting", name: "Pipe Fitting", price: 349, duration: "1 hour", description: "Install or repair pipes" },
    scheduledDate: new Date(),
    scheduledTime: "2:00 PM",
    status: "pending",
    amount: 398,
    workerEarnings: 280,
    otp: "7823",
    createdAt: new Date(),
  },
  {
    id: "j3",
    customerId: "c3",
    customerName: "Anita Desai",
    customerPhone: "+91 77665 54433",
    customerAddress: {
      id: "3",
      type: "home",
      label: "Home",
      address: "45 Green Valley, House 12, Pune 411001",
      isDefault: true,
    },
    serviceCategory: "plumber",
    serviceType: { id: "drainage", name: "Drainage Cleaning", price: 449, duration: "1-2 hours", description: "Clear blocked drains" },
    scheduledDate: new Date(Date.now() - 86400000),
    scheduledTime: "11:00 AM",
    status: "completed",
    amount: 498,
    workerEarnings: 350,
    completedAt: new Date(Date.now() - 82800000),
    rating: 5,
    review: "Excellent work! Very professional.",
    createdAt: new Date(Date.now() - 86400000),
  },
];

// Dummy reviews
export const dummyReviews: WorkerReview[] = [
  {
    id: "r1",
    jobId: "j3",
    customerName: "Anita Desai",
    rating: 5,
    review: "Excellent work! Very professional and cleaned up after the job.",
    date: new Date(Date.now() - 82800000),
    serviceType: "Drainage Cleaning",
  },
  {
    id: "r2",
    jobId: "j4",
    customerName: "Kiran Mehta",
    rating: 4,
    review: "Good work, arrived on time.",
    date: new Date(Date.now() - 172800000),
    serviceType: "Tap Repair",
  },
  {
    id: "r3",
    jobId: "j5",
    customerName: "Sanjay Gupta",
    rating: 5,
    review: "Amazing! Fixed the issue in no time.",
    date: new Date(Date.now() - 259200000),
    serviceType: "Toilet Repair",
  },
];

// Default availability
export const defaultAvailability: Availability[] = [
  { dayOfWeek: 0, isAvailable: false, startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 1, isAvailable: true, startTime: "08:00", endTime: "20:00" },
  { dayOfWeek: 2, isAvailable: true, startTime: "08:00", endTime: "20:00" },
  { dayOfWeek: 3, isAvailable: true, startTime: "08:00", endTime: "20:00" },
  { dayOfWeek: 4, isAvailable: true, startTime: "08:00", endTime: "20:00" },
  { dayOfWeek: 5, isAvailable: true, startTime: "08:00", endTime: "20:00" },
  { dayOfWeek: 6, isAvailable: true, startTime: "09:00", endTime: "17:00" },
];

export const getDayName = (dayOfWeek: number): string => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[dayOfWeek];
};

export const getCategoryIcon = (category: WorkerServiceCategory): string => {
  const icons = {
    plumber: "🔧",
    carpenter: "🔨",
    painter: "🎨",
    electrician: "⚡",
  };
  return icons[category];
};

export const getCategoryLabel = (category: WorkerServiceCategory): string => {
  return category.charAt(0).toUpperCase() + category.slice(1);
};
