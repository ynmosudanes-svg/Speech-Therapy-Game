import { useCallback, useMemo } from 'react';
import useSound from 'use-sound';

const SOUND_ASSETS = import.meta.glob('../assets/sounds/*.mp3', { eager: true, import: 'default' });
const SILENT_SOUND =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAABCxAgAEABAAZGF0YQAAAAA=';

const resolveSoundUrl = (fileName) => SOUND_ASSETS[`../assets/sounds/${fileName}`] || SILENT_SOUND;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!getAudioContext.instance) {
    getAudioContext.instance = new AudioContextClass();
  }

  return getAudioContext.instance;
};

const playTone = ({ frequency, duration, type = 'sine', volume = 0.12, delay = 0 }) => {
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

const playTapFallback = () => {
  playTone({ frequency: 660, duration: 0.045, type: 'triangle', volume: 0.1 });
};

const playCorrectFallback = () => {
  playTone({ frequency: 659.25, duration: 0.09, type: 'triangle', volume: 0.16 });
  playTone({ frequency: 783.99, duration: 0.12, type: 'triangle', volume: 0.14, delay: 0.08 });
};

const playWrongFallback = () => {
  playTone({ frequency: 392, duration: 0.1, type: 'sine', volume: 0.12 });
  playTone({ frequency: 311.13, duration: 0.16, type: 'sine', volume: 0.1, delay: 0.08 });
};

const playLevelCompleteFallback = () => {
  playTone({ frequency: 523.25, duration: 0.1, type: 'triangle', volume: 0.15 });
  playTone({ frequency: 659.25, duration: 0.11, type: 'triangle', volume: 0.15, delay: 0.08 });
  playTone({ frequency: 783.99, duration: 0.16, type: 'sine', volume: 0.13, delay: 0.16 });
};

export function useTherapySounds({ soundEnabled = true } = {}) {
  const soundUrls = useMemo(
    () => ({
      tap: resolveSoundUrl('tap.mp3'),
      correct: resolveSoundUrl('correct.mp3'),
      wrong: resolveSoundUrl('wrong.mp3'),
      levelComplete: resolveSoundUrl('level_complete.mp3'),
    }),
    [],
  );

  const [playTap] = useSound(soundUrls.tap, { volume: 0.55, interrupt: true, soundEnabled });
  const [playCorrect] = useSound(soundUrls.correct, { volume: 0.65, interrupt: true, soundEnabled });
  const [playWrong] = useSound(soundUrls.wrong, { volume: 0.55, interrupt: true, soundEnabled });
  const [playLevelComplete] = useSound(soundUrls.levelComplete, {
    volume: 0.7,
    interrupt: true,
    soundEnabled,
  });

  const playTapFeedback = useCallback(() => {
    if (!soundEnabled) return;

    if (soundUrls.tap !== SILENT_SOUND) playTap();
    else playTapFallback();
  }, [playTap, soundEnabled, soundUrls.tap]);

  const playCorrectFeedback = useCallback(() => {
    if (!soundEnabled) return;

    if (soundUrls.correct !== SILENT_SOUND) playCorrect();
    else playCorrectFallback();
  }, [playCorrect, soundEnabled, soundUrls.correct]);

  const playWrongFeedback = useCallback(() => {
    if (!soundEnabled) return;

    if (soundUrls.wrong !== SILENT_SOUND) playWrong();
    else playWrongFallback();
  }, [playWrong, soundEnabled, soundUrls.wrong]);

  const playLevelCompleteFeedback = useCallback(() => {
    if (!soundEnabled) return;

    if (soundUrls.levelComplete !== SILENT_SOUND) playLevelComplete();
    else playLevelCompleteFallback();
  }, [playLevelComplete, soundEnabled, soundUrls.levelComplete]);

  return {
    playTap: playTapFeedback,
    playCorrect: playCorrectFeedback,
    playWrong: playWrongFeedback,
    playLevelComplete: playLevelCompleteFeedback,
  };
}

export default useTherapySounds;
