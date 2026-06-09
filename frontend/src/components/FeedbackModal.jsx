import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle, XCircle } from 'lucide-react';
import Button from './Button';
import { playAudioUrl, playErrorSound, playSuccessSound } from '../utils/soundEffects';

const FeedbackModal = ({ isCorrect, onNext, show, successSound, failSound }) => {
  useEffect(() => {
    if (!show) return;

    if (isCorrect) {
      if (successSound) playAudioUrl(successSound);
      else playSuccessSound();

      // Trigger confetti
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

      const randomInRange = (min, max) => Math.random() * (max - min) + min;

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults, particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults, particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      return () => clearInterval(interval);
    }

    if (failSound) playAudioUrl(failSound);
    else playErrorSound();
  }, [show, isCorrect, successSound, failSound]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-10 max-w-sm w-full text-center shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] transform transition-all scale-100 animate-bounce-in border border-white/50 relative overflow-hidden">
        {/* Soft background glow based on status */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-64 opacity-20 blur-3xl rounded-full pointer-events-none ${isCorrect ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
        
        {isCorrect ? (
          <div className="relative z-10">
            <div className="mx-auto w-32 h-32 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-emerald-100">
              <CheckCircle className="w-16 h-16 text-emerald-500" strokeWidth={2.5} />
            </div>
            <h2 className="text-4xl font-extrabold text-slate-800 mb-3 tracking-tight">ممتاز!</h2>
            <p className="text-lg text-slate-500 mb-10 font-medium">إجابة صحيحة يا بطل 🌟</p>
            <button 
              onClick={onNext}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-600 hover:to-emerald-500 text-white text-lg font-bold py-4 rounded-2xl shadow-lg shadow-emerald-200 transition-all hover:shadow-xl hover:-translate-y-1 active:translate-y-0"
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
              className="w-full bg-gradient-to-r from-rose-500 to-rose-400 hover:from-rose-600 hover:to-rose-500 text-white text-lg font-bold py-4 rounded-2xl shadow-lg shadow-rose-200 transition-all hover:shadow-xl hover:-translate-y-1 active:translate-y-0"
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
