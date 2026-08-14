import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import PageTransition from '@/components/PageTransition';
import CommandPalette from '@/components/CommandPalette'; // <-- ADD THIS

export default function AppShell({ user, onLogout }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-neutral-100">
      {/* Global Command Palette */}
      <CommandPalette /> 
      
      <Sidebar 
        user={user} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar 
          user={user} 
          onLogout={onLogout}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 md:p-8">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}><Outlet /></PageTransition>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}