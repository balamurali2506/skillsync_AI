import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LogOut, User, Settings } from 'lucide-react';

const MODULES = [
  { id: 'dashboard', label: 'Dashboard', path: '/' },
  { id: 'resume', label: 'Resume Analyzer', path: '/resume' },
  { id: 'interview', label: 'Interview Coach', path: '/interview' },
  { id: 'coding', label: 'Coding Tracker', path: '/coding' },
  { id: 'courses', label: 'Course Recs', path: '/courses' },
  { id: 'skills', label: 'Skill Gap', path: '/skills' },
  { id: 'chat', label: 'Career Chatbot', path: '/chat' },
  { id: 'analytics', label: 'Analytics', path: '/analytics' },
  { id: 'achievements', label: 'Achievements', path: '/achievements' },
  { id: 'admin', label: 'Admin', path: '/admin' },
];

export default function Topbar({ user, onLogout }) {
  const [query, setQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const searchRef = useRef(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Filter modules based on user role
  const availableModules = MODULES.filter(m => {
    if (m.id === 'admin' && user?.role !== 'admin') return false;
    return true;
  });

  const filteredModules = availableModules.filter(m => 
    m.label.toLowerCase().includes(query.toLowerCase())
  );

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) setShowSearch(false);
      if (menuRef.current && !menuRef.current.contains(event.target)) setShowMenu(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name, email) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    if (email) return email.substring(0, 2).toUpperCase();
    return 'U';
  };

  const handleNavigate = (path) => {
    navigate(path);
    setQuery('');
    setShowSearch(false);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-800 bg-neutral-950/80 px-6 backdrop-blur-md">
      
      {/* Inline Search */}
      <div className="relative w-full max-w-xs" ref={searchRef}>
        <div className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-neutral-400 focus-within:border-brand-500 transition-colors">
          <Search size={16} />
          <input 
            type="text" 
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowSearch(true); }}
            onFocus={() => setShowSearch(true)}
            placeholder="Search modules..."
            className="bg-transparent text-body text-white placeholder:text-neutral-500 focus:outline-none w-full"
          />
        </div>

        {showSearch && query && (
          <div className="absolute top-full left-0 mt-2 w-64 rounded-xl border border-neutral-800 bg-neutral-950 shadow-lift overflow-hidden z-50">
            {filteredModules.length > 0 ? (
              <div className="py-2">
                {filteredModules.map((m) => (
                  <button 
                    key={m.id} 
                    onClick={() => handleNavigate(m.path)}
                    className="w-full text-left px-4 py-2 text-body text-neutral-300 hover:bg-neutral-900 hover:text-white transition-colors"
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 text-caption text-neutral-500">No modules found</div>
            )}
          </div>
        )}
      </div>

      {/* User Avatar & Dropdown Menu */}
      <div className="flex items-center gap-4">
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-brand font-display text-micro font-bold text-white shadow-glow hover:scale-105 transition-transform"
          >
            {getInitials(user?.name, user?.email)}
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-neutral-800 bg-neutral-950 shadow-lift overflow-hidden z-50">
              <div className="border-b border-neutral-800 px-4 py-3">
                <p className="text-body font-semibold text-white truncate">{user?.name}</p>
                <p className="text-caption text-neutral-500 truncate">{user?.email}</p>
                <span className="mt-1 inline-block rounded-full bg-brand-500/10 px-2 py-0.5 text-micro font-semibold uppercase tracking-wider text-brand-400">
                  {user?.role || 'Student'}
                </span>
              </div>
              <div className="py-2">
                <button className="w-full flex items-center gap-3 px-4 py-2 text-body text-neutral-300 hover:bg-neutral-900 hover:text-white transition-colors text-left">
                  <User size={16} /> Profile
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2 text-body text-neutral-300 hover:bg-neutral-900 hover:text-white transition-colors text-left">
                  <Settings size={16} /> Settings
                </button>
              </div>
              <div className="border-t border-neutral-800 py-2">
                <button 
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-body text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                >
                  <LogOut size={16} /> Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}