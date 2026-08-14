import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { Mic, MicOff, Volume2, Repeat, Pause, Play, PhoneOff, ChevronRight, Sparkles, Loader2, CheckCircle2, Lightbulb, Bot, Send } from 'lucide-react';
import CountUp from '@/components/ui/CountUp';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { speak, stopSpeaking, sttSupported, createListener } from '@/services/speech';

const TYPES = ['Mixed', 'Technical', 'HR', 'Behavioral', 'Resume-Based', 'Job-Specific'];
// Updated Fillers List
const FILLERS = ['um', 'uh', 'ahh', 'mmm', 'hmm', 'like', 'basically', 'actually', 'you know', 'kind of', 'sort of'];

function Waveform({ active, color = 'bg-brand-400', reduce }) {
  return (
    <div className="flex h-8 items-end gap-1">
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <motion.span key={i} className={cn('w-1 rounded-full', color)}
          animate={active && !reduce ? { height: [6, 22 - (i % 3) * 5, 6] } : { height: 6 }}
          transition={{ duration: 0.5, repeat: active && !reduce ? Infinity : 0, delay: i * 0.08, ease: 'easeInOut' }} />
      ))}
    </div>
  );
}

function Bar({ label, value }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-caption font-medium capitalize">
        <span className="text-neutral-600">{label}</span>
        <span className="font-mono text-neutral-900">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={cn('h-full rounded-full', value >= 75 ? 'bg-gradient-score-high' : value >= 45 ? 'bg-gradient-score-mid' : 'bg-gradient-score-low')} />
      </div>
    </div>
  );
}

