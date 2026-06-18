import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

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
  if (!isOpen) return null;

  const containerClassName =
    position === 'top'
      ? 'fixed inset-0 z-50 flex items-start justify-center p-3 pt-4 md:p-5 md:pt-8'
      : 'fixed inset-0 z-50 flex items-center justify-center p-4';

  const modalClassName =
    position === 'top'
      ? 'relative w-full max-w-[29rem] overflow-hidden rounded-[2rem] border border-[#d9eaf2] bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(247,251,255,0.96))] p-4 md:p-5 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.35)] animate-fade-in-up font-sans backdrop-blur-xl'
      : 'relative bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-fade-in-up font-sans';

  return (
    <div className={containerClassName}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-fade-in" 
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className={modalClassName} dir="rtl">
        {position === 'top' && <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(21,132,195,0.22),transparent)]" />}
        <button 
          onClick={onClose}
          className={`absolute z-10 flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
            position === 'top'
              ? 'left-3 top-3 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
              : 'left-3 top-3 text-slate-400 hover:bg-slate-100 hover:text-slate-600 md:top-4 md:left-4'
          }`}
        >
          <X size={20} />
        </button>

        <div className={`flex ${position === 'top' ? 'items-start text-right gap-3.5 md:gap-4' : 'flex-col items-center text-center'}`}>
          <div className={`flex items-center justify-center rounded-full ${position === 'top' ? 'mt-0.5 h-12 w-12 shrink-0 border border-[#d8edf8] bg-[#eef8fd] text-[#1584C3]' : 'mb-6 h-12 w-12 md:h-16 md:w-16 shadow-inner'} ${position !== 'top' ? (isDestructive ? 'bg-red-50 text-red-500' : 'bg-cyan-50 text-[#178bb6]') : ''}`}>
            <AlertTriangle size={position === 'top' ? 24 : 32} strokeWidth={2} />
          </div>

          <div className="flex-1">
            <h3 className={`font-black text-slate-900 ${position === 'top' ? 'mb-1.5 pr-8 text-xl md:text-[1.65rem] leading-tight text-[#12344d]' : 'text-2xl mb-2'}`}>
              {title}
            </h3>

            <p className={`leading-relaxed ${position === 'top' ? 'mb-4 text-[0.95rem] font-semibold text-slate-500 md:mb-5 md:text-[1rem]' : 'text-base mb-8 text-slate-500'}`}>
              {message}
            </p>

            <div className={`flex items-center gap-2 md:gap-3 w-full ${position === 'top' ? 'justify-end sm:flex-row flex-col-reverse' : 'justify-center sm:flex-row flex-col'}`}>
              {!hideCancelButton && cancelText && (
                <button 
                  onClick={onClose}
                  className="w-full sm:w-auto rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-200 active:scale-95 md:px-6 md:py-3 md:text-base"
                >
                  {cancelText}
                </button>
              )}
              <button 
                onClick={onConfirm}
                className={`w-full sm:w-auto rounded-[1rem] px-5 py-3 text-sm font-black text-white transition-all active:scale-95 md:px-6 md:text-base ${
                  position === 'top'
                    ? 'bg-[linear-gradient(135deg,#1584C3,#1BA3D6)] shadow-[0_14px_28px_-14px_rgba(21,132,195,0.55)] hover:brightness-[0.97]'
                    : isDestructive
                      ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30'
                      : 'bg-[#178bb6] hover:bg-[#126d8f] shadow-lg shadow-cyan-500/30'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
        .animate-fade-in-up { animation: fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}} />
    </div>
  );
};

export default ConfirmModal;
