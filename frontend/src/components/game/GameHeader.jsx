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
    <section className="w-full rounded-[1.45rem] md:rounded-[2.25rem] border border-white/80 bg-white/75 px-4 py-3 md:p-5 shadow-[0_18px_40px_-24px_rgba(99,102,241,0.55)] backdrop-blur-xl flex items-center justify-between gap-3 md:gap-4">
      <div className="flex-grow">
        <h2 className="text-base sm:text-lg md:text-3xl font-black text-indigo-950 leading-tight">
          {instruction}
        </h2>
      </div>

      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {onRestart && (
          <button
            onClick={onRestart}
            className="w-10 h-10 sm:w-11 sm:h-11 md:w-14 md:h-14 bg-pink-500 rounded-[0.95rem] md:rounded-[1.25rem] flex items-center justify-center hover:bg-pink-600 hover:-translate-y-0.5 active:scale-95 transition-all shadow-[0_14px_24px_-10px_rgba(236,72,153,0.65)]"
            title="إعادة اللعب"
          >
            <RefreshCw className="text-white w-5 h-5 md:w-7 md:h-7" />
          </button>
        )}
        <button
          onClick={handlePlayAudio}
          className="w-10 h-10 sm:w-11 sm:h-11 md:w-14 md:h-14 bg-indigo-500 rounded-[0.95rem] md:rounded-[1.25rem] flex items-center justify-center hover:bg-indigo-600 hover:-translate-y-0.5 active:scale-95 transition-all shadow-[0_14px_24px_-10px_rgba(99,102,241,0.7)]"
          title="نطق السؤال"
        >
          <Volume2 className="text-white w-5 h-5 md:w-7 md:h-7" />
        </button>
      </div>
    </section>
  );
}
