import React from 'react';
import { Volume2, RefreshCw } from 'lucide-react';
import { playAudioUrl } from '../../utils/soundEffects';

export default function GameHeader({ instruction, instructionAudio = '', onPlayAudio, onRestart }) {
  const handlePlayAudio = () => {
    if (onPlayAudio) {
      onPlayAudio();
      return;
    }
    if (instructionAudio) {
      playAudioUrl(instructionAudio);
    }
  };

  return (
    <section className="w-full bg-white rounded-2xl md:rounded-[2rem] p-4 md:p-6 shadow-sm border border-[#dbe7f3] flex items-center justify-between gap-4">
      {/* نص التعليمات (يمين) */}
      <div className="flex-grow">
        <h2 className="text-xl md:text-3xl font-black text-slate-900 leading-tight">
          {instruction}
        </h2>
      </div>
      
      {/* أزرار التحكم (يسار) */}
      <div className="flex items-center gap-3 shrink-0">
        {onRestart && (
          <button
            onClick={onRestart}
            className="w-12 h-12 md:w-14 md:h-14 bg-rose-500 rounded-full flex items-center justify-center hover:bg-rose-600 hover:scale-105 active:scale-95 transition-all shadow-md shadow-rose-200"
            title="إعادة اللعب"
          >
            <RefreshCw className="text-white w-6 h-6 md:w-7 md:h-7" />
          </button>
        )}
        <button
          onClick={handlePlayAudio}
          className="w-12 h-12 md:w-14 md:h-14 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all shadow-md shadow-blue-200"
          title="نطق السؤال"
        >
          <Volume2 className="text-white w-6 h-6 md:w-7 md:h-7" />
        </button>
      </div>
    </section>
  );
}
