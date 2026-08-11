import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, RotateCcw, Mic } from 'lucide-react';
import CountUp from '@/components/ui/CountUp';
import SentimentBadge from '@/components/ui/SentimentBadge';

const QUESTIONS = [
  { id: 1, text: 'Tell me about yourself and your background.' },
  { id: 2, text: 'Describe a challenging project and how you overcame obstacles.' },
  { id: 3, text: 'Why are you interested in this role?' },
];

const variants = {
  enter: (dir) => ({ opacity: 0, x: dir * 60, rotateY: dir * 12 }),
  center: { opacity: 1, x: 0, rotateY: 0 },
  exit: (dir) => ({ opacity: 0, x: dir * -60, rotateY: dir * -12 }),
};

export default function InterviewCoach() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [showFeedback, setShowFeedback] = useState(false);

  const next = () => { setDirection(1); setShowFeedback(false); setIndex((i) => (i + 1) % QUESTIONS.length); };
  const q = QUESTIONS[index];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="font-display text-display-xl font-bold uppercase">AI Interview Coach</h1>
        <p className="mt-2 text-body text-neutral-500">Practice common questions and get instant AI feedback.</p>
      </header>

      {/* Question card with slide-flip transition */}
      <div style={{ perspective: 1200 }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={q.id}
            custom={direction}
            variants={variants}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-3xl bg-white p-8 shadow-card"
          >
            <span className="font-mono text-micro text-neutral-400">Question {index + 1} / {QUESTIONS.length}</span>
            <p className="mt-3 text-title-lg font-semibold">{q.text}</p>
            <div className="mt-6 flex items-center gap-3">
              <button onClick={() => setShowFeedback(true)} className="flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-2.5 text-body font-semibold text-white shadow-glow transition-transform active:scale-95">
                <Mic size={16} /> Submit answer
              </button>
              <button onClick={next} className="flex items-center gap-1 rounded-xl border bg-white px-4 py-2.5 text-body font-semibold text-neutral-700 shadow-soft transition-transform active:scale-95">
                Skip <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Feedback reveal — slides up from below after score counts up */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-3xl bg-white p-8 shadow-card"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-micro font-semibold uppercase tracking-wider text-neutral-500">Delivery Score</span>
                <p className="font-display text-display-lg font-bold"><CountUp value={82} /></p>
              </div>
              <div className="flex gap-2">
                <SentimentBadge sentiment="positive" />
                <SentimentBadge sentiment="neutral" />
              </div>
            </div>
            <p className="mt-4 text-body text-neutral-600">
              Strong structure and clear confidence. Try adding one quantified result to strengthen your impact.
            </p>
            <button onClick={next} className="mt-4 flex items-center gap-1 text-caption font-semibold text-brand-600 hover:underline">
              <RotateCcw size={14} /> Next question
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}