import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Mic, MicOff, PhoneOff, Loader2, ChevronRight, Bot, User, MessageSquare, Volume2, Brain } from 'lucide-react';
import CountUp from '@/components/ui/CountUp';
import { api } from '@/lib/api';
import { speak, stopSpeaking, sttSupported, createAdvancedListener } from '@/services/speech';
import { cn } from '@/lib/cn';

const MODES = ['MOCK_INTERVIEW', 'PRACTICE', 'ASSESSMENT'];
const TYPES = ['Mixed', 'Technical', 'Behavioral', 'HR', 'System Design'];

export default function InterviewCoach() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('ss_user') || '{}');
  
  // State Machine
  const [phase, setPhase] = useState('setup'); // setup | room | results
  const [state, setState] = useState('idle'); // idle | ai_speaking | listening | thinking
  
  // Config
  const [config, setConfig] = useState({
    targetRole: user.targetRole || 'Software Engineer',
    company: '', interviewType: 'Mixed', mode: 'MOCK_INTERVIEW',
    difficulty: 'Intermediate', durationMinutes: 15, jobDescription: ''
  });

  // Live Data
  const [interviewId, setInterviewId] = useState(null);
  const [currentText, setCurrentText] = useState('');
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [turnCount, setTurnCount] = useState(0);
  const [results, setResults] = useState(null);

  // Refs for Voice Pipeline
  const listenerRef = useRef(null);
  const interruptRef = useRef(false);
  const isSpeakingRef = useRef(false);

  useEffect(() => () => { stopSpeaking(); listenerRef.current?.stop(); }, []);

  // ── SETUP PHASE ──
  const startSession = async () => {
    setPhase('room');
    setState('thinking');
    try {
      const { data } = await api.post('/interviews/start', config);
      setInterviewId(data.interviewId);
      aiSpeak(data.openingText);
    } catch {
      toast.error('Failed to start interview.');
      setPhase('setup');
    }
  };

  // ── VOICE LOGIC ──
  const aiSpeak = (text) => {
    setState('ai_speaking');
    isSpeakingRef.current = true;
    interruptRef.current = false;
    speak(text, {
      interruptRef,
      onEnd: () => {
        isSpeakingRef.current = false;
        startListening();
      }
    });
  };

  const startListening = () => {
    if (!sttSupported) { setState('idle'); return; }
    setState('listening');
    setTranscript(''); setInterim('');
    
    const listener = createAdvancedListener({
      onResult: (final, int) => { setTranscript(final); setInterim(int); },
      onSpeechStart: () => {
        // INTERRUPTION LOGIC: If AI is speaking, shut it up and listen to candidate
        if (isSpeakingRef.current) {
          interruptRef.current = true; 
          stopSpeaking();
          isSpeakingRef.current = false;
        }
      },
      onSpeechEnd: (finalText) => {
        if (finalText) submitAnswer(finalText);
      },
      onError: (err) => console.warn('STT Error', err)
    });
    listenerRef.current = listener;
    listener.start();
  };

  const submitAnswer = async (text) => {
    listenerRef.current?.stop();
    setState('thinking');
    try {
      const { data } = await api.post(`/interviews/${interviewId}/respond`, { text });
      setTurnCount(data.turnCount);
      if (data.action === 'CONCLUDE') {
        endSession();
      } else {
        aiSpeak(data.spokenText);
      }
    } catch {
      toast.error('Connection lost. Ending interview.');
      endSession();
    }
  };

  const endSession = async () => {
    stopSpeaking();
    listenerRef.current?.stop();
    setState('thinking');
    try {
      const { data } = await api.post(`/interviews/${interviewId}/end`);
      setResults(data);
      setPhase('results');
    } catch {
      toast.error('Failed to generate report.');
      setPhase('setup');
    }
  };

  // ── UI: SETUP SCREEN ──
  if (phase === 'setup') return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-2xl font-bold uppercase">AI Interview Room</h1>
      <div className="rounded-3xl bg-white p-8 shadow-card space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Target Role" value={config.targetRole} onChange={(v) => setConfig({...config, targetRole: v})} />
          <Field label="Company (Optional)" value={config.company} onChange={(v) => setConfig({...config, company: v})} />
          <Select label="Interview Type" value={config.interviewType} options={TYPES} onChange={(v) => setConfig({...config, interviewType: v})} />
          <Select label="Mode" value={config.mode} options={MODES} onChange={(v) => setConfig({...config, mode: v})} />
          <Select label="Difficulty" value={config.difficulty} options={['Beginner', 'Intermediate', 'Advanced', 'Expert']} onChange={(v) => setConfig({...config, difficulty: v})} />
          <Select label="Duration" value={config.durationMinutes} options={[10, 15, 30, 45]} onChange={(v) => setConfig({...config, durationMinutes: Number(v)})} />
        </div>
        <label className="block">
          <span className="text-micro font-bold uppercase tracking-wider text-neutral-500">Job Description (Optional)</span>
          <textarea rows={3} value={config.jobDescription} onChange={(e) => setConfig({...config, jobDescription: e.target.value})}
            className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-body" />
        </label>
        <button onClick={startSession} className="press w-full rounded-xl bg-gradient-brand py-4 text-body font-bold uppercase tracking-wide text-white shadow-glow">
          Enter Interview Room
        </button>
      </div>
    </div>
  );

  // ── UI: RESULTS SCREEN ──
  if (phase === 'results' && results) return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-neutral-950 p-10 text-center text-white shadow-glow">
        <p className="font-mono text-micro uppercase tracking-widest text-brand-400">Interview Complete</p>
        <h1 className="mt-2 font-display text-display-lg font-bold">Performance Analysis</h1>
        <p className="mt-6 font-display text-6xl font-bold text-brand-400"><CountUp value={results.overallScore || 0} /></p>
      </motion.div>

      <div className="rounded-3xl bg-white p-8 shadow-card">
        <h3 className="flex items-center gap-2 text-title font-semibold mb-4"><Brain size={20} className="text-brand-500" /> AI Coach Summary</h3>
        <p className="text-body text-neutral-700 leading-relaxed">{results.aiCoachSummary}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Strengths" items={results.strengths} color="emerald" />
        <Card title="Areas to Improve" items={results.weaknesses} color="amber" />
      </div>

      {results.skillGaps?.length > 0 && (
        <div className="rounded-3xl border-2 border-rose-100 bg-rose-50 p-6">
          <h3 className="text-title font-semibold text-rose-800 mb-3">Skill Gaps Detected</h3>
          <p className="text-caption text-rose-700 mb-3">These have been automatically sent to your Skill Gap Analyzer.</p>
          <div className="flex flex-wrap gap-2">
            {results.skillGaps.map(s => <span key={s} className="rounded-full bg-white border border-rose-200 px-3 py-1 text-caption font-bold text-rose-700">{s}</span>)}
          </div>
        </div>
      )}

      <div className="flex justify-center gap-4 pt-4">
        <button onClick={() => navigate('/skills')} className="press rounded-xl bg-neutral-900 px-6 py-3 text-body font-semibold text-white">View Skill Gaps</button>
        <button onClick={() => { setPhase('setup'); setResults(null); }} className="press rounded-xl border border-neutral-200 px-6 py-3 text-body font-semibold text-neutral-700">New Interview</button>
      </div>
    </div>
  );

  // ── UI: INTERVIEW ROOM (Dark Mode, Voice First) ──
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950 text-white overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
        <span className="font-display text-body font-bold tracking-wider text-brand-400">SKILLSYNC_AI INTERVIEW</span>
        <div className="flex items-center gap-4 font-mono text-caption text-neutral-400">
          <span>Turn {turnCount}</span>
          <span className="capitalize">{config.interviewType}</span>
        </div>
      </div>

      {/* Center: AI Presence */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
        <div className="relative mb-8">
          {/* Pulse Rings */}
          {state === 'ai_speaking' && (
            <>
              <motion.span className="absolute inset-0 rounded-full border-2 border-brand-500/50" animate={{ scale: [1, 1.5], opacity: [0.5, 0] }} transition={{ duration: 2, repeat: Infinity }} />
              <motion.span className="absolute inset-0 rounded-full border-2 border-brand-500/30" animate={{ scale: [1, 1.8], opacity: [0.3, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} />
            </>
          )}
          
          <motion.div 
            animate={state === 'ai_speaking' ? { scale: [1, 1.05, 1] } : state === 'listening' ? { boxShadow: ['0 0 0 0 rgba(239,68,68,0)', '0 0 0 20px rgba(239,68,68,0.2)', '0 0 0 0 rgba(239,68,68,0)'] } : {}}
            transition={{ duration: state === 'ai_speaking' ? 1 : 1.5, repeat: Infinity }}
            className={cn('flex h-32 w-32 items-center justify-center rounded-full bg-gradient-brand shadow-glow', state === 'listening' && 'bg-rose-600')}>
            <Bot size={56} />
          </motion.div>
        </div>

        <p className="font-mono text-micro uppercase tracking-widest text-neutral-400 mb-6">
          {state === 'ai_speaking' ? 'Interviewer Speaking...' : state === 'listening' ? 'Listening to you...' : state === 'thinking' ? 'Analyzing...' : 'Ready'}
        </p>

        {/* Live Transcript Bubble */}
        <div className="w-full max-w-2xl min-h-[120px] flex flex-col items-center justify-center">
          {state === 'ai_speaking' && currentText && (
            <p className="text-center text-title-lg font-medium text-neutral-200 italic">"{currentText}"</p>
          )}
          {state === 'listening' && (
            <div className="w-full rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 text-left">
              <p className="text-body text-neutral-100">{transcript}<span className="text-neutral-500">{interim}</span></p>
            </div>
          )}
          {state === 'thinking' && <Loader2 className="animate-spin text-brand-400" size={32} />}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-center gap-8 pb-8 pt-4 border-t border-neutral-800">
        <button onClick={endSession} className="press flex items-center gap-2 rounded-full border border-rose-500/40 px-6 py-3 text-caption font-semibold text-rose-400 hover:bg-rose-500/10">
          <PhoneOff size={16} /> End Interview
        </button>
        
        <div className="flex flex-col items-center gap-2">
          <div className={cn('h-16 w-16 rounded-full flex items-center justify-center transition-all', state === 'listening' ? 'bg-rose-600 shadow-[0_0_30px_rgba(239,68,68,0.5)]' : 'bg-neutral-800')}>
            {state === 'listening' ? <Mic size={28} /> : <MicOff size={28} className="text-neutral-500" />}
          </div>
          <span className="text-micro text-neutral-500">{state === 'listening' ? 'Auto-submitting on silence...' : 'Speak when ready'}</span>
        </div>

        <button onClick={() => aiSpeak(currentText)} disabled={state !== 'listening'} className="press rounded-full border border-neutral-700 p-4 text-neutral-300 hover:text-white disabled:opacity-30" title="Repeat Question">
          <Volume2 size={20} />
        </button>
      </div>
    </div>
  );
}

// Helper Components
function Field({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-micro font-bold uppercase tracking-wider text-neutral-500">{label}</span>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-body focus:border-brand-500" />
    </label>
  );
}
function Select({ label, value, options, onChange }) {
  return (
    <label className="block">
      <span className="text-micro font-bold uppercase tracking-wider text-neutral-500">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-body">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
function Card({ title, items, color }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-card">
      <h3 className={cn('text-title font-semibold mb-4', `text-${color}-700`)}>{title}</h3>
      <ul className="space-y-2">
        {items?.map((item, i) => <li key={i} className="text-body text-neutral-700 flex gap-2">• {item}</li>)}
      </ul>
    </div>
  );
}