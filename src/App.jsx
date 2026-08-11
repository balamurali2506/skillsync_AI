import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { Toaster } from 'sonner';
import AppShell from '@/layouts/AppShell';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import ResumeAnalyzer from '@/pages/ResumeAnalyzer';
import InterviewCoach from '@/pages/InterviewCoach';
import CodingTracker from '@/pages/CodingTracker';
import CourseRecs from '@/pages/CourseRecs';
import SkillGap from '@/pages/SkillGap';
import CareerChatbot from '@/pages/CareerChatbot';
import Analytics from '@/pages/Analytics';
import Achievements from '@/pages/Achievements';
import Admin from '@/pages/Admin';

export default function App() {
  // Global auth state
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('ss_user');
    return stored ? JSON.parse(stored) : null;
  });
  const authed = Boolean(localStorage.getItem('ss_token') && user);

  const login = (token, userData) => {
    localStorage.setItem('ss_token', token);
    localStorage.setItem('ss_user', JSON.stringify(userData));
    setUser(userData); // Triggers immediate re-render!
  };

  const logout = () => {
    localStorage.removeItem('ss_token');
    localStorage.removeItem('ss_user');
    setUser(null);
  };

  return (
    <MotionConfig reducedMotion="user">
      <Toaster position="top-right" gap={12} toastOptions={{
        style: {
          background: 'var(--color-neutral-900)', color: 'var(--color-neutral-50)',
          border: '1px solid var(--color-neutral-700)', borderRadius: '0.75rem',
          fontFamily: 'var(--font-sans)', fontSize: '0.9375rem', boxShadow: 'var(--shadow-lift)',
        },
      }} />
      <Routes>
        <Route path="/login" element={authed ? <Navigate to="/" replace /> : <Auth onLogin={login} />} />
        
        <Route element={authed ? <AppShell user={user} onLogout={logout} /> : <Navigate to="/login" replace />}>
          <Route index element={<Dashboard />} />
          <Route path="resume" element={<ResumeAnalyzer />} />
          <Route path="interview" element={<InterviewCoach />} />
          <Route path="coding" element={<CodingTracker />} />
          <Route path="courses" element={<CourseRecs />} />
          <Route path="skills" element={<SkillGap />} />
          <Route path="chat" element={<CareerChatbot />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="achievements" element={<Achievements />} />
          
          {/* ROLE PROTECTION: Only admins can access this route */}
          <Route path="admin" element={user?.role === 'admin' ? <Admin /> : <Navigate to="/" replace />} />
        </Route>
        
        <Route path="*" element={<Navigate to={authed ? '/' : '/login'} replace />} />
      </Routes>
    </MotionConfig>
  );
}