import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import {
  Worker,
  Job,
  Availability,
  WorkerReview,
  dummyJobs,
  dummyReviews,
  defaultAvailability,
  JobStatus,
} from "@/data/workerData";
import { supabase } from "@/integrations/supabase/client";

interface WorkerContextType {
  // Auth (real backend)
  isLoggedIn: boolean;
  currentWorker: Worker | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;

  // Jobs (still demo data for now)
  pendingJobs: Job[];
  activeJob: Job | null;
  completedJobs: Job[];
  acceptJob: (jobId: string) => void;
  rejectJob: (jobId: string) => void;
  updateJobStatus: (jobId: string, status: JobStatus) => void;
  completeJob: (jobId: string, otp: string) => boolean;

  // Availability (local)
  availability: Availability[];
  updateAvailability: (availability: Availability[]) => void;
  toggleOnlineStatus: () => Promise<void>;

  // Reviews (demo)
  reviews: WorkerReview[];

  // Stats
  todayEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
}

const WorkerContext = createContext<WorkerContextType | undefined>(undefined);

const mapToWorker = (args: {
  authEmail: string;
  fullName?: string | null;
  phone?: string | null;
  workerRow: {
    id: string;
    category: any;
    rating: number | null;
    total_jobs: number | null;
    experience_years: number | null;
    is_verified: boolean | null;
    is_online: boolean | null;
    created_at: string | null;
  };
}): Worker => {
  const { authEmail, fullName, phone, workerRow } = args;

  return {
    id: workerRow.id,
    name: fullName || authEmail,
    phone: phone || "",
    email: authEmail,
    avatar: "",
    category: workerRow.category,
    rating: Number(workerRow.rating ?? 0),
    totalJobs: Number(workerRow.total_jobs ?? 0),
    completedJobs: Number(workerRow.total_jobs ?? 0),
    experience: `${Number(workerRow.experience_years ?? 0)} years`,
    isAvailable: Boolean(workerRow.is_online),
    isVerified: Boolean(workerRow.is_verified),
    earnings: { today: 0, week: 0, month: 0, total: 0 },
    documents: { aadhar: false, pan: false, bankDetails: false },
    createdAt: workerRow.created_at ? new Date(workerRow.created_at) : new Date(),
  };
};

export const WorkerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentWorker, setCurrentWorker] = useState<Worker | null>(null);
  const [jobs, setJobs] = useState<Job[]>(dummyJobs);
  const [availability, setAvailability] = useState<Availability[]>(defaultAvailability);
  const [reviews] = useState<WorkerReview[]>(dummyReviews);

  const isLoggedIn = Boolean(currentWorker);

  const refreshWorkerFromSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id || !user.email) {
      setCurrentWorker(null);
      return;
    }

    // must be a worker
    const { data: roles, error: roleErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (roleErr) {
      // if roles cannot be read, treat as not worker
      setCurrentWorker(null);
      return;
    }

    const isWorker = roles?.some((r) => r.role === "worker");
    if (!isWorker) {
      setCurrentWorker(null);
      return;
    }

    const { data: workerRow } = await supabase
      .from("workers")
      .select("id, category, rating, total_jobs, experience_years, is_verified, is_online, created_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!workerRow) {
      setCurrentWorker(null);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle();

    setCurrentWorker(
      mapToWorker({
        authEmail: user.email,
        fullName: profile?.full_name,
        phone: profile?.phone,
        workerRow: workerRow as any,
      })
    );
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!mounted) return;
      await refreshWorkerFromSession();
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refreshWorkerFromSession();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error || !data.user) return false;

    await refreshWorkerFromSession();

    // If user signed in but is not worker, sign them out.
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);

    const isWorker = roles?.some((r) => r.role === "worker");
    if (!isWorker) {
      await supabase.auth.signOut();
      setCurrentWorker(null);
      return false;
    }

    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentWorker(null);
  };

  const scopedJobs = useMemo(() => {
    if (!currentWorker) {
      return { pendingJobs: [], activeJob: null as Job | null, completedJobs: [] as Job[] };
    }

    const pendingJobs = jobs.filter(
      (j) => j.status === "pending" && j.serviceCategory === currentWorker.category
    );

    const activeJob =
      jobs.find(
        (j) =>
          ["accepted", "on_the_way", "arrived", "in_progress"].includes(j.status) &&
          j.serviceCategory === currentWorker.category
      ) || null;

    const completedJobs = jobs.filter(
      (j) => j.status === "completed" && j.serviceCategory === currentWorker.category
    );

    return { pendingJobs, activeJob, completedJobs };
  }, [currentWorker, jobs]);

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
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status } : j)));
  };

  const completeJob = (jobId: string, otp: string): boolean => {
    const job = jobs.find((j) => j.id === jobId);
    if (job && job.otp === otp) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId ? { ...j, status: "completed" as JobStatus, completedAt: new Date() } : j
        )
      );
      return true;
    }
    return false;
  };

  const updateAvailability = (newAvailability: Availability[]) => {
    setAvailability(newAvailability);
  };

  const toggleOnlineStatus = async () => {
    if (!currentWorker) return;

    // Mirror online status to backend workers.is_online
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: workerRow } = await supabase
      .from("workers")
      .select("is_online")
      .eq("user_id", user.id)
      .maybeSingle();

    const next = !Boolean(workerRow?.is_online);

    await supabase.from("workers").update({ is_online: next }).eq("user_id", user.id);
    setCurrentWorker({ ...currentWorker, isAvailable: next });
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
        pendingJobs: scopedJobs.pendingJobs,
        activeJob: scopedJobs.activeJob,
        completedJobs: scopedJobs.completedJobs,
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
  if (!context) throw new Error("useWorker must be used within a WorkerProvider");
  return context;
};
