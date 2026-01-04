import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { BookingProvider } from "@/context/BookingContext";
import { WorkerProvider } from "@/context/WorkerContext";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import MyBookings from "./pages/MyBookings";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Auth from "./pages/Auth";
import Orders from "./pages/Orders";
import Search from "./pages/Search";
import Addresses from "./pages/Addresses";
import Payments from "./pages/Payments";
import Notifications from "./pages/Notifications";
import Help from "./pages/Help";
import Settings from "./pages/Settings";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";

// Worker pages
import WorkerLogin from "./pages/worker/WorkerLogin";
import WorkerDashboard from "./pages/worker/WorkerDashboard";
import WorkerEarnings from "./pages/worker/WorkerEarnings";
import WorkerJobs from "./pages/worker/WorkerJobs";
import WorkerAvailability from "./pages/worker/WorkerAvailability";
import WorkerProfile from "./pages/worker/WorkerProfile";
import CompleteJob from "./pages/worker/CompleteJob";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BookingProvider>
          <WorkerProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Customer App */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/bookings" element={<MyBookings />} />
                <Route path="/login" element={<Login />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/search" element={<Search />} />
                <Route path="/addresses" element={<Addresses />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/help" element={<Help />} />
                <Route path="/settings" element={<Settings />} />

                {/* Admin App */}
                <Route path="/admin" element={<AdminDashboard />} />

                {/* Worker App */}
                <Route path="/worker/login" element={<WorkerLogin />} />
                <Route path="/worker" element={<WorkerDashboard />} />
                <Route path="/worker/earnings" element={<WorkerEarnings />} />
                <Route path="/worker/jobs" element={<WorkerJobs />} />
                <Route path="/worker/availability" element={<WorkerAvailability />} />
                <Route path="/worker/profile" element={<WorkerProfile />} />
                <Route path="/worker/complete/:jobId" element={<CompleteJob />} />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </WorkerProvider>
        </BookingProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