export default function InterviewCoach() {
  const reduce = useReducedMotion();
  const user = JSON.parse(localStorage.getItem('ss_user') || '{}');

  const [mode, setMode] = useState('setup'); 
  const [config, setConfig] = useState({
    targetRole: user.targetRole || 'Software Engineer',
    interviewType: 'Mixed', difficulty: 'Medium', durationMinutes: 15,
    questionCount: 6, jobDescription: '', focus: '',
  });
  const [resumeInfo, setResumeInfo] = useState(null);
  
  // The typing box state
  const [typedAnswer, setTypedAnswer] = useState('');

  const [micOK, setMicOK] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const micStreamRef = useRef(null);
  const rafRef = useRef(null);

  const [interviewId, setInterviewId] = useState(null);
  const [liveStage, setLiveStage] = useState('starting'); 
  const [current, setCurrent] = useState(null);
  const [qIndex, setQIndex] = useState(1);
  const [transcript, setTranscript] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const listenerRef = useRef(null);
  const answerStartRef = useRef(null);
  const pausedRef = useRef(false);

  const [report, setReport] = useState(null);
  const [fullReview, setFullReview] = useState(null);

  useEffect(() => {
    api.get('/resumes').then(({ data }) => {
      const latest = data.resumes?.[0];
      if (latest) setResumeInfo({ fileName: latest.fileName, skills: latest.extractedSkills || [] });
    }).catch(() => {});
    return () => {
      stopSpeaking();
      listenerRef.current?.stop();
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    if (mode !== 'live' || paused) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { endInterview(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [mode, paused]);

  const testMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      micStreamRef.current = stream;
      setMicOK(true);
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      if (ctx.state === 'suspended') await ctx.resume();
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser();
      an.fftSize = 512; an.smoothingTimeConstant = 0.7; 
      src.connect(an);
      const data = new Uint8Array(an.frequencyBinCount);
      const loop = () => {
        an.getByteTimeDomainData(data);
        const rms = Math.sqrt(data.reduce((s, v) => s + ((v - 128) / 128) ** 2, 0) / data.length);
        setMicLevel(Math.min(1, rms * 5));
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch (err) {
      console.error('Mic error:', err);
      toast.error(`Microphone error: ${err.message || 'Could not access mic'}`);
    }
  };

  const leaveMicCheck = () => {
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    cancelAnimationFrame(rafRef.current);
    setMicLevel(0);
  };

  const startInterview = async () => {
    setMode('live');
    setLiveStage('starting');
    setSecondsLeft(config.durationMinutes * 60);
    try {
      const { data } = await api.post('/interviews/start', config);
      setInterviewId(data.interviewId);
      const firstQ = { question: data.openingText, speakText: data.openingText, questionType: 'Introduction', difficulty: 1 };
      askQuestion(firstQ, 1, true);
    } catch {
      toast.error('Could not start the interview. Is the backend running?');
      setMode('setup');
    }
  };

  const askQuestion = (q, index, opening = false) => {
    setCurrent(q);
    setQIndex(index);
    setTranscript('');
    setTypedAnswer(''); // Clear typing box for new question
    setLiveStage('ai-speaking');
    speak(opening ? `Hello! I'm your AI interviewer. This is a simulated interview. Feel free to ask me to repeat any question. Let's begin. ${q.speakText || q.question}` : (q.speakText || q.question), {
      onStart: () => setSpeaking(true),
      onEnd: () => {
        setSpeaking(false);
        setLiveStage('waiting');
        setTimeout(() => !pausedRef.current && startListening(), 700);
      },
    });
  };

  const startListening = () => {
    stopSpeaking();
    if (!sttSupported) { setLiveStage('waiting'); return; }
    answerStartRef.current = Date.now();
    const listener = createListener({
      onResult: (final, interim) => setTranscript(final + interim),
      onSilence: (text) => submitAnswer(text),
      onIdle: () => speak('Take your time.', { onEnd: () => {} }),
      onError: (err) => {
        if (err === 'not-allowed') { toast.error('Microphone denied. Please use the typing box below.'); }
      },
    });
    listenerRef.current = listener;
    listener.start();
    setLiveStage('listening');
  };

  // UPDATED: Accepts text from Voice OR typedAnswer from Keyboard
  const submitAnswer = async (text) => {
    const answerText = (text || typedAnswer || transcript).trim();
    if (!answerText) { toast.error('Please speak or type an answer.'); setLiveStage('waiting'); return; }
    
    listenerRef.current?.stop();
    stopSpeaking();
    setLiveStage('processing');
    
    try {
      const { data } = await api.post(`/interviews/${interviewId}/respond`, { text: answerText });
      
      // Clear inputs for the next turn
      setTypedAnswer(''); 
      setTranscript('');
      
      if (data.action === 'CONCLUDE') {
        await finishInterview();
      } else {
        const nextQ = { question: data.spokenText, speakText: data.spokenText, questionType: data.topic || 'Follow-up', difficulty: 1 };
        askQuestion(nextQ, qIndex + 1, false);
      }
    } catch {
      toast.error('Analysis failed — please try again.');
      setLiveStage('waiting');
    }
  };

  const finishInterview = async () => {
    setLiveStage('processing');
    stopSpeaking();
    listenerRef.current?.stop();
    try {
      const { data } = await api.post(`/interviews/${interviewId}/end`);
      setReport(data);
      setFullReview(data); 
      setMode('report');
    } catch {
      toast.error('Could not generate the report.');
      setMode('setup');
    }
  };

  const endInterview = () => {
    if (interviewId) finishInterview();
    else setMode('setup');
  };

  const togglePause = () => {
    if (paused) {
      pausedRef.current = false; setPaused(false);
      if (current && liveStage !== 'listening') speak(current.speakText || current.question, { onStart: () => setSpeaking(true), onEnd: () => { setSpeaking(false); setLiveStage('waiting'); } });
    } else {
      pausedRef.current = true; setPaused(true);
      stopSpeaking(); listenerRef.current?.stop(); setSpeaking(false);
    }
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const statusText = {
    starting: 'Preparing your interview…',
    'ai-speaking': 'AI Interviewer is speaking…',
    waiting: 'Listening standby — speak or type your answer below',
    listening: 'Listening to you…',
    processing: 'Analyzing your answer…',
  }[liveStage];

  if (mode === 'setup') return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="font-display text-2xl sm:text-display-xl font-bold uppercase">AI Interview Coach</h1>
        <p className="mt-2 text-sm sm:text-body text-neutral-500">A strict, realistic voice interview that adapts to your answers — powered by your resume.</p>
      </header>
      <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-card space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Target Role', key: 'targetRole', type: 'text' },
            { label: 'Interview Focus (optional)', key: 'focus', type: 'text', placeholder: 'e.g. Java + React + Problem Solving' },
          ].map((f) => (
            <label key={f.key} className="block">
              <span className="text-micro font-semibold uppercase tracking-wider text-neutral-500">{f.label}</span>
              <input type="text" value={config[f.key]} placeholder={f.placeholder}
                onChange={(e) => setConfig({ ...config, [f.key]: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-body focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
            </label>
          ))}
          <label className="block">
            <span className="text-micro font-semibold uppercase tracking-wider text-neutral-500">Interview Type</span>
            <select value={config.interviewType} onChange={(e) => setConfig({ ...config, interviewType: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-body">
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-micro font-semibold uppercase tracking-wider text-neutral-500">Difficulty</span>
            <select value={config.difficulty} onChange={(e) => setConfig({ ...config, difficulty: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-body">
              {['Easy', 'Medium', 'Hard'].map((d) => <option key={d}>{d}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-micro font-semibold uppercase tracking-wider text-neutral-500">Duration (minutes)</span>
            <select value={config.durationMinutes} onChange={(e) => setConfig({ ...config, durationMinutes: Number(e.target.value) })}
              className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-body">
              {[10, 15, 20, 30].map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
        </div>
        <label className="block">
          <span className="text-micro font-semibold uppercase tracking-wider text-neutral-500">Job Description (optional)</span>
          <textarea rows={3} value={config.jobDescription} onChange={(e) => setConfig({ ...config, jobDescription: e.target.value })}
            placeholder="Paste a job description to tailor questions…"
            className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-body focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
        </label>
        <div className="rounded-2xl border border-brand-200 bg-gradient-brand-soft p-4">
          {resumeInfo ? (
            <>
              <p className="text-caption font-bold uppercase tracking-wider text-brand-700">Resume detected: {resumeInfo.fileName}</p>
              <p className="mt-1 text-caption text-brand-800">Questions will be generated from your real skills & projects.</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {resumeInfo.skills.slice(0, 10).map((s) => (
                  <span key={s} className="rounded-full bg-white/70 border border-brand-200 px-2.5 py-0.5 text-micro font-semibold text-brand-700">{s}</span>
                ))}
              </div>
            </>
          ) : (
            <p className="text-caption text-brand-800">No resume uploaded yet — questions will be role-based.</p>
          )}
        </div>
        <button onClick={() => { setMode('mic'); testMic(); }}
          className="press flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3.5 text-body font-semibold uppercase tracking-wide text-white shadow-glow">
          <Mic size={18} /> Continue to Mic Check
        </button>
      </div>
    </div>
  );

  if (mode === 'mic') return (
    <div className="mx-auto max-w-lg space-y-6">
      <header className="text-center">
        <h1 className="font-display text-2xl font-bold uppercase">Audio Check</h1>
        <p className="mt-2 text-body text-neutral-500">Let's make sure we can hear each other.</p>
      </header>
      <div className="rounded-3xl bg-white p-8 shadow-card space-y-6">
        <div className="flex items-center justify-between rounded-2xl border border-neutral-200 p-4">
          <div>
            <p className="text-body font-semibold">Speaker test</p>
            <p className="text-caption text-neutral-500">"Can you hear me?"</p>
          </div>
          <button onClick={() => speak('Can you hear me? Great. Let us begin when you are ready.')}
            className="press flex items-center gap-2 rounded-xl bg-neutral-100 px-4 py-2 text-caption font-semibold text-neutral-700">
            <Volume2 size={16} /> Play
          </button>
        </div>
        <div className="rounded-2xl border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body font-semibold">Microphone {micOK && <span className="text-emerald-600">✓ detected</span>}</p>
              <p className="text-caption text-neutral-500">Speak now — the bar should move.</p>
            </div>
            {!micOK && <button onClick={testMic} className="press rounded-xl bg-neutral-100 px-4 py-2 text-caption font-semibold">Enable mic</button>}
          </div>
          <div className="mt-3 h-6 w-full overflow-hidden rounded-full bg-neutral-100 relative">
            <div className="h-full rounded-full bg-gradient-brand transition-all duration-100" style={{ width: `${Math.max(2, Math.round(micLevel * 100))}%` }} />
            <span className="absolute inset-0 flex items-center justify-center text-micro font-bold text-neutral-700">
              {micOK ? (micLevel > 0.05 ? '🎙️ I hear you!' : 'Speak louder…') : 'Waiting for mic…'}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { leaveMicCheck(); setMode('setup'); }} className="press flex-1 rounded-xl border border-neutral-200 py-3 text-body font-semibold text-neutral-600">Back</button>
          <button onClick={() => { leaveMicCheck(); startInterview(); }} disabled={!micOK}
            className="press flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3 text-body font-semibold text-white shadow-glow disabled:opacity-40">
            <Sparkles size={16} /> Start Interview
          </button>
        </div>
      </div>
    </div>
  );

  if (mode === 'report' && report) return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl bg-neutral-950 p-8 sm:p-10 text-center text-white shadow-glow">
        <p className="font-mono text-micro uppercase tracking-widest text-brand-400">Interview Complete</p>
        <h1 className="mt-2 font-display text-display-lg font-bold">Your performance has been analyzed</h1>
        <p className="mt-6 font-display text-display-xl font-bold text-brand-400"><CountUp value={report.overallScore || 0} /></p>
        <span className="mt-2 inline-block rounded-full border border-brand-500/40 bg-brand-500/10 px-4 py-1 text-caption font-bold uppercase tracking-wider text-brand-300">
          {report.overallScore >= 75 ? 'Interview Ready' : report.overallScore >= 50 ? 'Needs Improvement' : 'Not Ready'}
        </span>
      </motion.div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-card space-y-4">
          <h3 className="text-title font-semibold">Category Scores</h3>
          {Object.entries(report.categoryScores || {}).map(([k, v]) => <Bar key={k} label={k} value={v} />)}
        </div>
        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-card">
            <h3 className="text-title font-semibold text-emerald-700">Strengths</h3>
            <ul className="mt-3 space-y-2">{(report.strengths || []).map((s, i) => <li key={i} className="flex gap-2 text-body text-neutral-700"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />{s}</li>)}</ul>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-card">
            <h3 className="text-title font-semibold text-rose-700">Weaknesses (Harsh Feedback)</h3>
            <ul className="mt-3 space-y-2">{(report.weaknesses || []).map((s, i) => <li key={i} className="flex gap-2 text-body text-neutral-700"><Lightbulb size={16} className="mt-0.5 shrink-0 text-rose-500" />{s}</li>)}</ul>
          </div>
        </div>
      </div>
      {report.aiCoachSummary && (
        <div className="rounded-3xl bg-white p-6 shadow-card">
          <h3 className="flex items-center gap-2 text-title font-semibold"><Bot size={18} className="text-brand-500" /> AI Coach Summary</h3>
          <p className="mt-2 text-body text-neutral-600 leading-relaxed">{report.aiCoachSummary}</p>
        </div>
      )}
      {fullReview && fullReview.transcript && (
        <div className="rounded-3xl bg-white p-6 shadow-card">
          <h3 className="text-title font-semibold">Question-by-Question Review</h3>
          <div className="mt-3 space-y-3">
            {fullReview.transcript.filter((q) => q.answer).map((q, i) => (
              <details key={i} className="rounded-2xl border border-neutral-200 p-4">
                <summary className="flex cursor-pointer items-center justify-between gap-3 text-body font-semibold">
                  <span className="truncate">Q{i + 1}: {q.question}</span>
                  <span className="font-mono text-caption text-brand-600">{q.evaluation?.technical || 0}/100</span>
                </summary>
                <p className="mt-2 text-caption text-neutral-500"><span className="font-bold">Your answer:</span> {q.answer}</p>
                {q.feedback && <p className="mt-2 text-caption text-rose-700 font-semibold">Feedback: {q.feedback}</p>}
              </details>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-3 pb-8">
        <button onClick={() => { setMode('setup'); setReport(null); }} className="press rounded-xl bg-gradient-brand px-6 py-3 text-body font-semibold text-white shadow-glow">New Interview</button>
      </div>
    </div>
  );

  // LIVE ROOM
  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-neutral-950 text-white">
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-neutral-800">
        <span className="font-display text-body font-bold tracking-wider text-brand-400">SKILLSYNC_AI</span>
        <div className="flex items-center gap-4 font-mono text-caption text-neutral-400">
          <span>Turn {qIndex}</span>
          <span className={cn(secondsLeft < 60 && 'text-rose-400')}>{fmt(secondsLeft)}</span>
        </div>
      </div>
      
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-8 text-center">
        <div className="relative">
          {!reduce && (speaking || liveStage === 'listening') && (
            <motion.span className="absolute inset-0 rounded-full border-2 border-brand-500/50"
              animate={{ scale: [1, 1.35], opacity: [0.6, 0] }} transition={{ duration: 1.4, repeat: Infinity }} />
          )}
          <motion.div
            animate={!reduce ? { scale: speaking ? [1, 1.05, 1] : [1, 1.02, 1] } : {}}
            transition={{ duration: speaking ? 0.6 : 3, repeat: Infinity, ease: 'easeInOut' }}
            className={cn('flex h-28 w-28 sm:h-36 sm:w-36 items-center justify-center rounded-full bg-gradient-brand shadow-glow',
              liveStage === 'listening' && 'ring-4 ring-rose-500/60')}>
            <Bot size={52} />
          </motion.div>
        </div>
        
        <p className="font-mono text-micro uppercase tracking-widest text-neutral-400">{statusText}</p>
        <Waveform active={speaking || liveStage === 'listening'} reduce={reduce} color={liveStage === 'listening' ? 'bg-rose-400' : 'bg-brand-400'} />
        
        <AnimatePresence mode="wait">
          {current && (
            <motion.div key={current.question} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}
              className="max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5 backdrop-blur">
              <span className="text-micro font-bold uppercase tracking-wider text-brand-400">{current.questionType}</span>
              <p className="mt-2 text-title-lg font-semibold leading-snug">{current.question}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live transcript & Typing Box */}
        <div className="w-full max-w-2xl space-y-3">
          {(liveStage === 'listening' || transcript) && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 text-left">
              <p className="text-micro font-bold uppercase tracking-wider text-rose-400">Live Voice Transcript</p>
              <p className="mt-1 max-h-20 overflow-y-auto text-body text-neutral-200">{transcript || '…'}</p>
            </div>
          )}
          
          {/* Always visible typing box */}
          {liveStage !== 'processing' && liveStage !== 'ai-speaking' && (
            <div className="flex gap-2">
              <input 
                type="text" 
                value={typedAnswer} 
                onChange={(e) => setTypedAnswer(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter' && typedAnswer.trim()) submitAnswer(typedAnswer); }}
                placeholder="Or type your answer here and press Enter..."
                className="flex-1 rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-body text-white placeholder:text-neutral-500 focus:border-brand-500 focus:outline-none"
                disabled={liveStage === 'processing' || liveStage === 'ai-speaking'}
              />
              <button 
                onClick={() => submitAnswer(typedAnswer)} 
                disabled={!typedAnswer.trim() || liveStage === 'processing' || liveStage === 'ai-speaking'}
                className="press flex items-center gap-2 rounded-xl bg-brand-600 px-5 font-semibold text-white disabled:opacity-30"
              >
                <Send size={16} /> Send
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 sm:gap-6 border-t border-neutral-800 px-6 py-5">
        <button onClick={() => current && speak(current.speakText || current.question, { onStart: () => setSpeaking(true), onEnd: () => setSpeaking(false) })}
          className="press rounded-full border border-neutral-700 p-3 text-neutral-300 hover:text-white" title="Repeat question"><Repeat size={20} /></button>
        
        <button
          onClick={() => (liveStage === 'listening' ? submitAnswer(listenerRef.current?.getText()) : startListening())}
          disabled={liveStage === 'processing' || liveStage === 'ai-speaking'}
          className={cn('press flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full text-white shadow-glow transition-colors disabled:opacity-40',
            liveStage === 'listening' ? 'bg-rose-600' : 'bg-gradient-brand')}
          title={liveStage === 'listening' ? 'Finish answer' : 'Start answering'}>
          {liveStage === 'listening' ? <MicOff size={28} /> : <Mic size={28} />}
        </button>

        <button onClick={togglePause} className="press rounded-full border border-neutral-700 p-3 text-neutral-300 hover:text-white" title="Pause">
          {paused ? <Play size={20} /> : <Pause size={20} />}
        </button>
        <button onClick={endInterview} className="press flex items-center gap-2 rounded-full border border-rose-500/40 px-4 py-3 text-caption font-semibold text-rose-400 hover:bg-rose-500/10">
          <PhoneOff size={16} /> End
        </button>
      </div>

      <AnimatePresence>
        {paused && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="text-center">
              <p className="font-display text-title-lg font-bold">Paused</p>
              <button onClick={togglePause} className="press mt-4 rounded-xl bg-gradient-brand px-6 py-3 text-body font-semibold text-white shadow-glow">Resume Interview</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {liveStage === 'processing' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-2xl bg-neutral-900 px-6 py-4 border border-neutral-700">
            <Loader2 className="animate-spin text-brand-400" size={20} />
            <span className="text-body text-neutral-200">Analyzing your answer…</span>
          </div>
        </div>
      )}
    </div>
  );
}