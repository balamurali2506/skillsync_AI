import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from 'cmdk';
import { Search, LayoutDashboard, FileText, Mic, Code, BookOpen, Target, MessageSquare, BarChart3, Award, Shield } from 'lucide-react';

const COMMANDS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'resume', label: 'Resume Analyzer', icon: FileText, path: '/resume' },
  { id: 'interview', label: 'Interview Coach', icon: Mic, path: '/interview' },
  { id: 'coding', label: 'Coding Tracker', icon: Code, path: '/coding' },
  { id: 'courses', label: 'Course Recs', icon: BookOpen, path: '/courses' },
  { id: 'skills', label: 'Skill Gap', icon: Target, path: '/skills' },
  { id: 'chat', label: 'Career Chatbot', icon: MessageSquare, path: '/chat' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { id: 'achievements', label: 'Achievements', icon: Award, path: '/achievements' },
  { id: 'admin', label: 'Admin', icon: Shield, path: '/admin' },
];

export default function CommandPalette({ open, onOpenChange, children }) {
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onOpenChange((o) => !o); }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [onOpenChange]);

  const handleSelect = (path) => { navigate(path); onOpenChange(false); };

  return (
    <>
      {children}
      <CommandDialog open={open} onOpenChange={onOpenChange}>
        <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl">
          <div className="flex items-center border-b border-neutral-800 px-4">
            <Search className="mr-2 h-4 w-4 text-neutral-500" />
            <CommandInput placeholder="Type a command or search…"
              className="h-12 w-full bg-transparent py-3 text-body text-white placeholder:text-neutral-500 focus:outline-none" />
          </div>
          <CommandList className="max-h-[300px] overflow-y-auto p-2">
            <CommandEmpty className="py-6 text-center text-caption text-neutral-500">No results found.</CommandEmpty>
            <CommandGroup heading="Modules" className="px-2 py-1.5 text-micro uppercase tracking-wider text-neutral-500">
              {COMMANDS.map((cmd) => (
                <CommandItem key={cmd.id} onSelect={() => handleSelect(cmd.path)}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-body text-neutral-300 transition-colors data-[selected=true]:bg-neutral-900 data-[selected=true]:text-white">
                  <cmd.icon size={18} className="text-brand-400" />
                  <span className="font-sans">{cmd.label}</span>
                  <span className="ml-auto font-mono text-micro text-neutral-600">{cmd.path}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </div>
      </CommandDialog>
    </>
  );
}