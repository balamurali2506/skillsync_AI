import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Key, Zap, CheckCircle2, Loader2, Shield } from 'lucide-react';
import { api } from '@/lib/api';

export default function Settings() {
  const [geminiKey, setGeminiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    api.get('/settings/ai').then(({ data }) => {
      setHasKey(data.hasKey);
    }).finally(() => setLoading(false));
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.patch('/settings/ai', { geminiKey });
      setHasKey(!!geminiKey);
      setGeminiKey(''); // Clear input for security
      toast.success('Gemini API Key saved securely!');
    } catch { toast.error('Failed to save key.'); }
    finally { setSaving(false); }
  };

  const testKey = async () => {
    if (!geminiKey) return toast.error('Please enter a key to test.');
    setTesting(true);
    try {
      await api.post('/settings/ai/test', { apiKey: geminiKey });
      toast.success('✅ Gemini connection successful!');
    } catch (err) { toast.error(`❌ Failed: ${err.response?.data?.error || 'Invalid key'}`); }
    finally { setTesting(false); }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="mx-auto max-w-xl space-y-8 pb-12">
      <header>
        <h1 className="font-display text-2xl font-bold uppercase flex items-center gap-2">
          <Shield className="text-brand-500" /> API Key Settings
        </h1>
        <p className="mt-2 text-body text-neutral-500">
          Connect your Google Gemini API key to unlock AI-powered resume analysis, interview coaching, and skill gap insights.
        </p>
      </header>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-white p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-title font-semibold flex items-center gap-2">
            <Key size={18} /> Google Gemini API Key
          </h3>
          {hasKey && (
            <span className="flex items-center gap-1 text-emerald-600 text-caption font-bold">
              <CheckCircle2 size={14} /> Connected
            </span>
          )}
        </div>

        <label className="block">
          <span className="text-micro font-bold uppercase tracking-wider text-neutral-500">API Key</span>
          <input type="password" placeholder={hasKey ? '•••••••••••• (Leave blank to keep current)' : 'Enter your Gemini API key (AIza...)'}
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-body font-mono" />
        </label>
        <p className="text-caption text-neutral-500">
          Get a free key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-brand-600 underline">aistudio.google.com</a>
        </p>

        <div className="flex gap-3 pt-2">
          <button onClick={testKey} disabled={testing || !geminiKey}
            className="press flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2 text-caption font-bold text-neutral-700 disabled:opacity-50">
            {testing ? <Loader2 className="animate-spin" size={14}/> : <Zap size={14}/>} Test Connection
          </button>
        </div>
      </motion.div>

      <button onClick={saveSettings} disabled={saving}
        className="press w-full rounded-xl bg-gradient-brand py-4 text-body font-bold uppercase tracking-wide text-white shadow-glow disabled:opacity-50">
        {saving ? 'Saving...' : 'Save API Key'}
      </button>
    </div>
  );
}