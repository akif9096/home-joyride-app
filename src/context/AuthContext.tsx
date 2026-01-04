import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type User = {
  name: string;
  phone?: string;
  email?: string;
};

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: (phone: string, password?: string) => Promise<boolean> | boolean;
  logout: () => Promise<void> | void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const isLoggedIn = Boolean(user);

  useEffect(() => {
    // Prefer supabase auth as the source of truth, but fall back to demo localStorage
    let mounted = true;

    const init = async () => {
      try {
        const { data: { user: sUser } } = await supabase.auth.getUser();
        if (mounted && sUser) {
          setUser({ name: sUser.user_metadata?.full_name || sUser.email || "", email: sUser.email || undefined });
          return;
        }
      } catch (e) {
        // ignore
      }

      try {
        const raw = localStorage.getItem("customer_user");
        if (raw) setUser(JSON.parse(raw));
      } catch (e) {
        // ignore
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setUser({ name: session.user.user_metadata?.full_name || session.user.email || "", email: session.user.email || undefined });
      } else {
        setUser(null);
        try {
          localStorage.removeItem("customer_user");
        } catch {}
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = (phone: string) => {
    // Demo login: accepts any phone, and creates a simple user
    if (!phone) return false;
    const u: User = { name: "Jane Doe", phone };
    setUser(u);
    try {
      localStorage.setItem("customer_user", JSON.stringify(u));
    } catch {}
    return true;
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
    try {
      localStorage.removeItem("customer_user");
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
