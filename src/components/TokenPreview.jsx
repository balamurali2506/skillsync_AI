import { motion } from 'framer-motion';
import Logo from '@/components/Logo';

function Swatch({ label, className }) {
  return (
    <div>
      <div className={`h-20 rounded-2xl shadow-card ${className}`} />
      <p className="mt-2 text-caption text-neutral-500">{label}</p>
    </div>
  );
}

function ShadowCard({ label, className }) {
  return (
    <div className={`rounded-2xl bg-white p-5 ${className}`}>
      <p className="text-caption font-medium text-neutral-600">{label}</p>
    </div>
  );
}

export default function TokenPreview() {
  return (
    <main className="min-h-screen px-6 py-14">
      <div className="mx-auto max-w-4xl space-y-12">
        {/* Logo lockup */}
        <header>
          <p className="text-micro font-semibold uppercase tracking-widest text-brand-600">
            Phase 0 · Cyber type check
          </p>
          <div className="mt-3">
            <Logo size="lg" glow />
          </div>
          <p className="mt-3 max-w-md text-body text-neutral-500">
            Orbitron for display, Chakra Petch for body, Share Tech Mono for data.
            If this screen feels like a HUD, Phase 0 is done.
          </p>
        </header>

        {/* Gradient identity + score bands */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Swatch label="Brand gradient" className="bg-gradient-brand" />
          <Swatch label="Score · low" className="bg-gradient-score-low" />
          <Swatch label="Score · mid" className="bg-gradient-score-mid" />
          <Swatch label="Score · high" className="bg-gradient-score-high" />
        </section>

        {/* Type scale */}
        <section className="rounded-3xl bg-white p-8 shadow-card">
          <p className="font-display text-display-lg font-bold uppercase">
            Prep. Practice. Placed.
          </p>
          <p className="mt-1 font-display text-title-lg font-semibold">
            ATS SCORE — 87
          </p>
          <p className="text-title font-semibold">Title — Chakra Petch Semibold</p>
          <p className="mt-3 text-body text-neutral-600">
            Body — Chakra Petch, 15px, 1.6 line height. Angular, tech-cut, still
            comfortable for long-form text.
          </p>
          <p className="mt-2 text-caption text-neutral-400">
            Caption — secondary labels, timestamps.
          </p>
          <p className="mt-2 text-micro font-semibold uppercase tracking-widest text-brand-600">
            Micro overline
          </p>
          <p className="mt-4 font-mono text-title text-brand-600">
            &gt; streak: 14d · problems: 236 · readiness: 82%_
          </p>
        </section>

        {/* Elevation levels */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <ShadowCard label="shadow-soft" className="shadow-soft" />
          <ShadowCard label="shadow-card" className="shadow-card" />
          <ShadowCard label="shadow-lift" className="shadow-lift" />
          <ShadowCard label="shadow-glow" className="shadow-glow" />
        </section>

        {/* Micro-interactions + ambient animations */}
        <section className="flex flex-wrap items-center gap-4">
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            className="rounded-xl bg-gradient-brand px-6 py-3 text-body font-semibold uppercase tracking-wide text-white shadow-glow"
          >
            Initialize
          </motion.button>
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            className="rounded-xl border bg-white px-6 py-3 text-body font-semibold uppercase tracking-wide text-neutral-700 shadow-soft"
          >
            Secondary
          </motion.button>
          <span className="animate-flicker text-2xl" title="streak flame idle loop">🔥</span>
          <span className="skeleton h-10 w-40" title="loading skeleton shimmer" />
        </section>
      </div>
    </main>
  );
}