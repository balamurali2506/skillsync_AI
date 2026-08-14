import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, FileText, Mic, Code, Target, Loader2, TrendingUp, ChevronRight, Zap } from 'lucide-react';
import CountUp from '@/components/ui/CountUp';
import StreakFlame from '@/components/ui/StreakFlame';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';

const stagger = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
};
const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

function BreakdownBar({ label, value, onClick }) {
  if (value === null || value === undefined) {
    return (
      <div className="flex items-center justify-between py-1.5">
        <span className="text-caption font-medium text-neutral-500">{label}</span>
        <span className="text-micro font-bold uppercase tracking-wider text-neutral-400">Not Assessed</span>
      </div>
    );
  }
  return (
    <button onClick={onClick} className="w-full group text-left">
      <div className="flex items-center justify-between mb-1">
        <span className="text-caption font-medium text-neutral-700 group-hover:text-brand-600 transition-colors">{label}</span>
        <span className="font-mono text-caption font-bold text-neutral-900">{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className={cn('h-full rounded-full', value >= 75 ? 'bg-gradient-score-high' : value >= 45 ? 'bg-gradient-score-mid' : 'bg-gradient-score-low')} />
      </div>
    </button>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-neutral-200 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-neutral-200 rounded-3xl lg:col-span-1" />
          <div className="h-64 bg-neutral-200 rounded-3xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!data) return <div className="text-center py-20 text-neutral-500">Failed to load dashboard data.</div>;

  const { user, readiness, resume, interview, dailyPlan, aiInsight } = data;
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="mx-auto max-w-7xl space-y-8 pb-12">
      
      {/* 1. Personalized Header */}
      <motion.div variants={fadeUp} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-neutral-900">
            {greeting}, {user.name.split(' ')[0]} 
          </h1>
          <p className="mt-2 text-body text-neutral-600">
            You're building toward becoming a <span className="font-bold text-brand-600">{user.targetRole || 'Software Engineer'}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-orange-50 border border-orange-200 px-4 py-2">
          <StreakFlame streak={user.streak} size={20} />
          <span className="text-caption font-bold text-orange-700">{user.streak} Day Streak</span>
        </div>
      </motion.div>

      {/* 2. Hero Section: Readiness + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Readiness Ring */}
        <motion.div variants={fadeUp} className="flex flex-col items-center justify-center rounded-3xl bg-white p-8 shadow-card text-center">
          <p className="text-micro font-bold uppercase tracking-widest text-neutral-500 mb-4">Career Readiness</p>
          <div className="relative flex h-48 w-48 items-center justify-center">
            <svg className="absolute inset-0" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#f3f4f6" strokeWidth="6" />
              <motion.circle cx="50" cy="50" r="45" fill="none" stroke="url(#dashGrad)" strokeWidth="6" strokeLinecap="round"
                initial={{ strokeDasharray: '0 283' }} animate={{ strokeDasharray: `${(readiness.overall / 100) * 283} 283` }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} transform="rotate(-90 50 50)" />
              <defs>
                <linearGradient id="dashGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--color-brand-500)" />
                  <stop offset="100%" stopColor="var(--color-accent-fuchsia)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="text-center">
              <span className="font-display text-5xl font-bold text-neutral-900"><CountUp value={readiness.overall} /></span>
              <p className="text-micro font-bold text-brand-600 mt-1">{readiness.label}</p>
            </div>
          </div>
          {aiInsight && (
            <p className="mt-6 text-caption text-neutral-600 italic leading-relaxed max-w-xs">"{aiInsight}"</p>
          )}
        </motion.div>

        {/* Breakdown Bars */}
        <motion.div variants={fadeUp} className="rounded-3xl bg-white p-8 shadow-card lg:col-span-2">
          <h3 className="text-title font-semibold mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-brand-500" /> Readiness Breakdown
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            <BreakdownBar label="Resume Strength" value={readiness.breakdown.resume} onClick={() => navigate('/resume')} />
            <BreakdownBar label="Interview Performance" value={readiness.breakdown.interview} onClick={() => navigate('/interview')} />
            <BreakdownBar label="Technical Skills" value={readiness.breakdown.technicalSkills} onClick={() => navigate('/skills')} />
            <BreakdownBar label="Communication" value={readiness.breakdown.communication} onClick={() => navigate('/interview')} />
            <BreakdownBar label="Coding Consistency" value={readiness.breakdown.coding} onClick={() => navigate('/coding')} />
            <BreakdownBar label="Project Quality" value={readiness.breakdown.projects} onClick={() => navigate('/')} />
          </div>
        </motion.div>
      </div>

      {/* 3. Today's AI Career Plan */}
      {dailyPlan.length > 0 && (
        <motion.div variants={fadeUp} className="rounded-3xl bg-gradient-to-br from-neutral-950 to-neutral-900 p-8 shadow-glow text-white">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-title font-semibold flex items-center gap-2">
              <Zap size={20} className="text-brand-400" /> Today's Career Plan
            </h3>
            <span className="text-micro font-bold uppercase tracking-wider text-neutral-400">AI Generated</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dailyPlan.map((item, i) => (
              <button key={i} onClick={() => navigate(item.module || '/')}
                className="group flex flex-col items-start gap-2 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5 text-left hover:border-brand-500/50 hover:bg-neutral-800 transition-all">
                <div className="flex items-center gap-2 text-brand-400">
                  <span className="font-mono text-micro font-bold">0{i + 1}</span>
                  <span className="text-micro font-semibold uppercase tracking-wider">{item.time}</span>
                </div>
                <p className="text-body font-semibold text-white group-hover:text-brand-300 transition-colors">{item.task}</p>
                <p className="text-caption text-neutral-400">{item.focus}</p>
                <ChevronRight size={16} className="mt-auto text-neutral-600 group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* 4. Quick Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={FileText} label="Latest ATS Score" value={resume?.score || 0} suffix="/100" color="text-brand-500" onClick={() => navigate('/resume')} isEmpty={!resume} />
        <MetricCard icon={Mic} label="Interview Score" value={interview?.score || 0} suffix="/100" color="text-accent-fuchsia" onClick={() => navigate('/interview')} isEmpty={!interview} />
        <MetricCard icon={Target} label="Skills Matched" value={resume?.skills?.length || 0} color="text-emerald-500" onClick={() => navigate('/skills')} isEmpty={!resume} />
        <MetricCard icon={Code} label="Problems Solved" value={data.coding?.solved || 0} color="text-accent-violet" onClick={() => navigate('/coding')} isEmpty={data.coding?.solved === 0} />
      </div>

      {/* 5. Empty State Prompt (If no data at all) */}
      {!readiness.hasData && (
        <motion.div variants={fadeUp} className="rounded-3xl border-2 border-dashed border-brand-200 bg-gradient-brand-soft p-10 text-center">
          <Sparkles size={32} className="mx-auto text-brand-500 mb-4" />
          <h2 className="text-title-lg font-semibold text-brand-900">Your career journey starts here.</h2>
          <p className="mt-2 text-body text-brand-700 max-w-md mx-auto">
            Upload your resume to discover your ATS score, extract your skills, and get your first personalized AI career plan.
          </p>
          <button onClick={() => navigate('/resume')} className="press mt-6 rounded-xl bg-gradient-brand px-6 py-3 text-body font-semibold text-white shadow-glow">
            Analyze Resume
          </button>
        </motion.div>
      )}

    </motion.div>
  );
}

function MetricCard({ icon: Icon, label, value, suffix = '', color, onClick, isEmpty }) {
  return (
    <motion.button whileHover={{ y: -2 }} onClick={onClick}
      className="flex flex-col items-start gap-3 rounded-2xl bg-white p-6 shadow-card text-left w-full">
      <div className="flex items-center justify-between w-full">
        <Icon size={20} className={color} />
        {isEmpty && <span className="text-micro font-bold uppercase tracking-wider text-neutral-400">No Data</span>}
      </div>
      <div>
        <p className="font-display text-3xl font-bold text-neutral-900">
          {isEmpty ? '-' : <><CountUp value={value} />{suffix}</>}
        </p>
        <p className="text-micro font-semibold uppercase tracking-wider text-neutral-500 mt-1">{label}</p>
      </div>
    </motion.button>
  );
}