import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWorker } from "@/context/WorkerContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Star,
  Phone,
  Mail,
  FileCheck,
  LogOut,
  ChevronRight,
  Shield,
  CreditCard,
  Bell,
  HelpCircle,
} from "lucide-react";
import WorkerNav from "@/components/worker/WorkerNav";
import { getCategoryIcon, getCategoryLabel } from "@/data/workerData";

const WorkerProfile = () => {
  const navigate = useNavigate();
  const { isLoggedIn, currentWorker, logout, reviews } = useWorker();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/worker/login");
    }
  }, [isLoggedIn, navigate]);

  if (!currentWorker) return null;

  const handleLogout = () => {
    logout();
    navigate("/worker/login");
  };

  const menuItems = [
    { icon: FileCheck, label: "Documents", description: "Aadhar, PAN, Bank details" },
    { icon: CreditCard, label: "Bank Account", description: "Manage payment details" },
    { icon: Bell, label: "Notifications", description: "Manage alerts & sounds" },
    { icon: Shield, label: "Privacy & Security", description: "Password & permissions" },
    { icon: HelpCircle, label: "Help & Support", description: "FAQs & contact us" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-primary px-6 pt-12 pb-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/worker")}
            className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-primary-foreground" />
          </button>
          <h1 className="text-2xl font-extrabold text-primary-foreground">Profile</h1>
        </div>

        {/* Profile Card */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary-foreground/20 flex items-center justify-center text-4xl">
            {getCategoryIcon(currentWorker.category)}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-primary-foreground mb-1">
              {currentWorker.name}
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-semibold">
                {getCategoryLabel(currentWorker.category)}
              </Badge>
              {currentWorker.isVerified && (
                <Badge className="bg-success text-success-foreground font-semibold">
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 -mt-4">
        <Card className="shadow-card border-0">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="w-4 h-4 text-warning" fill="currentColor" />
                  <span className="text-lg font-extrabold">{currentWorker.rating}</span>
                </div>
                <p className="text-xs text-muted-foreground font-medium">Rating</p>
              </div>
              <div>
                <p className="text-lg font-extrabold mb-1">{currentWorker.completedJobs}</p>
                <p className="text-xs text-muted-foreground font-medium">Jobs Done</p>
              </div>
              <div>
                <p className="text-lg font-extrabold mb-1">{currentWorker.experience}</p>
                <p className="text-xs text-muted-foreground font-medium">Experience</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Info */}
      <div className="px-6 mt-6">
        <Card className="shadow-card">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">{currentWorker.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">{currentWorker.email}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews Preview */}
      <div className="px-6 mt-6">
        <h3 className="text-lg font-bold mb-3">Recent Reviews</h3>
        <div className="space-y-3">
          {reviews.slice(0, 2).map((review) => (
            <Card key={review.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{review.customerName}</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-warning" fill="currentColor" />
                    <span className="font-bold">{review.rating}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{review.review}</p>
                <p className="text-xs text-muted-foreground/70 mt-2">{review.serviceType}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-6 mt-6">
        <div className="space-y-2">
          {menuItems.map((item, index) => (
            <Card key={index} className="shadow-sm">
              <CardContent className="p-4">
                <button className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="px-6 mt-6 pb-6">
        <Button
          variant="destructive"
          className="w-full h-12 font-bold"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>
      </div>

      <WorkerNav />
    </div>
  );
};

export default WorkerProfile;
