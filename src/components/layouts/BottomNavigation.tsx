import { useLocation, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { 
  LayoutDashboard, 
  BookOpen,
  FileText,
  Layers,
  Users,
  MessageSquare,
  Menu
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

interface NavItem {
  title: string;
  url: string;
  icon: any;
}

const userNavItems: NavItem[] = [
  { title: 'Dashboard', url: '/user-dashboard', icon: LayoutDashboard },
  { title: 'Modules', url: '/lynq-library', icon: BookOpen },
  { title: 'Responses', url: '/user-responses', icon: FileText },
];

const adminNavItems: NavItem[] = [
  { title: 'Overview', url: '/admin-dashboard', icon: LayoutDashboard },
  { title: 'Modules', url: '/view-modules', icon: Layers },
  { title: 'Users', url: '/view-users', icon: Users },
  { title: 'Requests', url: '/admin/tweak-requests', icon: MessageSquare },
];

const moreUserItems: NavItem[] = [
  { title: 'My Dashboard', url: '/user-dashboard', icon: LayoutDashboard },
  { title: 'My Modules', url: '/lynq-library', icon: BookOpen },
  { title: 'My Responses', url: '/user-responses', icon: FileText },
];

const moreAdminItems: NavItem[] = [
  { title: 'Overview', url: '/admin-dashboard', icon: LayoutDashboard },
  { title: 'Module Manager', url: '/view-modules', icon: Layers },
  { title: 'Users', url: '/view-users', icon: Users },
  { title: 'Tweak Requests', url: '/admin/tweak-requests', icon: MessageSquare },
  { title: 'Upload Module', url: '/upload-module', icon: Layers },
  { title: 'Create User', url: '/create-user', icon: Users },
  { title: 'Assign Modules', url: '/assign-modules', icon: BookOpen },
  { title: 'Client Requests', url: '/admin/client-requests', icon: MessageSquare },
  { title: 'View Requests', url: '/view-requests', icon: FileText },
];

interface BottomNavigationProps {
  role: 'user' | 'admin';
}

export function BottomNavigation({ role }: BottomNavigationProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);
  
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 100], [1, 0]);

  if (!isMobile) return null;

  const navItems = role === 'admin' ? adminNavItems : userNavItems;
  const moreItems = role === 'admin' ? moreAdminItems : moreUserItems;
  
  const isActive = (path: string) => location.pathname === path;

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50;
    const currentIndex = navItems.findIndex(item => isActive(item.url));
    
    if (Math.abs(info.offset.x) > swipeThreshold) {
      if (info.offset.x > 0 && currentIndex > 0) {
        // Swipe right - go to previous
        navigate(navItems[currentIndex - 1].url);
      } else if (info.offset.x < 0 && currentIndex < navItems.length - 1) {
        // Swipe left - go to next
        navigate(navItems[currentIndex + 1].url);
      }
    }
  };

  return (
    <>
      {/* Swipe detector overlay */}
      <motion.div
        className="fixed inset-0 pointer-events-auto z-40"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ touchAction: 'pan-y' }}
      />

      {/* Bottom Navigation Bar */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        style={{ opacity }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-bg-surface/95 backdrop-blur-xl border-t border-border-default pb-safe pointer-events-auto"
      >
        <div className="flex items-center justify-around px-2 py-3 max-w-screen-xl mx-auto">
          {navItems.map((item) => {
            const isItemActive = isActive(item.url);
            return (
              <motion.button
                key={item.url}
                onClick={() => navigate(item.url)}
                className={`
                  flex flex-col items-center gap-1 px-3 py-2 rounded-xl
                  transition-colors min-w-[64px] touch-manipulation
                  ${isItemActive 
                    ? 'text-brand' 
                    : 'text-text-muted'
                  }
                `}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
              >
                <motion.div
                  initial={false}
                  animate={{
                    scale: isItemActive ? 1.1 : 1,
                    y: isItemActive ? -2 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <item.icon className="h-6 w-6" strokeWidth={isItemActive ? 2.5 : 2} />
                </motion.div>
                <span 
                  className={`text-xs font-medium ${isItemActive ? 'font-semibold' : ''}`}
                >
                  {item.title}
                </span>
                {isItemActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -bottom-0.5 h-1 w-12 bg-brand rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}

          {/* Menu/More Button */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <motion.button
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-text-muted min-w-[64px] touch-manipulation"
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
              >
                <Menu className="h-6 w-6" strokeWidth={2} />
                <span className="text-xs font-medium">More</span>
              </motion.button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[60vh] rounded-t-3xl bg-bg-surface">
              <div className="flex flex-col gap-2 py-4">
                <h3 className="text-lg font-semibold text-text-primary mb-2 px-2">
                  {role === 'admin' ? 'Admin Menu' : 'Menu'}
                </h3>
                <div className="grid gap-1">
                  {moreItems.map((item) => {
                    const isItemActive = isActive(item.url);
                    return (
                      <motion.button
                        key={item.url}
                        onClick={() => {
                          navigate(item.url);
                          setSheetOpen(false);
                        }}
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-xl text-left
                          transition-colors touch-manipulation
                          ${isItemActive 
                            ? 'bg-brand/10 text-brand font-semibold' 
                            : 'text-text-secondary hover:bg-bg-surface-hover'
                          }
                        `}
                        whileTap={{ scale: 0.98 }}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <span>{item.title}</span>
                        {isItemActive && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="ml-auto h-2 w-2 rounded-full bg-brand"
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </motion.nav>
    </>
  );
}
