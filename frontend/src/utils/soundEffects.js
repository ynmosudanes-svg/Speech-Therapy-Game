let audioContext;
let activeGameAudio = null;
let gameAudioPlaying = false;

export const isGameAudioPlaying = () => gameAudioPlaying;

export const stopGameAudio = () => {
  if (activeGameAudio) {
    activeGameAudio.pause();
    activeGameAudio.currentTime = 0;
    activeGameAudio = null;
  }
  gameAudioPlaying = false;

  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

export const silenceSiteAudio = ({ resetTrackedAudio = true } = {}) => {
  if (resetTrackedAudio) {
    stopGameAudio();
  } else if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    gameAudioPlaying = false;
  }

  if (typeof document === 'undefined') return;

  document.querySelectorAll('audio, video').forEach((media) => {
    try {
      media.pause();
      if (resetTrackedAudio && media.tagName.toLowerCase() === 'audio') {
        media.currentTime = 0;
      }
    } catch (error) {
      console.warn('Unable to pause media element:', error);
    }
  });
};

const trackGameAudio = (audio) => {
  activeGameAudio = audio;
  gameAudioPlaying = true;

  const release = () => {
    if (activeGameAudio === audio) {
      activeGameAudio = null;
    }
    gameAudioPlaying = false;
  };

  audio.addEventListener('ended', release, { once: true });
  audio.addEventListener('pause', () => {
    if (audio.ended || audio.currentTime === 0) {
      release();
    }
  });
};

export const SOUND_PRESET_OPTIONS = {
  success: [
    { value: '', label: 'بدون صوت' },
    { value: 'preset:success-voice', label: 'أحسنت' },
    { value: 'preset:success-bells', label: 'جرس' },
  ],
  fail: [
    { value: '', label: 'بدون صوت' },
    { value: 'preset:fail-voice', label: 'تنبيه لطيف' },
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
  gameAudioPlaying = true;
  utterance.onend = () => {
    gameAudioPlaying = false;
  };
  utterance.onerror = () => {
    gameAudioPlaying = false;
  };
  window.speechSynthesis.speak(utterance);
  return true;
};

export const playSpokenArabic = (text) => {
  speakArabicText(text);
};

const playLayeredClip = (src, volume = 0.5) => {
  try {
    const audio = new Audio(src);
    audio.volume = volume;
    audio.play().catch((error) => console.warn('Audio play prevented:', error));
    return audio;
  } catch (error) {
    console.warn('Error preparing audio clip:', error);
    return null;
  }
};

export const playSuccessSound = () => {
  try {
    playLayeredClip('/sounds/clap.mp3', 0.34);
  } catch (error) {
    console.warn('Error playing success sounds:', error);
  }
};

export const playErrorSound = () => {
  try {
    playLayeredClip('/sounds/failbuzz.mp3', 0.22);
  } catch (error) {
    console.warn('Error playing error sounds:', error);
  }
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
      return false;
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
      playFailSoftSound();
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

  if (activeGameAudio) {
    activeGameAudio.pause();
    activeGameAudio = null;
  }

  const audio = new Audio(url);
  trackGameAudio(audio);
  audio.play().catch((error) => {
    console.log('Audio playback error:', error);
    gameAudioPlaying = false;
    activeGameAudio = null;
  });
};
