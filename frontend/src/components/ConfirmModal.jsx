import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText, isDestructive = true }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-fade-in" 
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-fade-in-up font-sans" dir="rtl">
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-inner ${isDestructive ? 'bg-red-50 text-red-500' : 'bg-cyan-50 text-[#178bb6]'}`}>
            <AlertTriangle size={32} strokeWidth={2} />
          </div>
          
          <h3 className="text-2xl font-black text-slate-900 mb-2">
            {title}
          </h3>
          
          <p className="text-slate-500 text-base leading-relaxed mb-8">
            {message}
          </p>
          
          <div className="flex items-center justify-center gap-3 w-full sm:flex-row flex-col">
            <button 
              onClick={onConfirm}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-white transition-all active:scale-95 ${isDestructive ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30' : 'bg-[#178bb6] hover:bg-[#126d8f] shadow-lg shadow-cyan-500/30'}`}
            >
              {confirmText}
            </button>
            {cancelText && (
              <button 
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all active:scale-95"
              >
                {cancelText}
              </button>
            )}
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
