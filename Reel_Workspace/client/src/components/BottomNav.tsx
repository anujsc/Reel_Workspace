import { Home, Search, FolderOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = 'home' | 'search' | 'folders' | 'profile';

interface BottomNavProps {
  activeItem: NavItem;
  onNavigate: (item: NavItem) => void;
}

export function BottomNav({ activeItem, onNavigate }: BottomNavProps) {
  const items: { key: NavItem; icon: React.ReactNode; label: string }[] = [
    { key: 'home', icon: <Home className="w-5 h-5" />, label: 'Home' },
    { key: 'search', icon: <Search className="w-5 h-5" />, label: 'Search' },
    { key: 'folders', icon: <FolderOpen className="w-5 h-5" />, label: 'Folders' },
    { key: 'profile', icon: <User className="w-5 h-5" />, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50 pb-safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-xl transition-all duration-200",
              activeItem === item.key
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className={cn(
              "p-1.5 rounded-lg transition-all duration-200",
              activeItem === item.key && "bg-primary/20"
            )}>
              {item.icon}
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
