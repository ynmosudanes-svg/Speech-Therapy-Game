import { useEffect } from 'react';
import { playAudioUrl } from '../utils/soundEffects';
import { useTherapySounds } from '../hooks/useTherapySounds';

const FeedbackModal = ({ isCorrect, onNext, show, successSound, failSound }) => {
  const feedbackDelay = isCorrect ? 3000 : 2300;
  const { playCorrect, playWrong } = useTherapySounds({ soundEnabled: true });

  useEffect(() => {
    if (!show) return undefined;

    if (isCorrect) {
      if (successSound) playAudioUrl(successSound);
      else playCorrect();
    } else if (failSound) {
      playAudioUrl(failSound);
    } else {
      playWrong();
    }

    const nextTimer = window.setTimeout(() => {
      onNext?.();
    }, feedbackDelay);

    return () => {
      window.clearTimeout(nextTimer);
    };
  }, [show, isCorrect, onNext, successSound, failSound, feedbackDelay, playCorrect, playWrong]);

  return null;
};

export default FeedbackModal;
