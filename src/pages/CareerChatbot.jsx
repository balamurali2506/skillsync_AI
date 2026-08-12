import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { Send, Bot } from 'lucide-react';
import { api } from '@/lib/api';

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="h-2 w-2 rounded-full bg-neutral-400"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }} />
      ))}
    </div>
  );
}

export default function CareerChatbot() {
  const shouldReduce = useReducedMotion();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);

  // Load history on mount
  useEffect(() => {
    api.get('/chat/history')
      .then(({ data }) => {
        if (data.messages?.length) setMessages(data.messages);
        else setMessages([{ _id: 'welcome', role: 'assistant', content: "Hi! I'm your career assistant. Ask me about resumes, interviews, or skill building." }]);
      })
      .catch(() => setMessages([{ _id: 'welcome', role: 'assistant', content: "Hi! I'm your career assistant. Ask me about resumes, interviews, or skill building." }]));
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: shouldReduce ? 'auto' : 'smooth' });
  }, [messages, typing, shouldReduce]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || typing) return;
    const userMsg = { _id: `tmp-${Date.now()}`, role: 'user', content: input };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setTyping(true);
    try {
      const { data } = await api.post('/chat', { message: input });
      setMessages((m) => [...m, data]);
    } catch {
      toast.error('The assistant is unreachable right now.');
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col space-y-6" style={{ height: 'calc(100vh - 140px)' }}>
      <header>
        <h1 className="font-display text-2xl sm:text-display-xl font-bold uppercase">Career Chatbot</h1>
        <p className="mt-2 text-sm sm:text-body text-neutral-500">Personalized advice powered by your profile.</p>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto rounded-3xl bg-white p-4 sm:p-6 shadow-card">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div key={m._id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[85%] sm:max-w-[80%] items-start gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {m.role === 'assistant' && <Bot size={20} className="mt-1 shrink-0 text-brand-500" />}
                <div className={`rounded-2xl px-4 py-2.5 text-sm sm:text-body ${m.role === 'user' ? 'bg-gradient-brand text-white' : 'bg-neutral-100 text-neutral-800'}`}>
                  {m.content}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {typing && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
            <div className="rounded-2xl bg-neutral-100"><TypingIndicator /></div>
          </motion.div>
        )}
      </div>

      <form onSubmit={send} className="flex gap-3">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your career path…"
          className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-body shadow-soft focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
        <button type="submit" disabled={typing}
          className="press flex items-center justify-center rounded-xl bg-gradient-brand px-5 text-white shadow-glow disabled:opacity-50">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}