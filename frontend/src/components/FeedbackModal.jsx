import { useEffect } from 'react';
import { playAudioUrl, playErrorSound, playSuccessSound } from '../utils/soundEffects';

const FeedbackModal = ({ isCorrect, onNext, show, successSound, failSound }) => {
  const feedbackDelay = isCorrect ? 1800 : 2300;

  useEffect(() => {
    if (!show) return undefined;

    if (isCorrect) {
      if (successSound) playAudioUrl(successSound);
      else playSuccessSound();
    } else if (failSound) {
      playAudioUrl(failSound);
    } else {
      playErrorSound();
    }

    const nextTimer = window.setTimeout(() => {
      onNext?.();
    }, feedbackDelay);

    return () => {
      window.clearTimeout(nextTimer);
    };
  }, [show, isCorrect, onNext, successSound, failSound, feedbackDelay]);

  return null;
};

export default FeedbackModal;
