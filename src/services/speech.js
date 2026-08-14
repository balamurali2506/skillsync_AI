// Advanced Voice Pipeline with VAD & Memory Fix

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

// FIXED: Continuous listener with duplication prevention
export function createListener({ onResult, onSilence, onError, onIdle, silenceMs = 2500, idleMs = 15000 }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;

  let active = false, rec = null;
  let committedText = ''; // Text safely saved from previous recognizer sessions
  let currentSessionFinals = ''; // Text finalized in the current active session
  let currentInterim = '';
  
  let silenceTimer = null, idleTimer = null;

  const armSilence = () => {
    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => { 
      const fullText = (committedText + currentSessionFinals).trim();
      if (fullText) {
        active = false; 
        try { rec?.stop(); } catch {}
        onSilence?.(fullText); 
      }
    }, silenceMs);
  };

  const spawn = () => {
    rec = new SR();
    rec.continuous = true; 
    rec.interimResults = true; 
    rec.lang = 'en-US';
    
    // Reset session finals when spawning a new recognizer to prevent duplication
    currentSessionFinals = '';
    currentInterim = '';
    
    rec.onresult = (e) => {
      clearTimeout(idleTimer);
      let sessionFinals = '';
      let interim = '';
      // Rebuild from scratch to avoid appending duplicates
      for (let i = 0; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) sessionFinals += `${t} `;
        else interim += t;
      }
      currentSessionFinals = sessionFinals;
      currentInterim = interim;
      
      onResult?.(committedText + currentSessionFinals, currentInterim);
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
      // COMMIT the finals from this session before the browser restarts the recognizer
      committedText += currentSessionFinals;
      currentSessionFinals = '';
      
      if (active) setTimeout(() => { if (active) spawn(); }, 100); 
    };
    
    try { rec.start(); } catch (e) { console.warn('STT start error', e); }
  };

  return {
    start() {
      active = true; 
      committedText = '';
      currentSessionFinals = '';
      spawn();
      idleTimer = setTimeout(() => {
         if (active && !committedText && !currentSessionFinals) onIdle?.();
      }, idleMs);
    },
    stop() {
      active = false;
      clearTimeout(silenceTimer); 
      clearTimeout(idleTimer);
      try { rec?.stop(); } catch {}
    },
    getText: () => (committedText + currentSessionFinals).trim(),
  };
}