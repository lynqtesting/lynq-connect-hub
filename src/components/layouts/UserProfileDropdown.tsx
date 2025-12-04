import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserProfileModal } from '@/components/UserProfileModal';

interface UserProfileDropdownProps {
  user: {
    id?: string;
    name: string;
    email: string;
    role: string;
    initials: string;
  };
}

export function UserProfileDropdown({ user }: UserProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState(user.name);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  // Sync displayName when user prop changes
  useEffect(() => {
    setDisplayName(user.name);
  }, [user.name]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        triggerRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
    setIsOpen(false);
  };

  const handleViewProfile = () => {
    setIsOpen(false);
    setIsProfileModalOpen(true);
  };

  const handleProfileUpdate = (newName: string) => {
    setDisplayName(newName);
  };

  const getInitials = () => {
    if (displayName) {
      return displayName.substring(0, 2).toUpperCase();
    }
    return user.initials;
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-text-muted hover:bg-bg-surface-hover hover:text-text-primary cursor-pointer transition-colors group"
        aria-label="User profile menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-semibold text-brand">{getInitials()}</span>
        </div>

        {/* User Info */}
        <div className="flex-1 overflow-hidden text-left min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">
            {displayName}
          </p>
          <p className="text-xs text-text-muted truncate">
            {user.role}
          </p>
        </div>

        {/* Chevron Icon */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          <ChevronUp className="h-4 w-4 text-text-muted group-hover:text-text-primary" />
        </motion.div>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute bottom-full mb-2 left-0 right-0 w-full min-w-[220px] bg-bg-surface border border-border-default rounded-xl shadow-2xl z-50 overflow-hidden"
            role="menu"
          >
            {/* User Info Section */}
            <div className="p-4 border-b border-border-default">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-brand">{getInitials()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-text-muted truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <button
                onClick={handleViewProfile}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary transition-colors text-left"
                role="menuitem"
              >
                <User className="h-4 w-4" />
                <span>View Profile</span>
              </button>
            </div>

            {/* Logout Button */}
            <div className="p-2 border-t border-border-default">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors text-left"
                role="menuitem"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={{ ...user, name: displayName, initials: getInitials() }}
        onProfileUpdate={handleProfileUpdate}
      />
    </div>
  );
}
