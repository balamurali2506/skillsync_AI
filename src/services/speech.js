// Modular speech services — provider can be swapped later.

export function speak(text, { rate = 1, onStart, onEnd, interruptRef } = {}) {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) { onEnd?.(); return resolve(); }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    
    const voices = window.speechSynthesis.getVoices();
    const proVoice = voices.find(v => /google|zira|samantha|aria|jenny/i.test(v.name) && v.lang.startsWith('en')) || voices.find(v => v.lang.startsWith('en'));
    if (proVoice) u.voice = proVoice;

    u.onstart = () => onStart?.();
    
    // Check for interruption every 100ms
    const checkInterrupt = setInterval(() => {
      if (interruptRef?.current) {
        window.speechSynthesis.cancel();
        clearInterval(checkInterrupt);
        onEnd?.();
        resolve();
      }
    }, 100);

    u.onend = () => { clearInterval(checkInterrupt); onEnd?.(); resolve(); };
    u.onerror = () => { clearInterval(checkInterrupt); onEnd?.(); resolve(); };
    
    window.speechSynthesis.speak(u);
  });
}

export function stopSpeaking() { 
  window.speechSynthesis?.cancel(); 
}

export const sttSupported = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

// Continuous listener with auto-restart + silence detection
export function createListener({ onResult, onSilence, onError, onIdle, silenceMs = 2500, idleMs = 15000 }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;

  let active = false, rec = null, finalText = '';
  let silenceTimer = null, idleTimer = null;

  const armSilence = () => {
    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => { 
      if (finalText.trim()) {
        active = false; // Stop listening after silence submission
        try { rec?.stop(); } catch {}
        onSilence?.(finalText.trim()); 
      }
    }, silenceMs);
  };

  const spawn = () => {
    rec = new SR();
    rec.continuous = true; 
    rec.interimResults = true; 
    rec.lang = 'en-US';
    
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
      if (e.error === 'not-allowed') {
         active = false;
         onError?.(e.error);
         return;
      }
      onError?.(e.error);
    };
    
    rec.onend = () => { 
      // Auto-restart if browser killed the session but we are still actively listening
      if (active) setTimeout(() => { if (active) spawn(); }, 100); 
    };
    
    try { rec.start(); } catch (e) { console.warn('STT start error', e); }
  };

  return {
    start() {
      active = true; 
      finalText = '';
      spawn();
      idleTimer = setTimeout(() => {
         if (active && !finalText.trim()) onIdle?.();
      }, idleMs);
    },
    stop() {
      active = false;
      clearTimeout(silenceTimer); 
      clearTimeout(idleTimer);
      try { rec?.stop(); } catch {}
    },
    getText: () => finalText.trim(),
  };
}