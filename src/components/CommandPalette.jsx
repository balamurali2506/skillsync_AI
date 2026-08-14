import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Search, FileText, Mic, Code, Target, BookOpen, 
  Award, BarChart3, MessageSquare, Zap, LayoutDashboard 
} from 'lucide-react';
import { cn } from '@/lib/cn';

const COMMANDS = [
  { id: 'dashboard', label: 'Go to Dashboard', icon: LayoutDashboard, type: 'navigate', path: '/' },
  { id: 'resume', label: 'Analyze Resume', icon: FileText, type: 'navigate', path: '/resume' },
  { id: 'interview', label: 'Start AI Interview', icon: Mic, type: 'navigate', path: '/interview' },
  { id: 'coding', label: 'Log Coding Problem', icon: Code, type: 'navigate', path: '/coding' },
  { id: 'skills', label: 'View Skill Gaps', icon: Target, type: 'navigate', path: '/skills' },
  { id: 'courses', label: 'Browse Courses', icon: BookOpen, type: 'navigate', path: '/courses' },
  { id: 'achievements', label: 'View Achievements', icon: Award, type: 'navigate', path: '/achievements' },
  { id: 'analytics', label: 'Placement Analytics', icon: BarChart3, type: 'navigate', path: '/analytics' },
  { id: 'chat', label: 'Ask Career Chatbot', icon: MessageSquare, type: 'navigate', path: '/chat' },
  // Quick Actions
  { id: 'action-interview', label: 'Quick Start: Mock Interview', icon: Zap, type: 'action', path: '/interview' },
  { id: 'action-resume', label: 'Quick Start: Upload Resume', icon: Zap, type: 'action', path: '/resume' },
];

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Global Keyboard Shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const filtered = COMMANDS.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-[20%] z-[101] w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 border-b border-neutral-800 px-4 py-3">
              <Search size={20} className="text-neutral-500" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search modules..."
                className="flex-1 bg-transparent text-body text-white placeholder:text-neutral-500 focus:outline-none"
              />
              <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-neutral-700 bg-neutral-800 px-1.5 font-mono text-micro text-neutral-400">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[300px] overflow-y-auto p-2">
              {filtered.length > 0 ? (
                filtered.map((cmd) => (
                  <button
                    key={cmd.id}
                    onClick={() => handleSelect(cmd.path)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-body text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
                  >
                    <cmd.icon size={18} className={cmd.type === 'action' ? 'text-brand-400' : 'text-neutral-500'} />
                    <span className="flex-1">{cmd.label}</span>
                    {cmd.type === 'action' && (
                      <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-micro font-bold uppercase text-brand-400">Action</span>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-3 py-8 text-center text-caption text-neutral-500">
                  No results found for "{query}"
                </div>
              )}
            </div>

            {/* Footer Hint */}
            <div className="flex items-center justify-between border-t border-neutral-800 bg-neutral-900/50 px-4 py-2 text-micro text-neutral-500">
              <span>Navigation & Quick Actions</span>
              <span className="font-mono">⌘K / Ctrl+K</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}