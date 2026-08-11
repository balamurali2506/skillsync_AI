import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  UploadCloud, CheckCircle2, AlertTriangle, Lightbulb,
  FileText, Sparkles, ArrowRight,
} from 'lucide-react';
import ScoreRing from '@/components/ui/ScoreRing';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';

export default function ResumeAnalyzer() {
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | analyzing | done
  const [fileName, setFileName] = useState('');
  const [score, setScore] = useState(0);
  const [analysis, setAnalysis] = useState(null); // rich Groq analysis object

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setFileName(file.name);
    setStatus('analyzing');

    try {
      const formData = new FormData();
      formData.append('resume', file); // must match multer's .single('resume')

      const { data } = await api.post('/resumes/analyze', formData);

      setScore(data.analysis.atsScore);
      setAnalysis(data.analysis);
      setStatus('done');
      toast.success('Resume analyzed successfully!');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || 'Failed to analyze resume.';
      toast.error(msg);
      setStatus('idle');
    }
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  }, [handleFile]);

  const reset = () => {
    setStatus('idle');
    setAnalysis(null);
    setFileName('');
    setScore(0);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <h1 className="font-display text-display-xl font-bold uppercase">Resume Analyzer</h1>
        <p className="mt-2 text-body text-neutral-500">
          Upload your resume for an expert ATS & recruiter audit.
        </p>
      </header>

      <AnimatePresence mode="wait">
        {/* ── STATE 1: DROPZONE ── */}
        {status === 'idle' && (
          <motion.label
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={dragOver
              ? { opacity: 1, y: 0, scale: 1.02 }
              : { opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed p-14 transition-colors',
              dragOver
                ? 'border-brand-500 bg-gradient-brand-soft shadow-glow'
                : 'border-neutral-300 bg-white hover:border-brand-400',
            )}
          >
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <UploadCloud size={48} className={dragOver ? 'text-brand-500' : 'text-neutral-400'} />
            <div className="text-center">
              <p className="text-title font-semibold">
                {dragOver ? 'Drop it here' : 'Drag & drop your resume'}
              </p>
              <p className="mt-1 text-caption text-neutral-500">or click to browse — PDF preferred</p>
            </div>
          </motion.label>
        )}

        {/* ── STATE 2: LOADING ── */}
        {status === 'analyzing' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 rounded-3xl bg-white p-12 shadow-card"
          >
            <div className="skeleton h-40 w-40 rounded-full" />
            <p className="font-mono text-caption text-neutral-500">
              Extracting text & running AI audit on {fileName}…
            </p>
          </motion.div>
        )}

        {/* ── STATE 3: RESULTS ── */}
        {status === 'done' && analysis && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Top row: Score ring + breakdown bars */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-8 shadow-card">
                <ScoreRing value={score} size={180} label="ATS Score" />
                <p className="mt-4 text-center text-caption text-neutral-500">
                  {analysis.recruiterSummary || 'Analysis complete.'}
                </p>
              </div>

              <div className="rounded-3xl bg-white p-8 shadow-card lg:col-span-2">
                <h3 className="mb-4 text-title font-semibold">Score Breakdown</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {Object.entries(analysis.breakdown || {}).map(([key, val]) => (
                    <div key={key} className="space-y-1.5">
                      <div className="flex justify-between text-caption font-medium capitalize">
                        <span className="text-neutral-600">{key}</span>
                        <span className="font-mono text-neutral-900">{val}/100</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${val}%` }}
                          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                          className={cn(
                            'h-full rounded-full',
                            val >= 75
                              ? 'bg-gradient-score-high'
                              : val >= 45
                                ? 'bg-gradient-score-mid'
                                : 'bg-gradient-score-low',
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Critical issues (only if Groq found any) */}
            {analysis.criticalIssues?.length > 0 && (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-card">
                <div className="mb-4 flex items-center gap-2">
                  <AlertTriangle size={20} className="text-rose-500" />
                  <h3 className="text-title font-semibold text-rose-700">Critical Issues</h3>
                </div>
                <ul className="space-y-2">
                  {analysis.criticalIssues.map((issue, i) => (
                    <li key={i} className="flex gap-3 text-body text-rose-700">
                      <span className="font-mono text-micro">{String(i + 1).padStart(2, '0')}</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quick wins + strengths */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-3xl bg-white p-6 shadow-card">
                <div className="mb-4 flex items-center gap-2">
                  <Lightbulb size={20} className="text-amber-500" />
                  <h3 className="text-title font-semibold">Quick Wins</h3>
                </div>
                <ul className="space-y-3">
                  {(analysis.quickWins || []).map((tip, i) => (
                    <li key={i} className="flex gap-3 text-body text-neutral-700">
                      <Sparkles size={16} className="mt-1 flex-shrink-0 text-brand-500" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-card">
                <div className="mb-4 flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-emerald-500" />
                  <h3 className="text-title font-semibold">Strengths</h3>
                </div>
                <ul className="space-y-3">
                  {(analysis.strengths || []).map((str, i) => (
                    <li key={i} className="flex gap-3 text-body text-neutral-700">
                      <CheckCircle2 size={16} className="mt-1 flex-shrink-0 text-emerald-500" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Before → After rewrites (the wow-factor section) */}
            {analysis.rewriteSuggestions?.length > 0 && (
              <div className="rounded-3xl bg-white p-6 shadow-card">
                <h3 className="mb-4 text-title font-semibold">Before → After Rewrites</h3>
                <div className="space-y-4">
                  {analysis.rewriteSuggestions.slice(0, 4).map((rw, i) => (
                    <div key={i} className="rounded-2xl border border-neutral-200 p-4">
                      <p className="text-body text-rose-600 line-through">{rw.original}</p>
                      <div className="my-2 flex items-center gap-2 text-micro font-semibold uppercase tracking-wider text-neutral-400">
                        <ArrowRight size={12} /> Improved
                      </div>
                      <p className="text-body text-emerald-700">{rw.improved}</p>
                      {rw.reason && (
                        <p className="mt-2 text-caption text-neutral-500">{rw.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Extracted skills + reset */}
            <div className="rounded-3xl bg-white p-6 shadow-card">
              <h3 className="mb-4 text-title font-semibold">Extracted Technical Skills</h3>
              <div className="flex flex-wrap gap-2">
                {(analysis.extractedSkills || []).map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-brand-200 bg-gradient-brand-soft px-3 py-1 text-caption font-semibold text-brand-700"
                  >
                    {skill}
                  </span>
                ))}
                {(!analysis.extractedSkills || analysis.extractedSkills.length === 0) && (
                  <p className="text-caption text-neutral-500">No specific technical skills detected.</p>
                )}
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  onClick={reset}
                  className="flex items-center gap-2 text-caption font-semibold text-brand-600 hover:underline"
                >
                  <FileText size={14} /> Analyze another resume
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}