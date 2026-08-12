import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Target, CheckCircle2, XCircle, AlertTriangle, Sparkles, Loader2, TrendingUp, BookOpen, ChevronRight } from 'lucide-react';
import CountUp from '@/components/ui/CountUp';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';

const priorityColors = {
  CRITICAL: 'bg-rose-50 border-rose-200 text-rose-700',
  HIGH: 'bg-orange-50 border-orange-200 text-orange-700',
  MEDIUM: 'bg-amber-50 border-amber-200 text-amber-700',
  LOW: 'bg-emerald-50 border-emerald-200 text-emerald-700'
};

const levelLabels = ['Not Demonstrated', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];

function SkillBar({ skill, onClick }) {
  const matchPct = skill.matchPercentage || 0;
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-neutral-200 bg-white p-4 shadow-soft hover:border-brand-300 hover:shadow-card transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <h4 className="text-body font-bold text-neutral-900">{skill.skill}</h4>
          <p className="text-micro text-neutral-500">{skill.category}</p>
        </div>
        <span className={cn('rounded-full border px-2.5 py-0.5 text-micro font-bold uppercase', priorityColors[skill.priority])}>
          {skill.priority}
        </span>
      </div>
      
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1 h-2 rounded-full bg-neutral-100 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${matchPct}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={cn('h-full rounded-full', matchPct >= 75 ? 'bg-gradient-score-high' : matchPct >= 45 ? 'bg-gradient-score-mid' : 'bg-gradient-score-low')}
          />
        </div>
        <span className="font-mono text-caption font-bold text-neutral-700">{matchPct}%</span>
      </div>
      
      <div className="flex items-center justify-between text-micro text-neutral-600">
        <span>Current: <span className="font-bold">{levelLabels[skill.currentLevel]}</span></span>
        <span>Target: <span className="font-bold">{levelLabels[skill.targetLevel]}</span></span>
      </div>
      
      {skill.evidence?.length > 0 && (
        <p className="mt-2 text-caption text-neutral-500 italic">
          {skill.evidence[0]}
        </p>
      )}
    </motion.button>
  );
}

