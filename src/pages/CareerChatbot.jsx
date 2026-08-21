import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Trash2, Bot, User, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    api.get('/chat/history')
      .then(({ data }) => setMessages(data.messages || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text?.trim() || loading) return;
    
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSuggestions([]);
    setLoading(true);

    try {
      const { data } = await api.post('/chat', { message: text });
      const aiMsg = { role: 'assistant', content: data.response };
      setMessages(prev => [...prev, aiMsg]);
      setSuggestions(data.suggestions || []);
    } catch (err) {
      const errorData = err.response?.data;
      const status = err.response?.status;
      
      if (status === 429) {
        toast.error('⏳ You are typing too fast! Please wait 30 seconds before asking again.');
      } else {
        toast.error(errorData?.error || 'Failed to send message');
      }
      
      // Remove the failed user message from the UI so they can try again
      setMessages(prev => prev.filter(m => m.content !== text || m.role === 'assistant'));
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!confirm('Clear all chat history?')) return;
    try {
      await api.delete('/chat/history');
      setMessages([]);
      setSuggestions([]);
      toast.success('Chat history cleared');
    } catch {
      toast.error('Failed to clear history');
    }
  };

  return (
    <div className="mx-auto max-w-4xl h-[calc(100vh-8rem)] flex flex-col">
      <header className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase">Career Coach Chat</h1>
          <p className="text-sm text-neutral-500">Ask anything about your career, resume, or interviews</p>
        </div>
        {messages.length > 0 && (
          <button onClick={clearHistory} className="press flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2 text-caption font-bold text-neutral-600 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600">
            <Trash2 size={14} /> Clear
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto rounded-3xl bg-white shadow-card p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot size={48} className="text-brand-500 mb-4" />
            <h2 className="text-title-lg font-semibold text-neutral-900">Hi! I'm your Career Coach</h2>
            <p className="mt-2 text-body text-neutral-500 max-w-md">
              Ask me about resume optimization, interview prep, skill gaps, or career advice.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {['How do I improve my resume?', 'What skills should I learn?', 'Prepare me for interviews'].map(q => (
                <button key={q} onClick={() => sendMessage(q)} className="press rounded-full bg-brand-50 border border-brand-200 px-4 py-2 text-caption font-semibold text-brand-700 hover:bg-brand-100">
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-white">
                  <Bot size={16} />
                </div>
              )}
              <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-brand-500 text-white' : 'bg-neutral-100 text-neutral-900'}`}>
                <p className="text-body whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === 'user' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-neutral-700">
                  <User size={16} />
                </div>
              )}
            </motion.div>
          ))
        )}
        {loading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-white">
              <Bot size={16} />
            </div>
            <div className="rounded-2xl bg-neutral-100 px-4 py-3">
              <Loader2 className="animate-spin text-brand-500" size={20} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {suggestions.length > 0 && !loading && (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => sendMessage(s)} className="press rounded-full bg-neutral-100 border border-neutral-200 px-4 py-2 text-caption font-semibold text-neutral-700 hover:bg-neutral-200">
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
          placeholder="Ask about your career..."
          disabled={loading}
          className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-body focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          className="press flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-brand text-white shadow-glow disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}