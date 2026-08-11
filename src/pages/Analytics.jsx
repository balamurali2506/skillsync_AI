import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const DATA = [
  { company: 'Google', offers: 12 },
  { company: 'Meta', offers: 9 },
  { company: 'Amazon', offers: 15 },
  { company: 'Microsoft', offers: 11 },
  { company: 'Startups', offers: 20 },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl bg-neutral-900 px-4 py-2 shadow-lift">
      <p className="text-caption font-semibold text-white">{label}</p>
      <p className="font-mono text-caption text-brand-300">{payload[0].value} offers</p>
    </motion.div>
  );
}

export default function Analytics() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header>
        <h1 className="font-display text-display-xl font-bold uppercase">Placement Analytics</h1>
        <p className="mt-2 text-body text-neutral-500">Offer distribution across companies this season.</p>
      </header>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="h-96 rounded-2xl bg-white p-6 shadow-card">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={DATA}>
            <XAxis dataKey="company" tick={{ fill: '#7b7868', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#7b7868', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
            <Bar dataKey="offers" radius={[8, 8, 0, 0]} isAnimationActive animationDuration={800} animationEasing="ease-out">
              {DATA.map((_, i) => <Cell key={i} fill={i % 2 ? '#8b5cf6' : '#6366f1'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}