let audioContext;

export const SOUND_PRESET_OPTIONS = {
  success: [
    { value: '', label: 'بدون صوت' },
    { value: 'preset:success-voice', label: 'أحسنت' },
    { value: 'preset:success-bells', label: 'جرس' },
  ],
  fail: [
    { value: '', label: 'بدون صوت' },
    { value: 'preset:fail-voice', label: 'حاول ثانية' },
    { value: 'preset:fail-buzz', label: 'تنبيه' },
  ],
};

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  return audioContext;
};

const playTone = ({ frequency, duration, type = 'sine', volume = 0.18, delay = 0 }) => {
  const context = getAudioContext();
  if (!context) return;

  const now = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);

  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(volume, now + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
};

const speakArabicText = (text) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) return false;

  const utterance = new SpeechSynthesisUtterance(text);
  const availableVoices = window.speechSynthesis.getVoices();
  const arabicVoice =
    availableVoices.find((voice) => voice.lang?.toLowerCase().startsWith('ar')) || null;

  utterance.lang = arabicVoice?.lang || 'ar';
  if (arabicVoice) {
    utterance.voice = arabicVoice;
  }
  utterance.rate = 0.92;
  utterance.pitch = 1.05;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return true;
};

export const playSuccessSound = () => {
  playTone({ frequency: 523.25, duration: 0.18, type: 'sine', volume: 0.16 });
  playTone({ frequency: 659.25, duration: 0.2, type: 'sine', volume: 0.14, delay: 0.12 });
  playTone({ frequency: 783.99, duration: 0.24, type: 'triangle', volume: 0.12, delay: 0.24 });
};

export const playErrorSound = () => {
  playTone({ frequency: 320, duration: 0.16, type: 'sawtooth', volume: 0.12 });
  playTone({ frequency: 240, duration: 0.22, type: 'sawtooth', volume: 0.1, delay: 0.12 });
};

export const playMoveSound = () => {
  playTone({ frequency: 440, duration: 0.08, type: 'triangle', volume: 0.08 });
};

export const playBoundarySound = () => {
  playTone({ frequency: 280, duration: 0.09, type: 'square', volume: 0.08 });
  playTone({ frequency: 220, duration: 0.1, type: 'square', volume: 0.06, delay: 0.05 });
};

const playSuccessBellsSound = () => {
  playTone({ frequency: 659.25, duration: 0.12, type: 'triangle', volume: 0.12 });
  playTone({ frequency: 783.99, duration: 0.16, type: 'triangle', volume: 0.12, delay: 0.1 });
  playTone({ frequency: 987.77, duration: 0.24, type: 'sine', volume: 0.1, delay: 0.2 });
};

const playSuccessPopSound = () => {
  playTone({ frequency: 440, duration: 0.08, type: 'square', volume: 0.08 });
  playTone({ frequency: 554.37, duration: 0.1, type: 'square', volume: 0.08, delay: 0.08 });
  playTone({ frequency: 880, duration: 0.14, type: 'triangle', volume: 0.1, delay: 0.16 });
};

const playFailSoftSound = () => {
  playTone({ frequency: 294, duration: 0.12, type: 'triangle', volume: 0.08 });
  playTone({ frequency: 247, duration: 0.18, type: 'triangle', volume: 0.08, delay: 0.08 });
};

const playFailBuzzSound = () => {
  playTone({ frequency: 260, duration: 0.12, type: 'sawtooth', volume: 0.1 });
  playTone({ frequency: 210, duration: 0.18, type: 'sawtooth', volume: 0.08, delay: 0.1 });
};

const playFailDropSound = () => {
  playTone({ frequency: 380, duration: 0.08, type: 'square', volume: 0.06 });
  playTone({ frequency: 280, duration: 0.12, type: 'square', volume: 0.08, delay: 0.07 });
  playTone({ frequency: 180, duration: 0.18, type: 'triangle', volume: 0.08, delay: 0.16 });
};

export const playPresetSound = (presetId) => {
  switch (presetId) {
    case 'preset:success-voice':
      speakArabicText('أحسنت');
      return true;
    case 'preset:success-chime':
      playSuccessSound();
      return true;
    case 'preset:success-bells':
      playSuccessBellsSound();
      return true;
    case 'preset:success-pop':
      playSuccessPopSound();
      return true;
    case 'preset:fail-voice':
      speakArabicText('حاول مرة أخرى');
      return true;
    case 'preset:fail-soft':
      playFailSoftSound();
      return true;
    case 'preset:fail-buzz':
      playFailBuzzSound();
      return true;
    case 'preset:fail-drop':
      playFailDropSound();
      return true;
    default:
      return false;
  }
};

export const playAudioUrl = (url) => {
  if (!url || typeof window === 'undefined') return;

  if (playPresetSound(url)) {
    return;
  }

  const audio = new Audio(url);
  audio.play().catch((error) => {
    console.log('Audio playback error:', error);
  });
};
