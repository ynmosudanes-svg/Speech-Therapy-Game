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
      ? 'fixed inset-0 z-50 flex items-start justify-center p-3 pt-3 md:p-4 md:pt-8'
      : 'fixed inset-0 z-50 flex items-center justify-center p-4';

  const modalClassName =
    position === 'top'
      ? 'relative bg-white rounded-[1.6rem] md:rounded-[2rem] p-4 md:p-5 max-w-2xl w-full shadow-2xl animate-fade-in-up font-sans border border-[#dbe7f3]'
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
        <button 
          onClick={onClose}
          className="absolute top-3 left-3 md:top-4 md:left-4 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X size={20} />
        </button>

        <div className={`flex ${position === 'top' ? 'items-start text-right gap-3 md:gap-5' : 'flex-col items-center text-center'}`}>
          <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center ${position === 'top' ? 'shrink-0 mt-1' : 'mb-6'} shadow-inner ${isDestructive ? 'bg-red-50 text-red-500' : 'bg-cyan-50 text-[#178bb6]'}`}>
            <AlertTriangle size={position === 'top' ? 24 : 32} strokeWidth={2} />
          </div>

          <div className="flex-1">
            <h3 className={`font-black text-slate-900 ${position === 'top' ? 'text-lg md:text-2xl mb-2' : 'text-2xl mb-2'}`}>
              {title}
            </h3>

            <p className={`text-slate-500 leading-relaxed ${position === 'top' ? 'text-sm md:text-base mb-4 md:mb-6' : 'text-base mb-8'}`}>
              {message}
            </p>

            <div className={`flex items-center gap-2 md:gap-3 w-full ${position === 'top' ? 'justify-end sm:flex-row flex-col-reverse' : 'justify-center sm:flex-row flex-col'}`}>
              {!hideCancelButton && cancelText && (
                <button 
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 md:px-6 md:py-3 rounded-xl font-bold text-sm md:text-base text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all active:scale-95"
                >
                  {cancelText}
                </button>
              )}
              <button 
                onClick={onConfirm}
                className={`w-full sm:w-auto px-5 py-2.5 md:px-6 md:py-3 rounded-xl font-bold text-sm md:text-base text-white transition-all active:scale-95 ${isDestructive ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30' : 'bg-[#178bb6] hover:bg-[#126d8f] shadow-lg shadow-cyan-500/30'}`}
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
