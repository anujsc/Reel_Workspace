import { useState } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { Dashboard } from "./Dashboard";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  const handleAuth = async (email: string, password: string, mode: 'login' | 'register') => {
    // Simulate authentication delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // For demo purposes, always succeed
    toast({
      title: mode === 'login' ? "Welcome back!" : "Account created!",
      description: mode === 'login' 
        ? "You've been signed in successfully." 
        : "Your account has been created. Welcome to ReelMind!",
    });

    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    toast({
      title: "Signed out",
      description: "You've been signed out successfully.",
    });
  };

  if (!isAuthenticated) {
    return <AuthForm onAuth={handleAuth} />;
  }

  return <Dashboard onLogout={handleLogout} />;
};

export default Index;
