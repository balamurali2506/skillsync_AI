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
      if (interruptRef?.current) { window.speechSynthesis.cancel(); clearInterval(checkInterrupt); onEnd?.(); resolve(); }
    }, 100);
    u.onend = () => { clearInterval(checkInterrupt); onEnd?.(); resolve(); };
    u.onerror = () => { clearInterval(checkInterrupt); onEnd?.(); resolve(); };
    window.speechSynthesis.speak(u);
  });
}

export function stopSpeaking() { window.speechSynthesis?.cancel(); }
export const sttSupported = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

export function createListener({ onResult, onSilence, onError, onIdle, silenceMs = 2500, idleMs = 15000 }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;

  let active = false, rec = null;
  let committedText = ''; // Strictly holds finalized text across browser restarts
  let interimText = '';
  let silenceTimer = null, idleTimer = null;

  const armSilence = () => {
    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => { 
      const fullText = committedText.trim();
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
    
    rec.onresult = (e) => {
      clearTimeout(idleTimer);
      let newFinal = '';
      interimText = '';
      
      // CRITICAL FIX: Only read from resultIndex to prevent reading old browser history
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          newFinal += e.results[i][0].transcript;
        } else {
          interimText += e.results[i][0].transcript;
        }
      }
      
      if (newFinal) {
        committedText += newFinal + ' ';
      }
      
      onResult?.(committedText.trim(), interimText.trim());
      armSilence();
    };
    
    rec.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      if (e.error === 'not-allowed') { active = false; onError?.(e.error); return; }
      onError?.(e.error);
    };
    
    rec.onend = () => { 
      if (active) setTimeout(() => { if (active) spawn(); }, 100); 
    };
    
    try { rec.start(); } catch (e) { console.warn('STT start error', e); }
  };

  return {
    start() {
      active = true; 
      committedText = '';
      interimText = '';
      spawn();
      idleTimer = setTimeout(() => { if (active && !committedText) onIdle?.(); }, idleMs);
    },
    stop() {
      active = false;
      clearTimeout(silenceTimer); 
      clearTimeout(idleTimer);
      try { rec?.stop(); } catch {}
    },
    getText: () => committedText.trim(),
  };
}