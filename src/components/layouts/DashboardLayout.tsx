import { ReactNode } from 'react';
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
    <div className="min-h-screen bg-bg-canvas text-text-primary flex w-full overflow-x-hidden">
      <Sidebar role={effectiveRole} user={user || undefined} />
      
      <main
        className={cn(
          'flex-1 overflow-x-hidden',
          'md:ml-64',
          isMobile ? 'pt-16' : 'pt-0',
          'p-3 sm:p-4 md:p-6',
          'min-h-screen'
        )}
        style={isMobile ? {
          paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))'
        } : undefined}
      >
        <div className="max-w-full overflow-x-hidden">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && <BottomNavigation role={effectiveRole} />}
    </div>
  );
}
