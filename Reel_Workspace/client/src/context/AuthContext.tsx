import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { User } from "../lib/types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const checkAuth = async () => {
    const storedToken = localStorage.getItem("authToken");
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get("/api/auth/me");
      // Backend wraps response in { success, data: { user } }
      setUser(response.data.data.user);
      setToken(storedToken);
    } catch (error) {
      localStorage.removeItem("authToken");
      setToken(null);
      setUser(null);
      // Clear cache on auth failure
      queryClient.clear();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    // Clear cache before login to remove previous user's data
    queryClient.clear();

    const response = await api.post("/api/auth/login", { email, password });
    // Backend wraps response in { success, data: { user, token } }
    const { token: newToken, user: userData } = response.data.data;

    localStorage.setItem("authToken", newToken);
    setToken(newToken);
    setUser(userData);

    console.log("✅ Login successful - Cache cleared for new user");
  };

  const register = async (email: string, password: string) => {
    // Clear cache before register to ensure clean state
    queryClient.clear();

    const response = await api.post("/api/auth/register", { email, password });
    // Backend wraps response in { success, data: { user, token } }
    const { token: newToken, user: userData } = response.data.data;

    localStorage.setItem("authToken", newToken);
    setToken(newToken);
    setUser(userData);

    console.log("✅ Registration successful - Cache cleared for new user");
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setToken(null);
    setUser(null);

    // Clear all React Query cache on logout
    queryClient.clear();
    console.log("✅ Logout successful - All cache cleared");
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
