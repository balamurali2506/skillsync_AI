import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, FileText, Mic, Code, BookOpen, 
  Target, MessageSquare, BarChart3, Award, Shield, PanelLeftClose, PanelLeftOpen 
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
  // Added role restriction
  { id: 'admin', label: 'Admin', icon: Shield, path: '/admin', role: 'admin' }, 
];

export default function Sidebar({ user }) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', isCollapsed);
  }, [isCollapsed]);

  // Filter out admin link if user is not an admin
  const visibleItems = navItems.filter(item => !item.role || item.role === user?.role);

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
      className="sticky top-0 left-0 h-screen bg-neutral-950 border-r border-neutral-800 flex flex-col z-40"
    >
      <div className="h-16 flex items-center px-5 border-b border-neutral-800">
        {!isCollapsed && <Logo size="md" glow theme="dark" />}
        {isCollapsed && <span className="text-brand-500 text-xl font-bold mx-auto">S_</span>}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <NavLink key={item.id} to={item.path} className="block relative">
              <div className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg relative group',
                  isActive ? 'text-white' : 'text-neutral-400 hover:text-neutral-100'
                )}>
                {isActive && (
                  <motion.div layoutId="active-nav-pill"
                    className="absolute inset-0 bg-gradient-brand-soft border border-brand-500/30 rounded-lg"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                )}
                <motion.div whileHover={{ scale: 1.15, rotate: 5 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }} className="relative z-10">
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </motion.div>
                {!isCollapsed && (
                  <span className="relative z-10 font-display text-micro uppercase tracking-wider font-semibold">
                    {item.label}
                  </span>
                )}
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* New Collapse Icons */}
      <div className="p-3 border-t border-neutral-800">
        <button onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-neutral-500 hover:bg-neutral-900 hover:text-white transition-colors">
          {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>
    </motion.aside>
  );
}