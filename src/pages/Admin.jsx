import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';

const INITIAL = [
  { id: 1, name: 'Aarav Sharma', email: 'aarav@uni.edu', role: 'Student', status: 'Active' },
  { id: 2, name: 'Priya Patel', email: 'priya@uni.edu', role: 'Student', status: 'Active' },
  { id: 3, name: 'Rohan Mehta', email: 'rohan@uni.edu', role: 'Student', status: 'Inactive' },
  { id: 4, name: 'Sneha Iyer', email: 'sneha@uni.edu', role: 'Admin', status: 'Active' },
];

export default function Admin() {
  const [users, setUsers] = useState(INITIAL);
  const removeUser = (id) => setUsers((u) => u.filter((x) => x.id !== id));

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <h1 className="font-display text-display-xl font-bold uppercase">Admin Dashboard</h1>
        <p className="mt-2 text-body text-neutral-500">Manage users. Remove one to see the collapse animation.</p>
      </header>
      <div className="overflow-x-auto rounded-2xl bg-white shadow-card">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[2fr_2fr_1fr_1fr_auto] gap-4 border-b bg-neutral-50 px-6 py-3 text-micro font-semibold uppercase tracking-wider text-neutral-500">
            <span>Name</span><span>Email</span><span>Role</span><span>Status</span><span />
          </div>
          <AnimatePresence initial>
            {users.map((user, i) => (
              <motion.div key={user.id} layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto', transition: { opacity: { delay: i * 0.05 } } }}
                exit={{ opacity: 0, height: 0, transition: { duration: 0.25 } }}
                className="overflow-hidden">
                <div className="grid grid-cols-[2fr_2fr_1fr_1fr_auto] items-center gap-4 border-b border-neutral-100 px-6 py-4">
                  <span className="text-body font-semibold">{user.name}</span>
                  <span className="font-mono text-caption text-neutral-500">{user.email}</span>
                  <span className="text-caption">{user.role}</span>
                  <span className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-micro font-bold ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}>{user.status}</span>
                  <button onClick={() => removeUser(user.id)} className="text-neutral-400 transition-colors hover:text-rose-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}