import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, FileText, Code, Mic, Flame, Star, Lock } from 'lucide-react';
import { toast } from 'sonner';

const INITIAL = [
  { id: 1, title: 'First Resume Analyzed', desc: 'Completed your first resume scan.', icon: FileText, earned: true },
  { id: 2, title: 'Century Club', desc: 'Solved 100 coding problems.', icon: Code, earned: true },
  { id: 3, title: 'Interview Ready', desc: 'Finished 10 mock interviews.', icon: Mic, earned: true },
  { id: 4, title: 'Week Streak', desc: 'Maintained a 7-day streak.', icon: Flame, earned: true },
  { id: 5, title: 'Top Scorer', desc: 'Score 95+ on a resume analysis.', icon: Trophy, earned: false },
  { id: 6, title: 'Polyglot', desc: 'Solve problems in 3 languages.', icon: Star, earned: false },
];

export default function Achievements() {
  const [earned, setEarned] = useState(() => new Set(INITIAL.filter((a) => a.earned).map((a) => a.id)));

  const unlock = (id) => {
    if (earned.has(id)) return;
    setEarned((prev) => new Set(prev).add(id));
    toast.success('Achievement unlocked!');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header>
        <h1 className="font-display text-display-xl font-bold uppercase">Achievement Portfolio</h1>
        <p className="mt-2 text-body text-neutral-500">Your milestones, unlocked. Tap a locked card to demo.</p>
      </header>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {INITIAL.map((a, i) => {
          const isEarned = earned.has(a.id);
          return (
            <motion.button key={a.id} onClick={() => unlock(a.id)}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22, delay: i * 0.06 }}
              whileHover={{ y: -2 }}
              className={`rounded-2xl p-6 text-left shadow-card ${isEarned ? 'bg-white' : 'bg-neutral-50 opacity-70'}`}>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${isEarned ? 'bg-gradient-brand text-white shadow-glow' : 'bg-neutral-200 text-neutral-400'}`}>
                {isEarned ? <a.icon size={24} /> : <Lock size={22} />}
              </div>
              <h3 className="mt-4 text-title font-semibold">{a.title}</h3>
              <p className="mt-1 text-caption text-neutral-500">{a.desc}</p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}