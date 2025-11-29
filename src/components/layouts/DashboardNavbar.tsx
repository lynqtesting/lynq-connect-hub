import { Moon, Sun, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useTheme } from '@/context/ThemeContext';

interface DashboardNavbarProps {
  user: any;
  role: 'user' | 'admin';
  onLogout: () => void;
  onToggleSidebar: () => void;
}

export function DashboardNavbar({ user, role, onLogout, onToggleSidebar }: DashboardNavbarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-14 border-b border-border-default bg-bg-surface/60 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full h-9 w-9 hover:scale-110 active:scale-90 active:rotate-12 transition-all duration-200"
        >
          <div className="relative w-5 h-5">
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 animate-in spin-in-180 zoom-in-75 duration-300" />
            ) : (
              <Moon className="h-5 w-5 animate-in spin-in-180 zoom-in-75 duration-300" />
            )}
          </div>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
