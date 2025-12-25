import { Home, FolderOpen, Plus, Search, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  onAddClick: () => void;
  className?: string;
}

export function BottomNav({ onAddClick, className }: BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      icon: Home,
      label: "Library",
      path: "/dashboard",
      onClick: () => navigate("/dashboard"),
    },
    {
      icon: FolderOpen,
      label: "Collections",
      path: "/collections",
      onClick: () => {}, // Will open drawer
    },
    {
      icon: Plus,
      label: "Add",
      path: null,
      onClick: onAddClick,
      isPrimary: true,
    },
    {
      icon: Search,
      label: "Search",
      path: "/search",
      onClick: () => navigate("/search"),
    },
    {
      icon: User,
      label: "Profile",
      path: "/profile",
      onClick: () => {}, // Will open profile
    },
  ];

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200",
        "safe-area-bottom", // For notched devices
        className
      )}
      role="navigation"
      aria-label="Bottom navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = item.path === location.pathname;

          if (item.isPrimary) {
            return (
              <button
                key={index}
                onClick={item.onClick}
                className={cn(
                  "flex flex-col items-center justify-center",
                  "w-14 h-14 -mt-6 rounded-full",
                  "bg-gradient-to-br from-blue-600 to-blue-700",
                  "text-white shadow-lg",
                  "active:scale-95 transition-transform",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                )}
                aria-label={item.label}
              >
                <Icon className="w-6 h-6" />
              </button>
            );
          }

          return (
            <button
              key={index}
              onClick={item.onClick}
              className={cn(
                "flex flex-col items-center justify-center gap-1",
                "min-w-[64px] h-full px-2",
                "transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded-lg",
                isActive
                  ? "text-blue-600"
                  : "text-gray-600 active:text-gray-900"
              )}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className={cn("w-6 h-6", isActive && "scale-110")} />
              <span
                className={cn(
                  "text-xs font-medium",
                  isActive && "font-semibold"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
