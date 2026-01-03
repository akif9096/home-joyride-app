import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWorker } from "@/context/WorkerContext";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Wallet, TrendingUp, Calendar, IndianRupee } from "lucide-react";
import WorkerNav from "@/components/worker/WorkerNav";

const WorkerEarnings = () => {
  const navigate = useNavigate();
  const { isLoggedIn, currentWorker, todayEarnings, weeklyEarnings, monthlyEarnings } = useWorker();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/worker/login");
    }
  }, [isLoggedIn, navigate]);

  if (!currentWorker) return null;

  const earningsData = [
    { label: "Today", amount: todayEarnings, icon: Calendar, color: "bg-primary" },
    { label: "This Week", amount: weeklyEarnings, icon: TrendingUp, color: "bg-success" },
    { label: "This Month", amount: monthlyEarnings, icon: Wallet, color: "bg-accent" },
    { label: "Total Lifetime", amount: currentWorker.earnings.total, icon: IndianRupee, color: "bg-service-painter" },
  ];

  // Sample transaction data
  const transactions = [
    { id: 1, type: "Tap Repair", customer: "Priya S.", amount: 180, date: "Today, 2:30 PM" },
    { id: 2, type: "Pipe Fitting", customer: "Rahul V.", amount: 280, date: "Today, 11:00 AM" },
    { id: 3, type: "Drainage Cleaning", customer: "Anita D.", amount: 350, date: "Yesterday" },
    { id: 4, type: "Toilet Repair", customer: "Kiran M.", amount: 220, date: "Yesterday" },
    { id: 5, type: "Tap Repair", customer: "Sanjay G.", amount: 180, date: "2 days ago" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 pt-12 pb-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/worker")}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-extrabold">Earnings</h1>
        </div>
      </div>

      {/* Earnings Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-2 gap-4">
          {earningsData.map((item, index) => (
            <Card
              key={index}
              className={`shadow-card ${index === 3 ? "col-span-2" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${item.color}/10 flex items-center justify-center`}>
                    <item.icon className={`w-5 h-5 ${item.color.replace("bg-", "text-")}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">{item.label}</p>
                    <p className="text-xl font-extrabold">₹{item.amount.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Transactions */}
      <div className="px-6">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="all" className="font-semibold">All</TabsTrigger>
            <TabsTrigger value="today" className="font-semibold">Today</TabsTrigger>
            <TabsTrigger value="week" className="font-semibold">This Week</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3">
            {transactions.map((tx) => (
              <Card key={tx.id} className="shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold">{tx.type}</p>
                    <p className="text-sm text-muted-foreground">{tx.customer}</p>
                    <p className="text-xs text-muted-foreground/70">{tx.date}</p>
                  </div>
                  <span className="text-lg font-extrabold text-success">+₹{tx.amount}</span>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="today" className="space-y-3">
            {transactions.slice(0, 2).map((tx) => (
              <Card key={tx.id} className="shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold">{tx.type}</p>
                    <p className="text-sm text-muted-foreground">{tx.customer}</p>
                  </div>
                  <span className="text-lg font-extrabold text-success">+₹{tx.amount}</span>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="week" className="space-y-3">
            {transactions.map((tx) => (
              <Card key={tx.id} className="shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold">{tx.type}</p>
                    <p className="text-sm text-muted-foreground">{tx.customer}</p>
                    <p className="text-xs text-muted-foreground/70">{tx.date}</p>
                  </div>
                  <span className="text-lg font-extrabold text-success">+₹{tx.amount}</span>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      <WorkerNav />
    </div>
  );
};

export default WorkerEarnings;
