import { motion } from 'framer-motion';
import { FileText, Code, Mic, ChevronRight } from 'lucide-react';
import CountUp from '@/components/ui/CountUp';
import StreakFlame from '@/components/ui/StreakFlame';
import { staggerContainer, staggerItem } from '@/lib/motion';

const stats = [
  { label: 'ATS Resume Score', value: 87, suffix: '', icon: FileText, accent: 'text-brand-500' },
  { label: 'Problems Solved', value: 236, icon: Code, accent: 'text-accent-violet' },
  { label: 'Mock Interviews', value: 14, icon: Mic, accent: 'text-accent-fuchsia' },
];

const activity = [
  { icon: FileText, text: 'Resume "v3_final.pdf" scored 87/100', time: '2h ago' },
  { icon: Code, text: 'Solved "LRU Cache" (Medium)', time: '5h ago' },
  { icon: Mic, text: 'Completed mock interview — Delivery 82', time: '1d ago' },
];

function StatCard({ label, value, suffix, icon: Icon, accent }) {
  return (
    <motion.div variants={staggerItem} whileHover={{ y: -2 }} className="rounded-2xl bg-white p-6 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-micro font-semibold uppercase tracking-wider text-neutral-500">{label}</span>
        <Icon size={20} className={accent} />
      </div>
      <p className="mt-3 font-display text-display-lg font-bold">
        <CountUp value={value} suffix={suffix} />
      </p>
    </motion.div>
  );
}

export default function Dashboard() {
  const streak = 12;
  return (
    <motion.div variants={staggerContainer(0.08)} initial="initial" animate="animate" className="mx-auto max-w-7xl space-y-8">
      <motion.div variants={staggerItem}>
        <h1 className="font-display text-display-xl font-bold uppercase">Dashboard</h1>
        <p className="mt-2 text-body text-neutral-500">Welcome back — here's your career prep at a glance.</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
        {/* Streak card with flickering flame */}
        <motion.div variants={staggerItem} whileHover={{ y: -2 }} className="rounded-2xl bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-micro font-semibold uppercase tracking-wider text-neutral-500">Day Streak</span>
            <StreakFlame streak={streak} size={22} />
          </div>
          <p className="mt-3 flex items-baseline gap-1.5 font-display text-display-lg font-bold">
            <CountUp value={streak} />
            <span className="font-sans text-caption font-normal text-neutral-500">days</span>
          </p>
        </motion.div>
      </div>

      <motion.div variants={staggerItem} className="rounded-2xl bg-white p-6 shadow-card">
        <h2 className="text-title font-semibold">Recent Activity</h2>
        <div className="mt-4 space-y-3">
          {activity.map((a) => (
            <div key={a.text} className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-neutral-50">
              <a.icon size={18} className="text-brand-500" />
              <span className="flex-1 text-body text-neutral-700">{a.text}</span>
              <span className="font-mono text-micro text-neutral-400">{a.time}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}