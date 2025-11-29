import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Layers, 
  Users, 
  MessageSquare, 
  BookOpen,
  FileText,
  Settings,
  Upload,
  Eye,
  Calendar,
  UserPlus,
  GitPullRequest,
  Lightbulb,
  HelpCircle
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import Logo from '@/components/Logo';

interface NavItem {
  title: string;
  url: string;
  icon: any;
}

const userNavItems: NavItem[] = [
  { title: 'Dashboard', url: '/user-dashboard', icon: LayoutDashboard },
  { title: 'My Modules', url: '/lynq-library', icon: BookOpen },
  { title: 'My Responses', url: '/user-dashboard', icon: FileText },
];

const adminNavItems: NavItem[] = [
  { title: 'Overview', url: '/admin-dashboard', icon: LayoutDashboard },
  { title: 'Module Manager', url: '/view-modules', icon: Layers },
  { title: 'Users', url: '/view-users', icon: Users },
  { title: 'Tweak Requests', url: '/admin/tweak-requests', icon: MessageSquare },
];

const adminActionsItems: NavItem[] = [
  { title: 'Upload Module', url: '/upload-module', icon: Upload },
  { title: 'Create User', url: '/create-user', icon: UserPlus },
  { title: 'Assign Modules', url: '/assign-modules', icon: Calendar },
  { title: 'Client Requests', url: '/admin/client-requests', icon: GitPullRequest },
  { title: 'View Requests', url: '/view-requests', icon: Eye },
  { title: 'Adaptive Requests', url: '/admin/adaptive-requests', icon: Lightbulb },
  { title: 'Manage Questions', url: '/admin/manage-questions', icon: HelpCircle },
];

interface DashboardSidebarProps {
  role: 'user' | 'admin';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DashboardSidebar({ role, open, onOpenChange }: DashboardSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();

  const isActive = (path: string) => location.pathname === path;
  
  const navItems = role === 'admin' ? adminNavItems : userNavItems;
  const showAdminActions = role === 'admin';
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar 
      className={`${isCollapsed ? "w-14" : "w-60"} bg-bg-surface/60 backdrop-blur-xl border-r border-border-default`}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-border-default p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <Logo className="h-7 sm:h-8 flex-shrink-0" />
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm font-bold text-text-primary truncate">LYNQ</span>
              <span className="text-[10px] sm:text-xs text-text-muted uppercase truncate">
                {role === 'admin' ? 'Admin Workspace' : 'My Learning'}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
            {role === 'admin' ? 'ADMIN WORKSPACE' : 'MY LEARNING'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.url)}
                    isActive={isActive(item.url)}
                    className={`
                      transition-all duration-200 rounded-xl mx-2
                      ${isActive(item.url) 
                        ? 'bg-brand text-white font-semibold shadow-md hover:bg-brand-hover' 
                        : 'hover:bg-bg-surface-hover text-text-secondary hover:text-text-primary'
                      }
                    `}
                    tooltip={isCollapsed ? item.title : undefined}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.title}</span>}
                    {!isCollapsed && isActive(item.url) && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-white animate-pulse" />
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {showAdminActions && (
          <SidebarGroup>
            <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
              ACTIONS
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminActionsItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.url)}
                      isActive={isActive(item.url)}
                      className={`
                        transition-all duration-200 rounded-xl mx-2
                        ${isActive(item.url) 
                          ? 'bg-brand text-white font-semibold shadow-md hover:bg-brand-hover' 
                          : 'hover:bg-bg-surface-hover text-text-secondary hover:text-text-primary'
                        }
                      `}
                      tooltip={isCollapsed ? item.title : undefined}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span className="truncate">{item.title}</span>}
                      {!isCollapsed && isActive(item.url) && (
                        <span className="ml-auto h-2 w-2 rounded-full bg-white animate-pulse" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {!isCollapsed && (
        <div className="p-3 sm:p-4 border-t border-border-default mt-auto">
          <div className="text-[10px] sm:text-xs text-text-muted">
            Role:{' '}
            <span className={`font-semibold ${role === 'admin' ? 'text-destructive' : 'text-brand'}`}>
              {role === 'admin' ? 'Admin' : 'User'}
            </span>
          </div>
        </div>
      )}
    </Sidebar>
  );
}
