import { useEffect, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

export default function CountUp({ value, duration = 0.8, decimals = 0, prefix = '', suffix = '', className }) {
  const shouldReduce = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (shouldReduce) { setDisplay(value); return; }
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1], // ease-out expo
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value, duration, shouldReduce]);

  return (
    <span className={className}>
      {prefix}{display.toFixed(decimals)}{suffix}
    </span>
  );
}