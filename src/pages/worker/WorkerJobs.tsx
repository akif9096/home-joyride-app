import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWorker } from "@/context/WorkerContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, MapPin, Clock, Star, User } from "lucide-react";
import WorkerNav from "@/components/worker/WorkerNav";
import { format } from "date-fns";

const WorkerJobs = () => {
  const navigate = useNavigate();
  const { isLoggedIn, completedJobs, activeJob, pendingJobs } = useWorker();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/worker/login");
    }
  }, [isLoggedIn, navigate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success text-success-foreground";
      case "in_progress":
        return "bg-primary text-primary-foreground";
      case "pending":
        return "bg-warning text-warning-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 pt-12 pb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate("/worker")}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-extrabold">My Jobs</h1>
        </div>
      </div>

      {/* Jobs Tabs */}
      <div className="px-6 py-6">
        <Tabs defaultValue="completed" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="active" className="font-semibold">
              Active {activeJob ? "(1)" : "(0)"}
            </TabsTrigger>
            <TabsTrigger value="pending" className="font-semibold">
              Pending ({pendingJobs.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="font-semibold">
              History ({completedJobs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-3">
            {activeJob ? (
              <Card className="shadow-card border-2 border-primary">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className={getStatusColor(activeJob.status)}>
                      {activeJob.status.replace("_", " ").toUpperCase()}
                    </Badge>
                    <span className="text-lg font-extrabold text-success">
                      ₹{activeJob.workerEarnings}
                    </span>
                  </div>
                  <h3 className="font-bold mb-2">{activeJob.serviceType.name}</h3>
                  <div className="space-y-2">
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
                      <span>{activeJob.scheduledTime}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground font-medium">No active jobs</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-3">
            {pendingJobs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground font-medium">No pending requests</p>
              </div>
            ) : (
              pendingJobs.map((job) => (
                <Card key={job.id} className="shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={getStatusColor(job.status)}>NEW</Badge>
                      <span className="text-lg font-extrabold text-success">
                        ₹{job.workerEarnings}
                      </span>
                    </div>
                    <h3 className="font-bold mb-2">{job.serviceType.name}</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{job.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{job.scheduledTime}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3">
            {completedJobs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground font-medium">No completed jobs yet</p>
              </div>
            ) : (
              completedJobs.map((job) => (
                <Card key={job.id} className="shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={getStatusColor(job.status)}>COMPLETED</Badge>
                      <span className="text-lg font-extrabold text-success">
                        ₹{job.workerEarnings}
                      </span>
                    </div>
                    <h3 className="font-bold mb-2">{job.serviceType.name}</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{job.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {job.completedAt && format(job.completedAt, "MMM d, h:mm a")}
                        </span>
                      </div>
                      {job.rating && (
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="w-4 h-4 text-warning" fill="currentColor" />
                          <span className="font-semibold">{job.rating}/5</span>
                          {job.review && (
                            <span className="text-muted-foreground ml-2">"{job.review}"</span>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <WorkerNav />
    </div>
  );
};

export default WorkerJobs;
