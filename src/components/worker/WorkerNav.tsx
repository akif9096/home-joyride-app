import { useLocation, useNavigate } from "react-router-dom";
import { Home, Briefcase, Calendar, Wallet, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", path: "/worker" },
  { icon: Briefcase, label: "Jobs", path: "/worker/jobs" },
  { icon: Calendar, label: "Schedule", path: "/worker/availability" },
  { icon: Wallet, label: "Earnings", path: "/worker/earnings" },
  { icon: User, label: "Profile", path: "/worker/profile" },
];

const WorkerNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-card">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-16 py-2 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
              <span className={cn("text-xs font-semibold", isActive && "font-bold")}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default WorkerNav;
