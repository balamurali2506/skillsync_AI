import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, Mic, Code, BookOpen, Award, Shield, TrendingUp, Loader2, Search, Activity } from 'lucide-react';
import CountUp from '@/components/ui/CountUp';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';

const stagger = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { staggerChildren: 0.06 } },
};
const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

export default function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState({ users: [], pagination: {} });
  const [resumeAnalytics, setResumeAnalytics] = useState(null);
  const [interviewAnalytics, setInterviewAnalytics] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard'),
      api.get(`/admin/users?page=${page}&search=${search}`),
      api.get('/admin/resumes'),
      api.get('/admin/interviews')
    ])
      .then(([ov, us, res, int]) => {
        setOverview(ov.data);
        setUsers(us.data);
        setResumeAnalytics(res.data);
        setInterviewAnalytics(int.data);
      })
      .catch(err => console.error('Admin fetch failed', err))
      .finally(() => setLoading(false));
  }, [page, search]);

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-brand-500" size={32} /></div>;

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="mx-auto max-w-7xl space-y-8">
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <Shield className="text-brand-500" size={32} />
        <div>
          <h1 className="font-display text-2xl sm:text-display-xl font-bold uppercase">Admin Control Center</h1>
          <p className="text-sm text-neutral-500">Platform-wide metrics and user management</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp} className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'users', label: 'Users' },
          { id: 'resumes', label: 'Resumes' },
          { id: 'interviews', label: 'Interviews' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('px-4 py-2 rounded-xl text-caption font-bold uppercase tracking-wider whitespace-nowrap transition-colors',
              tab === t.id ? 'bg-gradient-brand text-white shadow-glow' : 'bg-white text-neutral-600 hover:bg-neutral-100 shadow-soft')}>
            {t.label}
          </button>
        ))}
      </motion.div>

      {/* Overview Tab */}
      {tab === 'overview' && overview && (
        <motion.div variants={fadeUp} className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { icon: Users, label: 'Total Users', value: overview.totalUsers, color: 'text-brand-500' },
              { icon: Activity, label: 'Active (7d)', value: overview.activeUsers, color: 'text-emerald-500' },
              { icon: FileText, label: 'Resumes', value: overview.totalResumes, color: 'text-accent-violet' },
              { icon: Mic, label: 'Interviews', value: overview.totalInterviews, color: 'text-accent-fuchsia' },
              { icon: Code, label: 'Problems', value: overview.totalProblems, color: 'text-orange-500' },
              { icon: BookOpen, label: 'Courses Done', value: overview.totalCourses, color: 'text-blue-500' },
              { icon: Award, label: 'Avg Readiness', value: overview.avgReadiness, suffix: '%', color: 'text-emerald-600' },
              { icon: TrendingUp, label: 'Avg ATS', value: overview.avgResumeScore, suffix: '%', color: 'text-brand-600' },
            ].map((s) => (
              <motion.div key={s.label} whileHover={{ y: -2 }} className="rounded-2xl bg-white p-5 shadow-card">
                <s.icon size={20} className={s.color} />
                <p className="mt-2 font-display text-2xl font-bold">
                  <CountUp value={s.value} />{s.suffix || ''}
                </p>
                <p className="text-micro font-semibold uppercase tracking-wider text-neutral-500">{s.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-card">
            <h3 className="text-title font-semibold mb-4">System Health</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Object.entries(overview.systemHealth || {}).map(([service, status]) => (
                <div key={service} className="flex items-center justify-between rounded-2xl bg-neutral-50 p-4">
                  <span className="text-body font-semibold capitalize">{service}</span>
                  <span className={cn('rounded-full px-3 py-1 text-micro font-bold uppercase',
                    status === 'Healthy' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <motion.div variants={fadeUp} className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search users by name, email, or role..."
                className="w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 py-2.5 text-body focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div className="rounded-3xl bg-white shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-micro font-bold uppercase tracking-wider text-neutral-500">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Target</th>
                    <th className="px-6 py-4">ATS</th>
                    <th className="px-6 py-4">Interview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {users.users.map((u) => (
                    <tr key={u._id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-neutral-900">{u.name}</td>
                      <td className="px-6 py-4 text-neutral-600">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={cn('rounded-full px-2.5 py-1 text-micro font-bold uppercase',
                          u.role === 'admin' ? 'bg-brand-100 text-brand-700' : 'bg-neutral-100 text-neutral-600')}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-neutral-600">{u.targetRole || '-'}</td>
                      <td className="px-6 py-4">
                        {u.resumeScore ? (
                          <span className="font-mono font-bold">{u.resumeScore}</span>
                        ) : <span className="text-neutral-400">-</span>}
                      </td>
                      <td className="px-6 py-4">
                        {u.interviewScore ? (
                          <span className="font-mono font-bold">{u.interviewScore}</span>
                        ) : <span className="text-neutral-400">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.pagination.pages > 1 && (
              <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4">
                <p className="text-caption text-neutral-500">
                  Page {users.pagination.page} of {users.pagination.pages} · {users.pagination.total} users
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="press rounded-lg bg-neutral-100 px-4 py-2 text-caption font-bold text-neutral-700 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(Math.min(users.pagination.pages, page + 1))}
                    disabled={page === users.pagination.pages}
                    className="press rounded-lg bg-neutral-100 px-4 py-2 text-caption font-bold text-neutral-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Resumes Tab */}
      {tab === 'resumes' && resumeAnalytics && (
        <motion.div variants={fadeUp} className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-2xl bg-white p-5 shadow-card">
              <p className="text-micro font-bold uppercase tracking-wider text-neutral-500">Total</p>
              <p className="mt-2 font-display text-2xl font-bold">{resumeAnalytics.totalResumes}</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-card">
              <p className="text-micro font-bold uppercase tracking-wider text-neutral-500">Avg Score</p>
              <p className="mt-2 font-display text-2xl font-bold">{resumeAnalytics.avgScore}%</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-card">
              <p className="text-micro font-bold uppercase tracking-wider text-neutral-500">Highest</p>
              <p className="mt-2 font-display text-2xl font-bold text-emerald-600">{resumeAnalytics.maxScore}%</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-card">
              <p className="text-micro font-bold uppercase tracking-wider text-neutral-500">Lowest</p>
              <p className="mt-2 font-display text-2xl font-bold text-rose-600">{resumeAnalytics.minScore}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-3xl bg-white p-6 shadow-card">
              <h3 className="text-title font-semibold mb-4">Score Distribution</h3>
              <div className="space-y-3">
                {[
                  { label: 'Excellent (85+)', count: resumeAnalytics.scoreDistribution.excellent, color: 'bg-emerald-500' },
                  { label: 'Good (70-84)', count: resumeAnalytics.scoreDistribution.good, color: 'bg-brand-500' },
                  { label: 'Average (50-69)', count: resumeAnalytics.scoreDistribution.average, color: 'bg-amber-500' },
                  { label: 'Needs Work (<50)', count: resumeAnalytics.scoreDistribution.needsWork, color: 'bg-rose-500' },
                ].map(d => (
                  <div key={d.label}>
                    <div className="flex justify-between text-caption font-medium mb-1">
                      <span className="text-neutral-700">{d.label}</span>
                      <span className="font-mono text-neutral-900">{d.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(d.count / resumeAnalytics.totalResumes) * 100}%` }}
                        className={cn('h-full rounded-full', d.color)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-card">
              <h3 className="text-title font-semibold mb-4">Top Skills Found</h3>
              <div className="space-y-2">
                {resumeAnalytics.topSkills.slice(0, 8).map((s, i) => (
                  <div key={s.skill} className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-2">
                    <span className="text-body font-semibold text-neutral-800">{s.skill}</span>
                    <span className="rounded-full bg-brand-100 px-3 py-1 text-micro font-bold text-brand-700">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Interviews Tab */}
      {tab === 'interviews' && interviewAnalytics && (
        <motion.div variants={fadeUp} className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 shadow-card">
              <p className="text-micro font-bold uppercase tracking-wider text-neutral-500">Total Interviews</p>
              <p className="mt-2 font-display text-2xl font-bold">{interviewAnalytics.totalInterviews}</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-card">
              <p className="text-micro font-bold uppercase tracking-wider text-neutral-500">Avg Score</p>
              <p className="mt-2 font-display text-2xl font-bold">{interviewAnalytics.avgScore}%</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-card">
              <p className="text-micro font-bold uppercase tracking-wider text-neutral-500">Completion Rate</p>
              <p className="mt-2 font-display text-2xl font-bold">
                {interviewAnalytics.totalInterviews > 0 ? Math.round((interviewAnalytics.scoreDistribution.excellent + interviewAnalytics.scoreDistribution.good) / interviewAnalytics.totalInterviews * 100) : 0}%
              </p>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-card">
            <h3 className="text-title font-semibold mb-4">Category Performance</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(interviewAnalytics.categoryAverages || {}).map(([cat, score]) => (
                <div key={cat}>
                  <div className="flex justify-between text-caption font-medium mb-1.5">
                    <span className="text-neutral-700 capitalize">{cat}</span>
                    <span className="font-mono text-neutral-900">{score}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      className={cn('h-full rounded-full', score >= 75 ? 'bg-gradient-score-high' : score >= 45 ? 'bg-gradient-score-mid' : 'bg-gradient-score-low')}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}