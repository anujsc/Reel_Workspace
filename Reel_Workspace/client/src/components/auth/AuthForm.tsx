import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "register";

interface AuthFormProps {
  onAuth: (email: string, password: string, mode: AuthMode) => Promise<void>;
}

export function AuthForm({ onAuth }: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirm?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (mode === "register" && password !== confirmPassword) {
      newErrors.confirm = "Passwords don't match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onAuth(email, password, mode);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      {/* Logo */}
      <div className="mb-8 animate-slide-up">
        <div className="flex items-center justify-center gap-3 mb-2">
          <img src="/reelmind-icon.svg" alt="ReelMind" className="w-12 h-12" />
          <h1 className="text-3xl font-bold text-gradient">ReelMind</h1>
        </div>
        <p className="text-muted-foreground text-center">
          Turn Reels into Knowledge
        </p>
      </div>

      {/* Form Card */}
      <div
        className="w-full max-w-sm bento-card animate-slide-up"
        style={{ animationDelay: "0.1s" }}
      >
        {/* Toggle */}
        <div className="flex mb-6 p-1 bg-secondary rounded-xl">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setErrors({});
              }}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                mode === m
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email)
                    setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="Email address"
                className={cn("pl-10", errors.email && "border-destructive")}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive mt-1 animate-fade-in">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password)
                    setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                placeholder="Password"
                className={cn(
                  "pl-10 pr-10",
                  errors.password && "border-destructive"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive mt-1 animate-fade-in">
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password (Register only) */}
          {mode === "register" && (
            <div className="animate-fade-in">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirm)
                      setErrors((prev) => ({ ...prev, confirm: undefined }));
                  }}
                  placeholder="Confirm password"
                  className={cn(
                    "pl-10",
                    errors.confirm && "border-destructive"
                  )}
                />
              </div>
              {errors.confirm && (
                <p className="text-xs text-destructive mt-1 animate-fade-in">
                  {errors.confirm}
                </p>
              )}
            </div>
          )}

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {mode === "login" ? "Signing in..." : "Creating account..."}
              </>
            ) : mode === "login" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </div>

      {/* Footer */}
      <p
        className="text-xs text-muted-foreground mt-8 animate-fade-in"
        style={{ animationDelay: "0.2s" }}
      >
        By continuing, you agree to our Terms & Privacy Policy
      </p>
    </div>
  );
}