export default function SkillGap() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [jobDesc, setJobDesc] = useState('');
  const [jobMatch, setJobMatch] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    api.get('/skills/gap')
      .then(({ data }) => setData(data))
      .catch(() => setData(null));
  }, []);

  const analyzeJob = async () => {
    if (!jobDesc.trim()) return;
    setAnalyzing(true);
    try {
      const { data } = await api.post('/skills/job-match', { jobDescription: jobDesc });
      setJobMatch(data);
    } catch {
      setJobMatch(null);
    } finally {
      setAnalyzing(false);
    }
  };

  if (!data) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-brand-500" size={32} /></div>;

  const { skills = [], topGaps = [], roadmap = [], overallMatch = 0, aiInsight, targetRole, hasResume } = data;

  const matched = skills.filter(s => s.matchPercentage >= 70);
  const missing = skills.filter(s => s.matchPercentage === 0);
  const weak = skills.filter(s => s.matchPercentage > 0 && s.matchPercentage < 70);

  const filteredSkills = tab === 'matched' ? matched : tab === 'missing' ? missing : tab === 'weak' ? weak : skills;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header>
        <h1 className="font-display text-2xl sm:text-display-xl font-bold uppercase">AI Skill Gap Analyzer</h1>
        <p className="mt-2 text-sm sm:text-body text-neutral-500">
          Intelligent analysis for <span className="font-bold text-brand-600">{targetRole}</span> career path
        </p>
      </header>

      {!hasResume ? (
        <div className="rounded-3xl border-2 border-dashed border-amber-200 bg-amber-50 p-10 text-center">
          <Target size={40} className="mx-auto text-amber-500 mb-4" />
          <h2 className="text-title-lg font-semibold text-amber-800">No Resume Data</h2>
          <p className="mt-2 text-body text-amber-700 max-w-md mx-auto">
            Upload and analyze your resume to discover your skill gaps and get personalized learning recommendations.
          </p>
          <button onClick={() => navigate('/resume')} className="press mt-6 rounded-xl bg-gradient-brand px-6 py-3 text-body font-semibold text-white shadow-glow">
            Analyze Resume
          </button>
        </div>
      ) : (
        <>
          {/* Hero Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center rounded-3xl bg-white p-8 shadow-card text-center">
              <p className="text-micro font-bold uppercase tracking-widest text-neutral-500 mb-4">Overall Skill Match</p>
              <div className="relative flex h-40 w-40 items-center justify-center">
                <svg className="absolute inset-0" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#f3f4f6" strokeWidth="6" />
                  <motion.circle cx="50" cy="50" r="45" fill="none" stroke="url(#skillGrad)" strokeWidth="6" strokeLinecap="round"
                    initial={{ strokeDasharray: '0 283' }} animate={{ strokeDasharray: `${(overallMatch / 100) * 283} 283` }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} transform="rotate(-90 50 50)" />
                  <defs>
                    <linearGradient id="skillGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--color-brand-500)" />
                      <stop offset="100%" stopColor="var(--color-accent-fuchsia)" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="font-display text-4xl font-bold">{overallMatch}%</span>
              </div>
              {aiInsight && <p className="mt-4 text-caption text-neutral-600 italic max-w-xs">"{aiInsight}"</p>}
            </motion.div>

            <div className="lg:col-span-2 rounded-3xl bg-white p-6 shadow-card space-y-4">
              <h3 className="text-title font-semibold flex items-center gap-2">
                <TrendingUp size={20} className="text-brand-500" /> Skill Overview
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center">
                  <CheckCircle2 size={24} className="mx-auto text-emerald-600 mb-2" />
                  <p className="font-display text-2xl font-bold text-emerald-700">{matched.length}</p>
                  <p className="text-micro font-bold uppercase tracking-wider text-emerald-600">Matched</p>
                </div>
                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-center">
                  <AlertTriangle size={24} className="mx-auto text-amber-600 mb-2" />
                  <p className="font-display text-2xl font-bold text-amber-700">{weak.length}</p>
                  <p className="text-micro font-bold uppercase tracking-wider text-amber-600">Weak</p>
                </div>
                <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-center">
                  <XCircle size={24} className="mx-auto text-rose-600 mb-2" />
                  <p className="font-display text-2xl font-bold text-rose-700">{missing.length}</p>
                  <p className="text-micro font-bold uppercase tracking-wider text-rose-600">Missing</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Gaps */}
          {topGaps.length > 0 && (
            <div className="rounded-3xl bg-gradient-to-br from-neutral-950 to-neutral-900 p-8 shadow-glow text-white">
              <h3 className="text-title font-semibold mb-6 flex items-center gap-2">
                <Sparkles size={20} className="text-brand-400" /> Top Skill Gaps
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topGaps.slice(0, 6).map((gap, i) => (
                  <motion.div key={gap.skill} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-body font-bold">{gap.skill}</h4>
                      <span className="text-micro font-mono text-brand-400">
                        {levelLabels[gap.currentLevel]} → {levelLabels[gap.targetLevel]}
                      </span>
                    </div>
                    <p className="text-caption text-neutral-400 mb-3">{gap.reason}</p>
                    <p className="text-caption text-brand-300 font-semibold">{gap.action}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="rounded-3xl bg-white p-6 shadow-card">
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {[
                { id: 'all', label: 'All Skills', count: skills.length },
                { id: 'matched', label: 'Matched', count: matched.length },
                { id: 'weak', label: 'Weak', count: weak.length },
                { id: 'missing', label: 'Missing', count: missing.length }
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={cn('px-4 py-2 rounded-xl text-caption font-bold uppercase tracking-wider whitespace-nowrap transition-colors',
                    tab === t.id ? 'bg-gradient-brand text-white shadow-glow' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200')}>
                  {t.label} ({t.count})
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSkills.slice(0, 12).map((skill, i) => (
                <SkillBar key={skill.skill} skill={skill} onClick={() => navigate('/courses')} />
              ))}
            </div>
            {filteredSkills.length > 12 && (
              <p className="text-center text-caption text-neutral-500 mt-4">
                Showing 12 of {filteredSkills.length} skills
              </p>
            )}
          </div>

          {/* Learning Roadmap */}
          {roadmap.length > 0 && (
            <div className="rounded-3xl bg-white p-6 shadow-card">
              <h3 className="text-title font-semibold mb-6 flex items-center gap-2">
                <BookOpen size={20} className="text-accent-violet" /> Learning Roadmap
              </h3>
              <div className="space-y-4">
                {roadmap.map((phase, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    className="relative pl-8 pb-6 border-l-2 border-brand-200 last:border-l-0 last:pb-0">
                    <div className="absolute left-0 top-0 -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-brand flex items-center justify-center text-white text-micro font-bold">
                      {i + 1}
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-body font-bold text-neutral-900">{phase.title}</h4>
                        <span className="text-micro font-bold text-brand-600">{phase.duration}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {phase.skills.map(s => (
                          <span key={s} className="rounded-full bg-brand-50 border border-brand-200 px-3 py-1 text-micro font-semibold text-brand-700">{s}</span>
                        ))}
                      </div>
                      {phase.prerequisites?.length > 0 && (
                        <p className="text-caption text-neutral-500">
                          Prerequisites: {phase.prerequisites.join(', ')}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Job Match Analysis */}
          <div className="rounded-3xl bg-white p-6 shadow-card">
            <h3 className="text-title font-semibold mb-4">Analyze Job Description</h3>
            <p className="text-caption text-neutral-500 mb-4">Paste a job description to see how well your skills match.</p>
            <textarea
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              placeholder="Paste job description here..."
              rows={4}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-body focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 mb-4"
            />
            <button onClick={analyzeJob} disabled={analyzing || !jobDesc.trim()}
              className="press rounded-xl bg-gradient-brand px-6 py-2.5 text-body font-semibold text-white shadow-glow disabled:opacity-50">
              {analyzing ? 'Analyzing...' : 'Analyze Match'}
            </button>

            {jobMatch && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
                <div className="rounded-2xl bg-gradient-brand-soft border border-brand-200 p-6 text-center">
                  <p className="text-micro font-bold uppercase tracking-widest text-brand-700 mb-2">Job Match Score</p>
                  <p className="font-display text-5xl font-bold text-brand-900">{jobMatch.overallMatch}%</p>
                  <p className="mt-2 text-caption text-brand-700">
                    {jobMatch.matchedCount} matched · {jobMatch.missingCount} missing
                  </p>
                </div>

                {jobMatch.requiredSkills?.length > 0 && (
                  <div>
                    <h4 className="text-body font-bold mb-3">Required Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {jobMatch.requiredSkills.map((s, i) => (
                        <span key={i} className={cn('rounded-full border px-3 py-1.5 text-caption font-semibold',
                          s.matched ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700')}>
                          {s.matched ? '✓' : '✕'} {s.skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {jobMatch.criticalMissing?.length > 0 && (
                  <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4">
                    <h4 className="text-body font-bold text-rose-700 mb-2">Critical Missing Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {jobMatch.criticalMissing.map(s => (
                        <span key={s} className="rounded-full bg-white border border-rose-200 px-3 py-1 text-caption font-bold text-rose-700">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {jobMatch.recommendation && (
                  <p className="text-body text-neutral-700 italic">{jobMatch.recommendation}</p>
                )}
              </motion.div>
            )}
          </div>
        </>
      )}
    </div>
  );
}