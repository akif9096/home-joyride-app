import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type PendingOrder = {
  id: string;
  service_name: string;
  service_type: string;
  category: string;
  address_text: string;
  scheduled_date: string;
  scheduled_time: string;
  total_amount: number;
  status?: string;
};

type WorkerCategory = "plumber" | "carpenter" | "painter" | "electrician" | "cleaner" | "ac_repair";

export const useWorkerNotifications = (workerId: string | null, workerCategory: WorkerCategory | null) => {
  const { toast } = useToast();
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [isRinging, setIsRinging] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!workerId || !workerCategory) return;

    // Fetch initial pending orders for this category
    fetchPendingOrders();

    // Subscribe to new orders
    const channel = supabase
      .channel("worker-order-alerts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `category=eq.${workerCategory}`,
        },
        (payload) => {
          const newOrder = payload.new as PendingOrder;
          if (newOrder.status === "pending" || newOrder.status === "searching") {
            setPendingOrders((prev) => [newOrder, ...prev]);
            startRinging();
            toast({
              title: "New Order Alert! 🔔",
              description: `${newOrder.service_name} - ${newOrder.service_type}`,
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const updatedOrder = payload.new as any;
          // Remove from pending if assigned or cancelled
          if (updatedOrder.status !== "pending" && updatedOrder.status !== "searching") {
            setPendingOrders((prev) => prev.filter((o) => o.id !== updatedOrder.id));
            if (pendingOrders.length <= 1) {
              stopRinging();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      stopRinging();
    };
  }, [workerId, workerCategory]);

  const fetchPendingOrders = async () => {
    if (!workerCategory) return;

    const { data, error } = await supabase
      .from("orders")
      .select("id, service_name, service_type, category, address_text, scheduled_date, scheduled_time, total_amount")
      .eq("category", workerCategory)
      .in("status", ["pending", "searching"])
      .is("worker_id", null)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPendingOrders(data);
      if (data.length > 0) {
        startRinging();
      }
    }
  };

  const startRinging = () => {
    setIsRinging(true);
    // Create and play notification sound
    if (!audioRef.current) {
      audioRef.current = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU");
    }
    // Use Web Audio API for continuous beeping
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      
      const playBeep = () => {
        if (!isRinging) return;
        
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = "sine";
        
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
      };

      // Play beep every 2 seconds
      const beepInterval = setInterval(() => {
        if (pendingOrders.length > 0) {
          playBeep();
        } else {
          clearInterval(beepInterval);
        }
      }, 2000);

      // Initial beep
      playBeep();
    } catch (e) {
      console.log("Audio playback not supported");
    }
  };

  const stopRinging = () => {
    setIsRinging(false);
  };

  const acceptOrder = async (orderId: string) => {
    if (!workerId) return { error: "No worker ID" };

    const { error } = await supabase
      .from("orders")
      .update({ 
        worker_id: workerId, 
        status: "assigned" 
      })
      .eq("id", orderId)
      .is("worker_id", null); // Only if not already assigned

    if (!error) {
      setPendingOrders((prev) => prev.filter((o) => o.id !== orderId));
      if (pendingOrders.length <= 1) {
        stopRinging();
      }
      toast({
        title: "Order Accepted!",
        description: "Customer will choose payment method.",
      });
    }

    return { error };
  };

  const rejectOrder = (orderId: string) => {
    setPendingOrders((prev) => prev.filter((o) => o.id !== orderId));
    if (pendingOrders.length <= 1) {
      stopRinging();
    }
  };

  return {
    pendingOrders,
    isRinging,
    acceptOrder,
    rejectOrder,
    stopRinging,
    refetch: fetchPendingOrders,
  };
};
