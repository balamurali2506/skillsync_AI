// Modular speech services — provider can be swapped later.

function pickVoice() {
  const voices = window.speechSynthesis?.getVoices() || [];
  return voices.find((v) => v.lang.startsWith('en') && /google|zira|samantha|aria|jenny/i.test(v.name))
    || voices.find((v) => v.lang.startsWith('en')) || null;
}

export function speak(text, { rate = 1, onStart, onEnd } = {}) {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) { onEnd?.(); return resolve(); }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    const v = pickVoice(); if (v) u.voice = v;
    u.onstart = () => onStart?.();
    u.onend = () => { onEnd?.(); resolve(); };
    u.onerror = () => { onEnd?.(); resolve(); };
    window.speechSynthesis.speak(u);
  });
}

export function stopSpeaking() { window.speechSynthesis?.cancel(); }

export const sttSupported = typeof window !== 'undefined'
  && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

// Continuous listener with auto-restart + silence detection
export function createListener({ onResult, onSilence, onError, onIdle, silenceMs = 2500, idleMs = 12000 }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;

  let active = false, rec = null, finalText = '';
  let silenceTimer = null, idleTimer = null;

  const armSilence = () => {
    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => { if (finalText.trim()) onSilence?.(finalText.trim()); }, silenceMs);
  };

  const spawn = () => {
    rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = 'en-US';
    rec.onresult = (e) => {
      clearTimeout(idleTimer);
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += `${t} `; else interim += t;
      }
      onResult?.(finalText, interim);
      armSilence();
    };
    rec.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      onError?.(e.error);
    };
    rec.onend = () => { if (active) setTimeout(spawn, 100); };
    try { rec.start(); } catch { /* already running */ }
  };

  return {
    start() {
      active = true; finalText = '';
      spawn();
      idleTimer = setTimeout(() => onIdle?.(), idleMs);
    },
    stop() {
      active = false;
      clearTimeout(silenceTimer); clearTimeout(idleTimer);
      rec?.stop();
    },
    getText: () => finalText.trim(),
  };
}