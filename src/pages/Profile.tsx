import React from "react";
import { Link } from "react-router-dom";
import { 
  User, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Bell, 
  HelpCircle, 
  Settings, 
  ChevronRight,
  LogOut,
  Wrench
} from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";
import { useBooking } from "@/context/BookingContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: Wrench, label: "My Service Bookings", path: "/bookings", badge: true },
  { icon: MapPin, label: "Saved Addresses", path: "/addresses" },
  { icon: Calendar, label: "My Orders", path: "/orders" },
  { icon: CreditCard, label: "Payment Methods", path: "/payments" },
  { icon: Bell, label: "Notifications", path: "/notifications" },
  { icon: HelpCircle, label: "Help & Support", path: "/help" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const Profile: React.FC = () => {
  const { bookings } = useBooking();
  const activeBookingsCount = bookings.filter(b => b.status !== "completed").length;
  const { isLoggedIn, user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container max-w-md mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{isLoggedIn ? user?.name : "Guest"}</h1>
              <p className="text-sm text-muted-foreground">{isLoggedIn ? user?.phone : "Sign in to view account"}</p>
            </div>
          </div>
        </div>
      </div>

      <main className="container max-w-md mx-auto px-4 py-6">
        {/* Menu */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const showBadge = item.badge && activeBookingsCount > 0;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-4 px-4 py-4 hover:bg-secondary/50 transition-colors",
                  index !== menuItems.length - 1 && "border-b border-border"
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Icon className="w-5 h-5 text-foreground" />
                </div>
                <span className="flex-1 font-medium text-foreground">{item.label}</span>
                {showBadge && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-accent text-accent-foreground rounded-full">
                    {activeBookingsCount}
                  </span>
                )}
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            );
          })}
        </div>

        {/* Auth Action */}
        {isLoggedIn ? (
          <button
            onClick={() => {
              logout();
              toast({ title: "Signed out", description: "You have been signed out." });
            }}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-4 mt-4",
              "bg-card rounded-2xl border border-border",
              "hover:bg-secondary/50 transition-colors"
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-destructive" />
            </div>
            <span className="flex-1 font-medium text-destructive text-left">Log Out</span>
          </button>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-4 mt-4",
              "bg-card rounded-2xl border border-border",
              "hover:bg-secondary/50 transition-colors"
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-primary" />
            </div>
            <span className="flex-1 font-medium text-primary text-left">Sign In</span>
          </button>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
