import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import ScoreRing from '@/components/ui/ScoreRing';
import { staggerContainer, staggerItem } from '@/lib/motion';
import { cn } from '@/lib/cn';

const MATCHED = ['React', 'JavaScript', 'Git', 'REST APIs', 'SQL', 'Python'];
const MISSING = ['System Design', 'Docker', 'GraphQL', 'AWS'];

function SkillGroup({ title, skills, variant }) {
  const isMatched = variant === 'matched';
  return (
    <div className="rounded-2xl bg-white p-6 shadow-card">
      <h3 className="text-title font-semibold">{title}</h3>
      <motion.div variants={staggerContainer(0.03)} initial="initial" animate="animate" className="mt-4 flex flex-wrap gap-2">
        {skills.map((skill) => (
          <motion.span key={skill} variants={staggerItem}
            className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-caption font-semibold',
              isMatched ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700')}>
            {isMatched ? <Check size={14} /> : <X size={14} />}
            {skill}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}

export default function SkillGap() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header>
        <h1 className="font-display text-display-xl font-bold uppercase">Skill Gap Analysis</h1>
        <p className="mt-2 text-body text-neutral-500">How your skills match your target role.</p>
      </header>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-8 shadow-card">
          <ScoreRing value={68} size={190} label="Readiness" />
        </div>
        <div className="space-y-6 lg:col-span-2">
          <SkillGroup title="Matched Skills" skills={MATCHED} variant="matched" />
          <SkillGroup title="Missing Skills" skills={MISSING} variant="missing" />
        </div>
      </div>
    </div>
  );
}