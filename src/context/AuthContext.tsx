import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

type User = {
  name: string;
  phone: string;
};

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: (phone: string, password?: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const isLoggedIn = Boolean(user);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("customer_user");
      if (raw) setUser(JSON.parse(raw));
    } catch (e) {
      // ignore
    }
  }, []);

  const login = (phone: string) => {
    // Demo login: accepts any phone, and creates a simple user
    if (!phone) return false;
    const u: User = { name: "Jane Doe", phone };
    setUser(u);
    localStorage.setItem("customer_user", JSON.stringify(u));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("customer_user");
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
