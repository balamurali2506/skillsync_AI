import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { Plus, Code } from 'lucide-react';
import TickUp from '@/components/ui/TickUp';
import StreakFlame from '@/components/ui/StreakFlame';
import EmptyState from '@/components/ui/EmptyState';
import { api } from '@/lib/api'; // <-- Import the API client

export default function CodingTracker() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true); // Track loading state
  const [streak, setStreak] = useState(12); // Will eventually come from /users/me API
  
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [showSuccess, setShowSuccess] = useState(false);

  // 1. Fetch live data on mount
  useEffect(() => {
    api.get('/problems')
      .then((res) => {
        setProblems(res.data);
      })
      .catch((err) => {
        console.error("Failed to fetch problems", err);
        // Fallback to empty array if API fails so UI doesn't break
        setProblems([]); 
      })
      .finally(() => setLoading(false));
  }, []);

  // 2. Post new data to the backend
  const logProblem = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    try {
      // Send to backend (backend will attach userId from JWT)
      const { data } = await api.post('/problems', { title, difficulty });
      
      // Update local UI state immediately
      setProblems((p) => [data, ...p]);
      setStreak((s) => s + 1);
      setTitle('');
      setShowSuccess(true);
      
      toast.success('Problem logged — streak extended!');
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.7 }, colors: ['#6366f1', '#8b5cf6', '#d946ef', '#a3e635'], disableForReducedMotion: true });
      setTimeout(() => setShowSuccess(false), 2200);
    } catch (err) {
      toast.error("Failed to log problem. Is the backend running?");
    }
  };

  // Show skeleton while fetching from database
  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="skeleton h-10 w-64" />
        <div className="skeleton h-40 w-full rounded-3xl" />
        <div className="skeleton h-60 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-display-xl font-bold uppercase">Coding Tracker</h1>
          <p className="mt-2 text-body text-neutral-500">Log problems and keep your streak alive.</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-card">
          <StreakFlame streak={streak} size={22} />
          <TickUp value={streak} className="font-display text-title-lg font-bold" />
        </div>
      </header>

      <form onSubmit={logProblem} className="rounded-3xl bg-white p-6 shadow-card">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Problem title (e.g. Two Sum)"
            className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-body focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-body">
            <option>Easy</option><option>Medium</option><option>Hard</option>
          </select>
          <button type="submit" className="press flex items-center justify-center gap-2 rounded-xl bg-gradient-brand px-5 py-3 text-body font-semibold text-white shadow-glow">
            <Plus size={16} /> Log
          </button>
        </div>
        <p className="mt-4 font-mono text-caption text-neutral-500">total solved: {problems.length}</p>
      </form>

      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center gap-3 rounded-3xl bg-white p-8 shadow-card">
            <svg width="72" height="72" viewBox="0 0 52 52">
              <motion.circle cx="26" cy="26" r="24" fill="none" strokeWidth="2" className="stroke-emerald-400" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4 }} />
              <motion.path d="M14 27 L22 35 L38 17" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="stroke-emerald-500" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: 0.3 }} />
            </svg>
            <p className="text-title font-semibold text-emerald-600">Problem logged — streak extended!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {problems.length === 0 ? (
        <EmptyState icon={Code} title="No problems logged yet"
          description="Log your first coding problem above to start building your streak." />
      ) : (
        <div className="rounded-3xl bg-white p-6 shadow-card">
          <h3 className="text-title font-semibold">Recent Activity</h3>
          <div className="mt-4 space-y-2">
            {problems.slice(0, 5).map((p) => (
              <div key={p._id || p.id} className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
                <span className="text-body font-medium">{p.title}</span>
                <span className="text-caption text-neutral-500">{p.difficulty}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}