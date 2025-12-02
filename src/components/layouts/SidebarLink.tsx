import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface SidebarLinkProps {
  to: string;
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
}

export function SidebarLink({ to, label, icon: Icon, onClick }: SidebarLinkProps) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
          isActive
            ? 'bg-brand/10 border border-brand/40 text-text-primary font-semibold'
            : 'text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {/* Active indicator bar */}
          {isActive && (
            <motion.span
              layoutId="activeNavIndicator"
              className="absolute left-0 w-1 h-6 bg-brand rounded-r-full"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          
          {/* Icon with hover animation */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <Icon
              className={`h-5 w-5 transition-colors ${
                isActive ? 'text-brand' : 'text-text-muted group-hover:text-text-primary'
              }`}
            />
          </motion.div>
          
          {/* Label */}
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}
