import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LayoutDashboard,
  Users,
  Wrench,
  ShoppingCart,
  CreditCard,
  MessageSquare,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type Order = {
  id: string;
  service_name: string;
  service_type: string;
  category: string;
  status: string;
  total_amount: number;
  scheduled_date: string;
  scheduled_time: string;
  address_text: string;
  created_at: string;
  customer_id: string;
  worker_id: string | null;
  otp: string | null;
};

type Worker = {
  id: string;
  user_id: string;
  category: string;
  rating: number;
  total_jobs: number;
  is_verified: boolean;
  is_online: boolean;
  profiles?: { full_name: string; email: string; phone: string };
};

type Transaction = {
  id: string;
  order_id: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
};

type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [activeTab, setActiveTab] = useState("orders");

  useEffect(() => {
    checkAdminAccess();
    fetchData();
    
    // Subscribe to realtime order updates
    const channel = supabase
      .channel("admin-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roles?.some((r) => r.role === "admin");
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges",
        variant: "destructive",
      });
      navigate("/");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchOrders(),
      fetchWorkers(),
      fetchTransactions(),
      fetchCustomers(),
    ]);
    setLoading(false);
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setOrders(data);
  };

  const fetchWorkers = async () => {
    const { data, error } = await supabase
      .from("workers")
      .select(`
        *,
        profiles:user_id (full_name, email, phone)
      `)
      .order("created_at", { ascending: false });

    if (!error && data) setWorkers(data as any);
  };

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setTransactions(data);
  };

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setCustomers(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-600",
      searching: "bg-blue-500/20 text-blue-600",
      assigned: "bg-purple-500/20 text-purple-600",
      in_progress: "bg-orange-500/20 text-orange-600",
      completed: "bg-green-500/20 text-green-600",
      cancelled: "bg-red-500/20 text-red-600",
    };
    return (
      <Badge className={statusColors[status] || "bg-muted text-muted-foreground"}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getPaymentBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-600",
      paid: "bg-green-500/20 text-green-600",
      failed: "bg-red-500/20 text-red-600",
      refunded: "bg-blue-500/20 text-blue-600",
    };
    return (
      <Badge className={colors[status] || "bg-muted text-muted-foreground"}>
        {status}
      </Badge>
    );
  };

  // Stats
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const activeOrders = orders.filter((o) => ["searching", "assigned", "in_progress"].includes(o.status)).length;
  const completedOrders = orders.filter((o) => o.status === "completed").length;
  const totalRevenue = transactions
    .filter((t) => t.payment_status === "paid")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total Orders</p>
            <p className="text-2xl font-bold">{totalOrders}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{pendingOrders}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-blue-600">{activeOrders}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-green-600">{completedOrders}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Revenue</p>
            <p className="text-2xl font-bold text-primary">₹{totalRevenue.toLocaleString()}</p>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="workers" className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Workers
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Transactions
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>OTP</TableHead>
                    <TableHead>Worker Assigned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No orders yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">
                          {order.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.service_name}</p>
                            <p className="text-xs text-muted-foreground">{order.service_type}</p>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{order.category}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>₹{Number(order.total_amount).toLocaleString()}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{format(new Date(order.scheduled_date), "MMM d, yyyy")}</p>
                            <p className="text-xs text-muted-foreground">{order.scheduled_time}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono font-bold">{order.otp || "-"}</TableCell>
                        <TableCell>
                          {order.worker_id ? (
                            <Badge variant="outline">Assigned</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Workers Tab */}
          <TabsContent value="workers">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Total Jobs</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verified</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : workers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No workers registered yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    workers.map((worker) => (
                      <TableRow key={worker.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{worker.profiles?.full_name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{worker.profiles?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{worker.category}</TableCell>
                        <TableCell>⭐ {Number(worker.rating).toFixed(1)}</TableCell>
                        <TableCell>{worker.total_jobs}</TableCell>
                        <TableCell>
                          <Badge className={worker.is_online ? "bg-green-500/20 text-green-600" : "bg-muted text-muted-foreground"}>
                            {worker.is_online ? "Online" : "Offline"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={worker.is_verified ? "bg-blue-500/20 text-blue-600" : "bg-yellow-500/20 text-yellow-600"}>
                            {worker.is_verified ? "Verified" : "Pending"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No customers yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.full_name || "Unknown"}</TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>{customer.phone || "-"}</TableCell>
                        <TableCell>{format(new Date(customer.created_at), "MMM d, yyyy")}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No transactions yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-xs">{tx.id.slice(0, 8)}...</TableCell>
                        <TableCell className="font-mono text-xs">{tx.order_id.slice(0, 8)}...</TableCell>
                        <TableCell className="font-medium">₹{Number(tx.amount).toLocaleString()}</TableCell>
                        <TableCell className="capitalize">{tx.payment_method}</TableCell>
                        <TableCell>{getPaymentBadge(tx.payment_status)}</TableCell>
                        <TableCell>{format(new Date(tx.created_at), "MMM d, yyyy HH:mm")}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
