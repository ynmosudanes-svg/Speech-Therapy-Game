import React, { useEffect, useRef } from 'react';
import lottie from 'lottie-web';
import { AlertTriangle, X } from 'lucide-react';
import sleepingBirdAnimation from '../assets/Animation/sleeping bird.json';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  isDestructive = true,
  position = 'center',
  hideCancelButton = false,
}) => {
  const sleepingBirdRef = useRef(null);

  useEffect(() => {
    if (!isOpen || position !== 'top' || !sleepingBirdRef.current) return undefined;

    const animation = lottie.loadAnimation({
      container: sleepingBirdRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: sleepingBirdAnimation,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid meet',
      },
    });

    return () => {
      animation.destroy();
    };
  }, [isOpen, position]);

  if (!isOpen) return null;

  const containerClassName =
    position === 'top'
      ? 'fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6'
      : 'fixed inset-0 z-50 flex items-center justify-center p-4';

  const modalClassName =
    position === 'top'
      ? 'relative w-full max-w-[30rem] overflow-hidden rounded-[2rem] border border-[#cfe9f8] bg-[linear-gradient(180deg,#f7fdff_0%,#eaf8ff_100%)] p-6 shadow-[0_30px_70px_-30px_rgba(19,122,172,0.28)] font-sans'
      : 'relative bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-fade-in-up font-sans';

  return (
    <div className={containerClassName}>
      <div
        className="absolute inset-0 bg-slate-950/78 backdrop-blur-[4px] transition-opacity animate-fade-in"
        onClick={onClose}
      />

      <div className={modalClassName} dir="rtl">
        <button
          onClick={onClose}
          className={`absolute z-10 flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
            position === 'top'
              ? 'left-4 top-4 text-white/55 hover:bg-white/10 hover:text-white'
              : 'left-3 top-3 text-slate-400 hover:bg-slate-100 hover:text-slate-600 md:top-4 md:left-4'
          }`}
        >
          <X size={20} />
        </button>

        {position === 'top' ? (
          <div className="flex flex-col items-center text-center">
            <div className="mb-5 flex h-28 w-28 items-center justify-center rounded-full bg-white ring-1 ring-[#cfe9f8] shadow-[0_16px_32px_-20px_rgba(19,122,172,0.35)]">
              <div ref={sleepingBirdRef} className="h-28 w-28" />
            </div>

            <h3 className="mb-3 text-[1.6rem] font-black leading-tight text-slate-900 md:text-[1.85rem]">
              {title}
            </h3>

            <p className="mb-6 max-w-[24rem] text-[1.05rem] font-semibold leading-relaxed text-slate-600 md:text-[1.1rem]">
              {message}
            </p>

            <button
              onClick={onConfirm}
              className="w-full rounded-[1rem] bg-[linear-gradient(135deg,#6fd4ff,#2fb1ea)] px-6 py-3.5 text-base font-black text-[#07121a] transition-all shadow-[0_10px_0_#1497ce] hover:brightness-105 active:translate-y-1 active:shadow-[0_5px_0_#1497ce] md:px-8 md:py-4 md:text-lg"
            >
              {confirmText}
            </button>

            {!hideCancelButton && cancelText && (
              <button
                onClick={onClose}
                className="mt-6 text-base font-black text-[#ff6f6f] transition-colors hover:text-[#ff8d8d]"
              >
                {cancelText}
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div
              className={`mb-6 flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-full shadow-inner ${
                isDestructive ? 'bg-red-50 text-red-500' : 'bg-cyan-50 text-[#178bb6]'
              }`}
            >
              <AlertTriangle size={32} strokeWidth={2} />
            </div>

            <h3 className="mb-2 text-2xl font-black text-slate-900">
              {title}
            </h3>

            <p className="mb-8 text-base leading-relaxed text-slate-500">
              {message}
            </p>

            <div className="flex w-full flex-col-reverse items-center gap-2 sm:flex-row sm:justify-center sm:gap-3">
              {!hideCancelButton && cancelText && (
                <button
                  onClick={onClose}
                  className="w-full rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-200 active:scale-95 md:w-auto md:px-6 md:py-3 md:text-base"
                >
                  {cancelText}
                </button>
              )}
              <button
                onClick={onConfirm}
                className={`w-full rounded-[1rem] px-5 py-3 text-sm font-black text-white transition-all active:scale-95 md:w-auto md:px-6 md:text-base ${
                  isDestructive
                    ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30'
                    : 'bg-[#178bb6] hover:bg-[#126d8f] shadow-lg shadow-cyan-500/30'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
        .animate-fade-in-up { animation: fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      ` }} />
    </div>
  );
};

export default ConfirmModal;
