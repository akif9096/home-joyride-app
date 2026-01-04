import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Order = {
  id: string;
  service_name: string;
  service_type: string;
  service_icon: string | null;
  category: string;
  status: string;
  total_amount: number;
  scheduled_date: string;
  scheduled_time: string;
  address_text: string;
  otp: string | null;
  worker_id: string | null;
  created_at: string;
  worker?: {
    id: string;
    rating: number;
    profiles?: { full_name: string; phone: string };
  };
};

export const useOrders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    subscribeToUpdates();
  }, []);

  const fetchOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        worker:workers (
          id,
          rating,
          profiles:user_id (full_name, phone)
        )
      `)
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data as any);
    }
    setLoading(false);
  };

  const subscribeToUpdates = () => {
    const channel = supabase
      .channel("customer-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setOrders((prev) =>
              prev.map((o) => (o.id === payload.new.id ? { ...o, ...payload.new } : o))
            );
            
            // Show toast for status changes
            const newStatus = (payload.new as any).status;
            if (newStatus === "assigned") {
              toast({
                title: "Worker Assigned! 🎉",
                description: "A worker has accepted your order. Please choose payment method.",
              });
            }
          } else if (payload.eventType === "INSERT") {
            fetchOrders();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const createOrder = async (orderData: {
    service_name: string;
    service_type: string;
    service_icon?: string;
    category: string;
    address_text: string;
    scheduled_date: string;
    scheduled_time: string;
    total_amount: number;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to book a service",
        variant: "destructive",
      });
      return null;
    }

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const { data, error } = await supabase
      .from("orders")
      .insert({
        customer_id: user.id,
        service_name: orderData.service_name,
        service_type: orderData.service_type,
        service_icon: orderData.service_icon,
        category: orderData.category as any,
        address_text: orderData.address_text,
        scheduled_date: orderData.scheduled_date,
        scheduled_time: orderData.scheduled_time,
        total_amount: orderData.total_amount,
        status: "searching",
        otp,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }

    toast({
      title: "Order Placed! 🎉",
      description: "Searching for available workers...",
    });

    fetchOrders();
    return data;
  };

  const cancelOrder = async (orderId: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Order Cancelled",
      description: "Your order has been cancelled",
    });

    fetchOrders();
    return true;
  };

  return {
    orders,
    loading,
    createOrder,
    cancelOrder,
    refetch: fetchOrders,
  };
};
