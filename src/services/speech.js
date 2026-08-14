// Advanced Voice Pipeline with VAD (Voice Activity Detection)

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

export function createAdvancedListener({ onResult, onSpeechStart, onSpeechEnd, onError, silenceMs = 2500 }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;

  let active = false, rec = null, finalText = '';
  let silenceTimer = null;
  let audioContext, analyser, microphone, dataArray, vadLoop;

  const startVAD = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      microphone = audioContext.createMediaStreamSource(stream);
      analyser.fftSize = 512;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      microphone.connect(analyser);

      vadLoop = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        // Calculate average volume (0-255)
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        
        if (avg > 15) { // Threshold for "speaking"
          onSpeechStart?.();
          clearTimeout(silenceTimer);
          silenceTimer = setTimeout(() => onSpeechEnd?.(finalText.trim()), silenceMs);
        }
      }, 100);
    } catch (e) { console.warn('VAD failed', e); }
  };

  const stopVAD = () => {
    clearInterval(vadLoop);
    clearTimeout(silenceTimer);
    if (audioContext) audioContext.close();
  };

  const spawn = () => {
    rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = 'en-US';
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += `${t} `; else interim += t;
      }
      onResult?.(finalText, interim);
    };
    rec.onerror = (e) => { if (e.error !== 'no-speech' && e.error !== 'aborted') onError?.(e.error); };
    rec.onend = () => { if (active) setTimeout(spawn, 100); };
    try { rec.start(); } catch {}
  };

  return {
    start() { active = true; finalText = ''; spawn(); startVAD(); },
    stop() { active = false; rec?.stop(); stopVAD(); },
    getText: () => finalText.trim()
  };
}