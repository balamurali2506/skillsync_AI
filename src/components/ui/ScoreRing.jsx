import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'framer-motion';
import CountUp from './CountUp';

export default function ScoreRing({ value, size = 160, strokeWidth = 12, label }) {
  const shouldReduce = useReducedMotion();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useMotionValue(0);
  const dashOffset = useTransform(progress, (v) => circumference * (1 - v / 100));
  // Interpolate stroke color along the score gradient as it fills
  const stroke = useTransform(
    progress,
    [0, 45, 75, 100],
    ['#e11d48', '#f59e0b', '#34d399', '#a3e635'],
  );

  useEffect(() => {
    if (shouldReduce) { progress.set(value); return; }
    const controls = animate(progress, value, { duration: 1.2, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [value, shouldReduce, progress]);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} className="stroke-neutral-200" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={circumference}
          style={{ strokeDashoffset: dashOffset, stroke }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <CountUp value={value} duration={1.2} className="font-display text-display-lg font-bold" />
        {label && <span className="text-caption text-neutral-500">{label}</span>}
      </div>
    </div>
  );
}