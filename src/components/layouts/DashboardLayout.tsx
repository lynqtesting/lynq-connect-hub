import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthPersistence } from '@/hooks/useAuthPersistence';
import { Sidebar } from './Sidebar';
import { BottomNavigation } from './BottomNavigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  role?: 'user' | 'admin';
}

export function DashboardLayout({ children, role = 'user' }: DashboardLayoutProps) {
  const { user, isAdmin } = useAuthPersistence();
  const isMobile = useIsMobile();

  const effectiveRole = isAdmin ? 'admin' : 'user';

  return (
    <div className="min-h-screen bg-bg-canvas text-text-primary flex">
      <Sidebar role={effectiveRole} user={user || undefined} />
      
      <main
        className={cn(
          'flex-1 overflow-x-hidden',
          'md:ml-64', // Offset for fixed sidebar on desktop
          isMobile ? 'pt-14 pb-24' : 'pt-0', // Padding for mobile top bar and bottom nav
          'p-4 sm:p-6'
        )}
      >
        <div className="animate-fade-in">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && <BottomNavigation role={effectiveRole} />}
    </div>
  );
}
