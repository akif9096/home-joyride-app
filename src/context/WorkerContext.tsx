import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  Worker,
  Job,
  Availability,
  WorkerReview,
  dummyWorkers,
  dummyJobs,
  dummyReviews,
  defaultAvailability,
  JobStatus,
} from "@/data/workerData";

interface WorkerContextType {
  // Auth
  isLoggedIn: boolean;
  currentWorker: Worker | null;
  login: (phone: string, password: string) => boolean;
  logout: () => void;

  // Jobs
  pendingJobs: Job[];
  activeJob: Job | null;
  completedJobs: Job[];
  acceptJob: (jobId: string) => void;
  rejectJob: (jobId: string) => void;
  updateJobStatus: (jobId: string, status: JobStatus) => void;
  completeJob: (jobId: string, otp: string) => boolean;

  // Availability
  availability: Availability[];
  updateAvailability: (availability: Availability[]) => void;
  toggleOnlineStatus: () => void;

  // Reviews
  reviews: WorkerReview[];

  // Stats
  todayEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
}

const WorkerContext = createContext<WorkerContextType | undefined>(undefined);

export const WorkerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentWorker, setCurrentWorker] = useState<Worker | null>(null);
  const [jobs, setJobs] = useState<Job[]>(dummyJobs);
  const [availability, setAvailability] = useState<Availability[]>(defaultAvailability);
  const [reviews] = useState<WorkerReview[]>(dummyReviews);

  const login = (phone: string, password: string): boolean => {
    // Demo login - any password works, match by phone
    const worker = dummyWorkers.find((w) => w.phone.replace(/\s/g, "").includes(phone.replace(/\s/g, "")));
    if (worker || phone === "demo") {
      setCurrentWorker(worker || dummyWorkers[0]);
      setIsLoggedIn(true);
      return true;
    }
    // For demo, also allow login with just "demo" as phone
    if (phone.toLowerCase() === "demo") {
      setCurrentWorker(dummyWorkers[0]);
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentWorker(null);
  };

  const pendingJobs = jobs.filter(
    (j) => j.status === "pending" && j.serviceCategory === currentWorker?.category
  );

  const activeJob = jobs.find(
    (j) =>
      ["accepted", "on_the_way", "arrived", "in_progress"].includes(j.status) &&
      j.serviceCategory === currentWorker?.category
  ) || null;

  const completedJobs = jobs.filter(
    (j) => j.status === "completed" && j.serviceCategory === currentWorker?.category
  );

  const acceptJob = (jobId: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId ? { ...j, status: "accepted" as JobStatus, acceptedAt: new Date() } : j
      )
    );
  };

  const rejectJob = (jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  };

  const updateJobStatus = (jobId: string, status: JobStatus) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status } : j))
    );
  };

  const completeJob = (jobId: string, otp: string): boolean => {
    const job = jobs.find((j) => j.id === jobId);
    if (job && job.otp === otp) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId ? { ...j, status: "completed" as JobStatus, completedAt: new Date() } : j
        )
      );
      // Update worker earnings
      if (currentWorker) {
        setCurrentWorker({
          ...currentWorker,
          completedJobs: currentWorker.completedJobs + 1,
          totalJobs: currentWorker.totalJobs + 1,
          earnings: {
            ...currentWorker.earnings,
            today: currentWorker.earnings.today + (job.workerEarnings || 0),
            week: currentWorker.earnings.week + (job.workerEarnings || 0),
            month: currentWorker.earnings.month + (job.workerEarnings || 0),
            total: currentWorker.earnings.total + (job.workerEarnings || 0),
          },
        });
      }
      return true;
    }
    return false;
  };

  const updateAvailability = (newAvailability: Availability[]) => {
    setAvailability(newAvailability);
  };

  const toggleOnlineStatus = () => {
    if (currentWorker) {
      setCurrentWorker({
        ...currentWorker,
        isAvailable: !currentWorker.isAvailable,
      });
    }
  };

  const todayEarnings = currentWorker?.earnings.today || 0;
  const weeklyEarnings = currentWorker?.earnings.week || 0;
  const monthlyEarnings = currentWorker?.earnings.month || 0;

  return (
    <WorkerContext.Provider
      value={{
        isLoggedIn,
        currentWorker,
        login,
        logout,
        pendingJobs,
        activeJob,
        completedJobs,
        acceptJob,
        rejectJob,
        updateJobStatus,
        completeJob,
        availability,
        updateAvailability,
        toggleOnlineStatus,
        reviews,
        todayEarnings,
        weeklyEarnings,
        monthlyEarnings,
      }}
    >
      {children}
    </WorkerContext.Provider>
  );
};

export const useWorker = () => {
  const context = useContext(WorkerContext);
  if (!context) {
    throw new Error("useWorker must be used within a WorkerProvider");
  }
  return context;
};
