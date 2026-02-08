import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type User = {
  name: string;
  phone?: string;
  email?: string;
};

type UserRole = "customer" | "worker" | "admin" | null;

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  userRole: UserRole;
  login: (phone: string, password?: string) => Promise<boolean> | boolean;
  logout: () => Promise<void> | void;
  setUserRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const isLoggedIn = Boolean(user);

  useEffect(() => {
    // Prefer supabase auth as the source of truth, but fall back to demo localStorage
    let mounted = true;

    const init = async () => {
      try {
        const { data: { user: sUser } } = await supabase.auth.getUser();
        if (mounted && sUser) {
          setUser({ name: sUser.user_metadata?.full_name || sUser.email || "", email: sUser.email || undefined });
          
          // Fetch user role from database
          try {
            const { data: roleData } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", sUser.id)
              .single();
            
            if (roleData) {
              setUserRole((roleData.role as UserRole) || "customer");
            } else {
              setUserRole("customer");
            }
          } catch {
            setUserRole("customer");
          }
          return;
        }
      } catch (e) {
        // ignore
      }

      try {
        const raw = localStorage.getItem("customer_user");
        const roleRaw = localStorage.getItem("user_role");
        if (raw) {
          setUser(JSON.parse(raw));
          if (roleRaw) setUserRole(JSON.parse(roleRaw));
        }
      } catch (e) {
        // ignore
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setUser({ name: session.user.user_metadata?.full_name || session.user.email || "", email: session.user.email || undefined });
        
        // Fetch user role
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setUserRole((data.role as UserRole) || "customer");
            }
          })
          .catch(() => setUserRole("customer"));
      } else {
        setUser(null);
        setUserRole(null);
        try {
          localStorage.removeItem("customer_user");
          localStorage.removeItem("user_role");
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
    setUserRole(null);
    try {
      localStorage.removeItem("customer_user");
      localStorage.removeItem("user_role");
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, userRole, login, logout, setUserRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
