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
      className={isCollapsed ? "w-14" : "w-60"}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <Logo className="h-8" />
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-sidebar-foreground">LYNQ</span>
              <span className="text-xs text-sidebar-foreground/60 uppercase">
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
                      ${isActive(item.url) 
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                        : 'hover:bg-sidebar-accent/50'
                      }
                    `}
                  >
                    <item.icon className="h-4 w-4" />
                    {!isCollapsed && <span>{item.title}</span>}
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
                        ${isActive(item.url) 
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                          : 'hover:bg-sidebar-accent/50'
                        }
                      `}
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {!isCollapsed && role === 'admin' && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="text-xs text-sidebar-foreground/50">
            Simulate Role Switch:{' '}
            <span className="text-destructive font-medium">Admin</span>
          </div>
        </div>
      )}
      
      {!isCollapsed && role === 'user' && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="text-xs text-sidebar-foreground/50">
            Simulate Role Switch:{' '}
            <span className="text-primary font-medium">User</span>
          </div>
        </div>
      )}
    </Sidebar>
  );
}
