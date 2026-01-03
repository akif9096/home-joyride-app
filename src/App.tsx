import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BookingProvider } from "@/context/BookingContext";
import { WorkerProvider } from "@/context/WorkerContext";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import MyBookings from "./pages/MyBookings";
import NotFound from "./pages/NotFound";

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
      <BookingProvider>
        <WorkerProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Customer App */}
              <Route path="/" element={<Index />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/bookings" element={<MyBookings />} />
              
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
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
