import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { BookOpen, Clock, Star } from 'lucide-react';
import { staggerContainer, staggerItem } from '@/lib/motion';

const COURSES = [
  { id: 1, title: 'System Design Fundamentals', provider: 'Coursera', hours: 18, rating: 4.8, match: 95 },
  { id: 2, title: 'Docker & Kubernetes Essentials', provider: 'Udemy', hours: 12, rating: 4.6, match: 88 },
  { id: 3, title: 'GraphQL in Practice', provider: 'Frontend Masters', hours: 9, rating: 4.7, match: 82 },
  { id: 4, title: 'AWS Cloud Practitioner', provider: 'AWS Skill Builder', hours: 15, rating: 4.5, match: 79 },
];

export default function CourseRecs() {
  // Hook is safely inside the component body here
  useEffect(() => {
    if (!sessionStorage.getItem('course_toast')) {
      toast.info('Your course recommendations are ready');
      sessionStorage.setItem('course_toast', '1');
    }
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header>
        <h1 className="font-display text-display-xl font-bold uppercase">Course Recommendations</h1>
        <p className="mt-2 text-body text-neutral-500">Personalized picks to close your skill gaps.</p>
      </header>
      <motion.div variants={staggerContainer(0.06)} initial="initial" animate="animate" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {COURSES.map((c) => (
          <motion.div key={c.id} variants={staggerItem} whileHover={{ y: -2 }} className="flex flex-col rounded-2xl bg-white p-6 shadow-card">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand-soft text-brand-600">
              <BookOpen size={22} />
            </div>
            <h3 className="mt-4 text-title font-semibold leading-snug">{c.title}</h3>
            <p className="mt-1 text-caption text-neutral-500">{c.provider}</p>
            <div className="mt-4 flex items-center gap-3 text-caption text-neutral-500">
              <span className="flex items-center gap-1"><Clock size={13} /> {c.hours}h</span>
              <span className="flex items-center gap-1"><Star size={13} className="text-amber-500" /> {c.rating}</span>
            </div>
            <div className="mt-4 rounded-full bg-gradient-score-high px-3 py-1 text-center text-micro font-bold text-white">{c.match}% match</div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}