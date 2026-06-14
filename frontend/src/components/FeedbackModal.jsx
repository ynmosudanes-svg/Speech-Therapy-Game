import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle, XCircle } from 'lucide-react';
import Button from './Button';
import { playAudioUrl, playErrorSound, playSuccessSound } from '../utils/soundEffects';

const FeedbackModal = ({ isCorrect, onNext, show, successSound, failSound }) => {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('feedback-modal-open', show);
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('feedback-modal-open');
      }
    };
  }, [show]);

  useEffect(() => {
    if (!show) return;

    if (isCorrect) {
      if (successSound) playAudioUrl(successSound);
      else playSuccessSound();

      const burst = { spread: 68, startVelocity: 26, ticks: 85, gravity: 1.1, zIndex: 1400 };

      confetti({ ...burst, particleCount: 50, origin: { y: 0.65 } });
      const followUp = window.setTimeout(() => {
        confetti({ ...burst, particleCount: 30, angle: 60, origin: { x: 0.15, y: 0.7 } });
        confetti({ ...burst, particleCount: 30, angle: 120, origin: { x: 0.85, y: 0.7 } });
      }, 300);

      return () => {
        window.clearTimeout(followUp);
        confetti.reset();
      };
    }

    if (failSound) playAudioUrl(failSound);
    else playErrorSound();
  }, [show, isCorrect, successSound, failSound]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/55 backdrop-blur-lg z-[1200] flex items-center justify-center p-4">
      <div className="bg-white/97 backdrop-blur-xl rounded-[2.5rem] p-10 max-w-sm w-full text-center shadow-[0_28px_70px_-18px_rgba(15,23,42,0.25)] transform transition-all scale-100 animate-bounce-in border border-white/60 relative overflow-hidden z-[1210]">
        {/* Soft background glow based on status */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-64 opacity-20 blur-3xl rounded-full pointer-events-none ${isCorrect ? 'bg-[#66c8e6]' : 'bg-rose-400'}`}></div>
        
        {isCorrect ? (
          <div className="relative z-10">
            <div className="mx-auto w-32 h-32 bg-gradient-to-br from-[#eefafd] to-white rounded-full flex items-center justify-center mb-6 shadow-inner border border-[#cdeef7]">
              <CheckCircle className="w-16 h-16 text-[#19add6]" strokeWidth={2.5} />
            </div>
            <h2 className="text-4xl font-extrabold text-slate-800 mb-3 tracking-tight">ممتاز!</h2>
            <p className="text-lg text-slate-500 mb-10 font-medium">إجابة صحيحة يا بطل 🌟</p>
            <button 
              onClick={onNext}
              className="w-full bg-gradient-to-r from-[#19add6] to-[#33b9de] text-white text-lg font-bold py-4 rounded-2xl shadow-lg shadow-cyan-200 transition-all active:scale-[0.99]"
            >
              التالي
            </button>
          </div>
        ) : (
          <div className="relative z-10">
            <div className="mx-auto w-32 h-32 bg-gradient-to-br from-rose-100 to-rose-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-rose-100">
              <XCircle className="w-16 h-16 text-rose-500" strokeWidth={2.5} />
            </div>
            <h2 className="text-4xl font-extrabold text-slate-800 mb-3 tracking-tight">حاول تاني!</h2>
            <p className="text-lg text-slate-500 mb-10 font-medium">تقدر تجاوب صح المرة دي 💪</p>
            <button 
              onClick={onNext}
              className="w-full bg-gradient-to-r from-rose-500 to-rose-400 text-white text-lg font-bold py-4 rounded-2xl shadow-lg shadow-rose-200 transition-all active:scale-[0.99]"
            >
              حاول مرة كمان
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
