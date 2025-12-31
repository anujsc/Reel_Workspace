import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineLoader } from "@/components/Loader";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirm?: string;
    general?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Email validation (matches server-side)
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please provide a valid email address";
    } else if (email.length > 255) {
      newErrors.email = "Email cannot exceed 255 characters";
    }

    // Password validation (matches server-side requirements)
    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    } else if (password.length > 128) {
      newErrors.password = "Password cannot exceed 128 characters";
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirm = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirm = "Passwords don't match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await register(email, password);
      toast.success("Account created!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Register error:", error);

      // Handle different error types
      if (error.response?.status === 400) {
        const message = error.response?.data?.message || "Invalid request";
        if (message.toLowerCase().includes("exist")) {
          setErrors({ general: "User already exists. Please login instead." });
          toast.error("User already exists");
        } else {
          setErrors({ general: message });
          toast.error(message);
        }
      } else if (error.response?.status === 409) {
        setErrors({ general: "User already exists. Please login instead." });
        toast.error("User already exists");
      } else if (error.message) {
        setErrors({ general: error.message });
        toast.error(error.message);
      } else {
        setErrors({
          general: "Network error. Please check your connection and try again.",
        });
        toast.error("Network error. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative">
      {/* Dark Mode Toggle - Top Right */}
      <div className="absolute top-4 right-4">
        <DarkModeToggle variant="ghost" size="icon" />
      </div>

      {/* Logo */}
      <div className="mb-8 animate-slide-up">
        <div className="flex items-center justify-center gap-3 mb-2">
          <img src="/instagram-logo.png" alt="ReelMind" className="w-12 h-12" />
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
        <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>

        {errors.general && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg animate-fade-in">
            <p className="text-sm text-destructive">{errors.general}</p>
          </div>
        )}

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
                disabled={isLoading}
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
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={isLoading}
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

          {/* Confirm Password */}
          <div>
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
                className={cn("pl-10", errors.confirm && "border-destructive")}
                disabled={isLoading}
              />
            </div>
            {errors.confirm && (
              <p className="text-xs text-destructive mt-1 animate-fade-in">
                {errors.confirm}
              </p>
            )}
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <InlineLoader className="mr-2" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
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
