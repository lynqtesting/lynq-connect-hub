import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  MessageCircle,
  Layers,
  Users,
  MessageSquare,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { SidebarLink } from './SidebarLink';
import { UserProfileDropdown } from './UserProfileDropdown';
import Logo from '@/components/Logo';
import { useTheme } from '@/context/ThemeContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface SidebarProps {
  role: 'user' | 'admin';
  user?: {
    email?: string;
    username?: string;
  };
}

const NAV_ITEMS = {
  user: [
    { to: '/user-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/lynq-library', label: 'Modules', icon: BookOpen },
    { to: '/user-responses', label: 'Responses', icon: MessageCircle },
  ],
  admin: [
    { to: '/admin-dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/view-modules', label: 'Modules', icon: Layers },
    { to: '/view-users', label: 'Users', icon: Users },
    { to: '/admin/tweak-requests', label: 'Requests', icon: MessageSquare },
  ],
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

export function Sidebar({ role, user }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();
  const navItems = NAV_ITEMS[role];

  const getInitials = () => {
    if (user?.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = () => {
    return user?.username || user?.email?.split('@')[0] || 'User';
  };

  const closeDrawer = () => setIsOpen(false);

  // Theme Toggle Button Component
  const ThemeToggleButton = () => (
    <motion.button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-bg-surface-hover hover:bg-border-default text-text-secondary hover:text-text-primary transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait">
        {theme === 'dark' ? (
          <motion.div
            key="sun"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="h-4 w-4" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="h-4 w-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header - Logo and Theme Toggle */}
      <div className="flex items-center justify-between px-3 mb-8">
        <Logo className="h-8" />
        <div className="flex items-center gap-2">
          <ThemeToggleButton />
          {isMobile && (
            <motion.button
              onClick={closeDrawer}
              className="p-2 rounded-lg hover:bg-bg-surface-hover text-text-muted hover:text-text-primary"
              whileTap={{ scale: 0.95 }}
            >
              <X className="h-5 w-5" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <motion.nav
        className="flex-1 space-y-1.5 px-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {navItems.map((item) => (
          <motion.div key={item.to} variants={itemVariants}>
            <SidebarLink {...item} onClick={isMobile ? closeDrawer : undefined} />
          </motion.div>
        ))}
      </motion.nav>

      {/* Footer - User Profile Only */}
      <div className="px-2 py-3">
        <UserProfileDropdown
          user={{
            name: getDisplayName(),
            email: user?.email || '',
            role: role === 'admin' ? 'Administrator' : 'Learner',
            initials: getInitials(),
          }}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 h-14 bg-bg-surface/95 backdrop-blur-xl border-b border-border-default flex items-center justify-between px-4 z-50">
          <Logo className="h-6" />
          <div className="flex items-center gap-2">
            <ThemeToggleButton />
            <motion.button
              onClick={() => setIsOpen(true)}
              className="p-2 rounded-lg hover:bg-bg-surface-hover text-text-muted hover:text-text-primary"
              whileTap={{ scale: 0.95 }}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </motion.button>
          </div>
        </header>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <motion.aside
          className="fixed inset-y-0 left-0 w-64 bg-bg-surface border-r border-border-default px-5 py-6 z-40"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <SidebarContent />
        </motion.aside>
      )}

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDrawer}
            />

            {/* Drawer Panel */}
            <motion.aside
              className="fixed inset-y-0 left-0 w-64 bg-bg-surface z-50 shadow-xl px-5 py-6"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
