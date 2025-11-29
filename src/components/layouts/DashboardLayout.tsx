import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthPersistence } from '@/hooks/useAuthPersistence';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardNavbar } from './DashboardNavbar';
import { BottomNavigation } from './BottomNavigation';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardLayoutProps {
  children: ReactNode;
  role?: 'user' | 'admin';
}

export function DashboardLayout({ children, role = 'user' }: DashboardLayoutProps) {
  const { user, isAdmin, signOut } = useAuthPersistence();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const effectiveRole = isAdmin ? 'admin' : 'user';

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-bg-canvas">
        <DashboardSidebar 
          role={effectiveRole} 
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
        />
        
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardNavbar 
            user={user} 
            role={effectiveRole}
            onLogout={handleLogout}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
          
          <main className={`flex-1 p-4 sm:p-6 overflow-auto animate-fade-in ${isMobile ? 'pb-24' : ''}`}>
            {children}
          </main>

          {/* Mobile Bottom Navigation */}
          <BottomNavigation role={effectiveRole} />
        </div>
      </div>
    </SidebarProvider>
  );
}
