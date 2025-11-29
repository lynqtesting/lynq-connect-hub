import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthPersistence } from '@/hooks/useAuthPersistence';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardNavbar } from './DashboardNavbar';
import { SidebarProvider } from '@/components/ui/sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
  role?: 'user' | 'admin';
}

export function DashboardLayout({ children, role = 'user' }: DashboardLayoutProps) {
  const { user, isAdmin, signOut } = useAuthPersistence();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const effectiveRole = isAdmin ? 'admin' : 'user';

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
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
          
          <main className="flex-1 p-4 sm:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
