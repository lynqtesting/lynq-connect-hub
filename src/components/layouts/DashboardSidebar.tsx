import { useLocation, useNavigate } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import { LayoutDashboard, Layers, Users, MessageSquare, BookOpen, FileText, Settings, Upload, Eye, Calendar, UserPlus, GitPullRequest, Lightbulb, HelpCircle } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader } from '@/components/ui/sidebar';
import Logo from '@/components/Logo';
interface NavItem {
  title: string;
  url: string;
  icon: any;
}
const userNavItems: NavItem[] = [{
  title: 'Dashboard',
  url: '/user-dashboard',
  icon: LayoutDashboard
}, {
  title: 'My Modules',
  url: '/lynq-library',
  icon: BookOpen
}, {
  title: 'My Responses',
  url: '/user-responses',
  icon: FileText
}];
const adminNavItems: NavItem[] = [{
  title: 'Overview',
  url: '/admin-dashboard',
  icon: LayoutDashboard
}, {
  title: 'Module Manager',
  url: '/view-modules',
  icon: Layers
}, {
  title: 'Users',
  url: '/view-users',
  icon: Users
}, {
  title: 'Tweak Requests',
  url: '/admin/tweak-requests',
  icon: MessageSquare
}];
const adminActionsItems: NavItem[] = [{
  title: 'Upload Module',
  url: '/upload-module',
  icon: Upload
}, {
  title: 'Create User',
  url: '/create-user',
  icon: UserPlus
}, {
  title: 'Assign Modules',
  url: '/assign-modules',
  icon: Calendar
}, {
  title: 'Client Requests',
  url: '/admin/client-requests',
  icon: GitPullRequest
}, {
  title: 'View Requests',
  url: '/view-requests',
  icon: Eye
}, {
  title: 'Adaptive Requests',
  url: '/admin/adaptive-requests',
  icon: Lightbulb
}, {
  title: 'Manage Questions',
  url: '/admin/manage-questions',
  icon: HelpCircle
}];
// Animation variants for menu items
const menuVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 }
};

interface DashboardSidebarProps {
  role: 'user' | 'admin';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export function DashboardSidebar({
  role,
  open,
  onOpenChange
}: DashboardSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path;
  const navItems = role === 'admin' ? adminNavItems : userNavItems;
  const showAdminActions = role === 'admin';

  return <Sidebar className="bg-bg-surface/60 backdrop-blur-xl border-r border-border-default" collapsible="none">
      <SidebarHeader className="border-b border-border-default p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <Logo className="flex-shrink-0 h-7 sm:h-8" />
          <div className="flex flex-col min-w-0">
            <span className="text-xs sm:text-sm font-bold text-text-primary truncate">
            </span>
            <span className="text-[10px] sm:text-xs text-text-muted uppercase truncate">
              {role === 'admin' ? '' : ''}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="sr-only">
            {role === 'admin' ? 'ADMIN WORKSPACE' : 'MY LEARNING'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <motion.div
              variants={menuVariants}
              initial="hidden"
              animate="visible"
            >
              <SidebarMenu>
                {navItems.map(item => <motion.div key={item.title} variants={itemVariants}>
                    <SidebarMenuItem className="relative">
                      <SidebarMenuButton 
                        onClick={() => navigate(item.url)} 
                        isActive={isActive(item.url)} 
                        className={`
                          group transition-all duration-200 ease-out rounded-xl mx-2
                          hover:translate-x-1 active:scale-[0.98]
                          ${isActive(item.url) 
                            ? 'bg-brand text-white font-semibold shadow-lg hover:bg-brand-hover' 
                            : 'hover:bg-bg-surface-hover/80 text-text-secondary hover:text-text-primary'}
                        `}
                      >
                        <motion.div 
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                        >
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                        </motion.div>
                        <span className="truncate">{item.title}</span>
                        {isActive(item.url) && (
                          <motion.span 
                            layoutId="activeIndicator"
                            className="ml-auto h-2 w-2 rounded-full bg-white"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                          />
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </motion.div>)}
              </SidebarMenu>
            </motion.div>
          </SidebarGroupContent>
        </SidebarGroup>

        {showAdminActions && <SidebarGroup>
            <SidebarGroupLabel>
              ACTIONS
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <motion.div
                variants={menuVariants}
                initial="hidden"
                animate="visible"
              >
                <SidebarMenu>
                  {adminActionsItems.map(item => <motion.div key={item.title} variants={itemVariants}>
                      <SidebarMenuItem className="relative">
                        <SidebarMenuButton 
                          onClick={() => navigate(item.url)} 
                          isActive={isActive(item.url)} 
                          className={`
                            group transition-all duration-200 ease-out rounded-xl mx-2
                            hover:translate-x-1 active:scale-[0.98]
                            ${isActive(item.url) 
                              ? 'bg-brand text-white font-semibold shadow-lg hover:bg-brand-hover' 
                              : 'hover:bg-bg-surface-hover/80 text-text-secondary hover:text-text-primary'}
                          `}
                        >
                          <motion.div 
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                          >
                            <item.icon className="h-5 w-5 flex-shrink-0" />
                          </motion.div>
                          <span className="truncate">{item.title}</span>
                          {isActive(item.url) && (
                            <motion.span 
                              layoutId="activeIndicatorActions"
                              className="ml-auto h-2 w-2 rounded-full bg-white"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            />
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </motion.div>)}
                </SidebarMenu>
              </motion.div>
            </SidebarGroupContent>
          </SidebarGroup>}
      </SidebarContent>

      <div className="p-3 sm:p-4 border-t border-border-default mt-auto">
        <div className="text-[10px] sm:text-xs text-text-muted">
          Role:{' '}
          <span className={`font-semibold ${role === 'admin' ? 'text-destructive' : 'text-brand'}`}>
            {role === 'admin' ? 'Admin' : 'User'}
          </span>
        </div>
      </div>
    </Sidebar>;
}