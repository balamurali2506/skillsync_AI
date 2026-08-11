import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Mail, Lock, User, ArrowRight, Loader2, GraduationCap, Briefcase, Calendar, Code2 } from 'lucide-react';
import Logo from '@/components/Logo';
import Button from '@/components/ui/Button';

const TARGET_ROLES = [
  'Software Engineer', 'Data Scientist', 'Product Manager', 'Designer', 'DevOps', 'Other',
];
const EXP_LEVELS = ['Fresher', 'Intern', '1-2 years', '3-5 years', '5+ years'];
const GRAD_YEARS = Array.from({ length: 12 }, (_, i) => 2024 + i); // 2024 → 2035

function Field({ icon: Icon, label, children, required }) {
  return (
    <label className="block">
      <span className="text-micro font-semibold uppercase tracking-wider text-neutral-500">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      <div className="relative mt-1.5">
        {Icon && <Icon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />}
        {children}
      </div>
    </label>
  );
}

const inputCls = 'w-full rounded-xl border border-neutral-700 bg-neutral-950 py-3 text-body text-white placeholder:text-neutral-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25';

// 👇 CHANGE 1: Accept onLogin prop
export default function Auth({ onLogin }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const isRegister = mode === 'register';

  // Core auth
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Profile fields (register only)
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [university, setUniversity] = useState('');
  const [graduationYear, setGraduationYear] = useState(2026);
  const [experienceLevel, setExperienceLevel] = useState('Fresher');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister
        ? { name, email, password, targetRole, university, graduationYear: Number(graduationYear), experienceLevel }
        : { email, password };

      const { data } = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw { response: { data: json, status: r.status } };
        return { data: json };
      });

      localStorage.setItem('ss_token', data.token);
      localStorage.setItem('ss_user', JSON.stringify(data.user));
      
      // 👇 CHANGE 2: Trigger the global state update in App.jsx
      onLogin(data.token, data.user); 
      
      toast.success(isRegister ? 'Account created — welcome to SKILLSYNC_AI!' : 'Welcome back!');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error
                || err.response?.data?.errors?.[0]?.msg
                || 'Something went wrong';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-950 px-6 py-12">
      {/* Animated gradient mesh */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl"
          animate={{ x: [0, 60, 0], y: [0, 40, 0] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute -right-32 top-1/3 h-[28rem] w-[28rem] rounded-full bg-accent-fuchsia/20 blur-3xl"
          animate={{ x: [0, -50, 0], y: [0, 60, 0] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-accent-violet/25 blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, -40, 0] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }} />
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
      </div>

      <motion.div
        key={mode}
        initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`relative w-full rounded-3xl border border-neutral-800 bg-neutral-900/70 p-8 shadow-glow backdrop-blur-xl ${isRegister ? 'max-w-2xl' : 'max-w-md'}`}
      >
        <div className="flex flex-col items-center text-center">
          <Logo size="md" glow theme="dark" />
          <p className="mt-3 font-mono text-micro uppercase tracking-widest text-neutral-500">
            {isRegister ? 'Initialize new operative' : 'Access terminal'}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 rounded-xl bg-neutral-950 p-1">
          {['login', 'register'].map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`relative rounded-lg py-2 text-caption font-semibold capitalize transition-colors ${mode === m ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}>
              {mode === m && (
                <motion.div layoutId="auth-tab" className="absolute inset-0 rounded-lg border border-brand-500/30 bg-gradient-brand-soft"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
              )}
              <span className="relative">{m}</span>
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {/* ── Core auth fields ── */}
          <div className={isRegister ? 'grid grid-cols-1 gap-4 sm:grid-cols-2' : 'space-y-4'}>
            {isRegister && (
              <Field icon={User} label="Full Name" required>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" required
                  className={`${inputCls} pl-10 pr-4`} />
              </Field>
            )}
            <Field icon={Mail} label="Email" required>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@uni.edu" required
                className={`${inputCls} pl-10 pr-4`} />
            </Field>
            <Field icon={Lock} label="Password" required>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required
                className={`${inputCls} pl-10 pr-4`} />
            </Field>
          </div>

          {/* ── Profile fields (register only) ── */}
          {isRegister && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950/50 p-5"
            >
              <p className="text-micro font-semibold uppercase tracking-widest text-brand-400">
                Profile · powers your AI personalization
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field icon={Briefcase} label="Target Role" required>
                  <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)} required
                    className={`${inputCls} pl-10 pr-4 appearance-none`}>
                    {TARGET_ROLES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </Field>

                <Field icon={GraduationCap} label="University">
                  <input type="text" value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="e.g. MIT, IIT Delhi"
                    className={`${inputCls} pl-10 pr-4`} />
                </Field>

                <Field icon={Calendar} label="Graduation Year">
                  <select value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)}
                    className={`${inputCls} pl-10 pr-4 appearance-none`}>
                    {GRAD_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </Field>

                <Field icon={Code2} label="Experience Level" required>
                  <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} required
                    className={`${inputCls} pl-10 pr-4 appearance-none`}>
                    {EXP_LEVELS.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </Field>
              </div>
            </motion.div>
          )}

          <Button type="submit" size="lg" disabled={loading} className="w-full uppercase">
            {loading ? <Loader2 className="animate-spin" size={16} /> : isRegister ? 'Create account' : 'Log in'}
            {!loading && <ArrowRight size={16} />}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}