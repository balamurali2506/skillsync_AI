import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FileText, Mic, Code, BookOpen,
  Target, MessageSquare, BarChart3, Award, Shield,
  PanelLeftClose, PanelLeftOpen, X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import Logo from '@/components/Logo';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'resume', label: 'Resume Analyzer', icon: FileText, path: '/resume' },
  { id: 'interview', label: 'Interview Coach', icon: Mic, path: '/interview' },
  { id: 'coding', label: 'Coding Tracker', icon: Code, path: '/coding' },
  { id: 'courses', label: 'Course Recs', icon: BookOpen, path: '/courses' },
  { id: 'skills', label: 'Skill Gap', icon: Target, path: '/skills' },
  { id: 'chat', label: 'Career Chatbot', icon: MessageSquare, path: '/chat' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { id: 'achievements', label: 'Achievements', icon: Award, path: '/achievements' },
  { id: 'admin', label: 'Admin', icon: Shield, path: '/admin', role: 'admin' },
];

export default function Sidebar({ user, isOpen, onClose }) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', isCollapsed);
  }, [isCollapsed]);

  const visibleItems = navItems.filter((item) => !item.role || item.role === user?.role);

  // Mobile drawer always shows labels; desktop respects collapse state
  const showLabels = isOpen || !isCollapsed;

  return (
    <>
      {/* Mobile backdrop overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          // ── MOBILE: fixed drawer = completely out of layout flow (NO left gap!) ──
          'fixed left-0 top-0 z-40 flex h-screen w-[260px] flex-col border-r border-neutral-800 bg-neutral-950',
          'transition-all duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',

          // ── DESKTOP: back in the flex flow, always visible, collapsible width ──
          'lg:sticky lg:top-0 lg:translate-x-0',
          isCollapsed ? 'lg:w-20' : 'lg:w-[260px]',
        )}
      >
        {/* Logo / header */}
        <div className="flex h-16 items-center justify-between border-b border-neutral-800 px-5">
          {showLabels ? (
            <Logo size="md" glow theme="dark" />
          ) : (
            <span className="mx-auto text-xl font-bold text-brand-500">S_</span>
          )}

          {/* Mobile close button */}
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white lg:hidden">
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <NavLink key={item.id} to={item.path} onClick={onClose} className="block relative">
                <div
                  className={cn(
                    'relative flex items-center gap-3 rounded-lg px-3 py-2.5',
                    isActive ? 'text-white' : 'text-neutral-400 hover:text-neutral-100',
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-pill"
                      className="absolute inset-0 rounded-lg border border-brand-500/30 bg-gradient-brand-soft"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    className="relative z-10"
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </motion.div>
                  {showLabels && (
                    <span className="relative z-10 font-display text-micro font-semibold uppercase tracking-wider">
                      {item.label}
                    </span>
                  )}
                </div>
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse toggle — desktop only */}
        <div className="hidden border-t border-neutral-800 p-3 lg:block">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex w-full items-center justify-center rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-900 hover:text-white"
          >
            {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>
      </aside>
    </>
  );
}