import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWorker } from "@/context/WorkerContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Star,
  Briefcase,
  Clock,
  MapPin,
  Phone,
  ChevronRight,
  User,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { getCategoryIcon, getCategoryLabel } from "@/data/workerData";
import WorkerNav from "@/components/worker/WorkerNav";

const WorkerDashboard = () => {
  const navigate = useNavigate();
  const {
    isLoggedIn,
    currentWorker,
    pendingJobs,
    activeJob,
    toggleOnlineStatus,
    todayEarnings,
    acceptJob,
    rejectJob,
    updateJobStatus,
  } = useWorker();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/worker/login");
    }
  }, [isLoggedIn, navigate]);

  if (!currentWorker) return null;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-primary px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-primary-foreground/20 flex items-center justify-center text-2xl">
              {getCategoryIcon(currentWorker.category)}
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-primary-foreground">
                {currentWorker.name}
              </h1>
              <p className="text-primary-foreground/80 font-medium">
                {getCategoryLabel(currentWorker.category)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={currentWorker.isAvailable}
              onCheckedChange={toggleOnlineStatus}
            />
            <span className="text-sm font-bold text-primary-foreground">
              {currentWorker.isAvailable ? "Online" : "Offline"}
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-primary-foreground/10 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-4 h-4 text-warning" fill="currentColor" />
              <span className="text-lg font-extrabold text-primary-foreground">
                {currentWorker.rating}
              </span>
            </div>
            <p className="text-xs text-primary-foreground/70 font-medium">Rating</p>
          </div>
          <div className="bg-primary-foreground/10 rounded-xl p-3 text-center">
            <div className="text-lg font-extrabold text-primary-foreground mb-1">
              {currentWorker.completedJobs}
            </div>
            <p className="text-xs text-primary-foreground/70 font-medium">Jobs Done</p>
          </div>
          <div className="bg-primary-foreground/10 rounded-xl p-3 text-center">
            <div className="text-lg font-extrabold text-primary-foreground mb-1">
              {currentWorker.experience}
            </div>
            <p className="text-xs text-primary-foreground/70 font-medium">Experience</p>
          </div>
        </div>
      </div>

      {/* Today's Earnings */}
      <div className="px-6 -mt-4">
        <Card className="shadow-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Today's Earnings</p>
                  <p className="text-2xl font-extrabold text-foreground">₹{todayEarnings}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/worker/earnings")}>
                <TrendingUp className="w-5 h-5 mr-1" />
                Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Job */}
      {activeJob && (
        <div className="px-6 mt-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Active Job
          </h2>
          <Card className="shadow-card border-2 border-primary">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="secondary" className="font-bold">
                  {activeJob.serviceType.name}
                </Badge>
                <span className="text-lg font-extrabold text-success">
                  ₹{activeJob.workerEarnings}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold">{activeJob.customerName}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <span className="text-muted-foreground">{activeJob.customerAddress.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{activeJob.scheduledTime}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {activeJob.status === "accepted" && (
                  <Button
                    className="flex-1 font-bold"
                    onClick={() => updateJobStatus(activeJob.id, "on_the_way")}
                  >
                    Start Journey
                  </Button>
                )}
                {activeJob.status === "on_the_way" && (
                  <Button
                    className="flex-1 font-bold"
                    onClick={() => updateJobStatus(activeJob.id, "arrived")}
                  >
                    I've Arrived
                  </Button>
                )}
                {activeJob.status === "arrived" && (
                  <Button
                    className="flex-1 font-bold"
                    onClick={() => updateJobStatus(activeJob.id, "in_progress")}
                  >
                    Start Work
                  </Button>
                )}
                {activeJob.status === "in_progress" && (
                  <Button
                    className="flex-1 font-bold bg-success hover:bg-success/90"
                    onClick={() => navigate(`/worker/complete/${activeJob.id}`)}
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Complete Job
                  </Button>
                )}
                <Button variant="outline" size="icon">
                  <Phone className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending Jobs */}
      <div className="px-6 mt-6">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-accent" />
          New Job Requests
          {pendingJobs.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pendingJobs.length}
            </Badge>
          )}
        </h2>

        {pendingJobs.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">No pending requests</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                New jobs will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingJobs.map((job) => (
              <Card key={job.id} className="shadow-card animate-in">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="secondary" className="font-bold">
                      {job.serviceType.name}
                    </Badge>
                    <span className="text-lg font-extrabold text-success">
                      ₹{job.workerEarnings}
                    </span>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold">{job.customerName}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <span className="text-muted-foreground line-clamp-1">
                        {job.customerAddress.address}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{job.scheduledTime}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 font-bold"
                      onClick={() => rejectJob(job.id)}
                    >
                      Decline
                    </Button>
                    <Button
                      className="flex-1 font-bold"
                      onClick={() => acceptJob(job.id)}
                      disabled={!!activeJob}
                    >
                      Accept
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="px-6 mt-6 pb-6">
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-between h-14 px-4 font-semibold"
            onClick={() => navigate("/worker/jobs")}
          >
            <span className="flex items-center gap-3">
              <Briefcase className="w-5 h-5" />
              Job History
            </span>
            <ChevronRight className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-between h-14 px-4 font-semibold"
            onClick={() => navigate("/worker/availability")}
          >
            <span className="flex items-center gap-3">
              <Clock className="w-5 h-5" />
              Set Availability
            </span>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <WorkerNav />
    </div>
  );
};

export default WorkerDashboard;
