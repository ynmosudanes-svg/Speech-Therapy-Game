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
    <section className="w-full rounded-[1.45rem] md:rounded-[2.25rem] border border-white/80 bg-white/75 px-4 py-3 md:p-5 shadow-[0_18px_40px_-24px_rgba(25,173,214,0.26)] backdrop-blur-xl flex items-center justify-between gap-3 md:gap-4">
      <div className="flex-grow">
        <h2 className="text-base sm:text-lg md:text-3xl font-black text-[#23425a] leading-tight">
          {instruction}
        </h2>
      </div>

      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {onRestart && (
          <button
            onClick={onRestart}
            className="w-10 h-10 sm:w-11 sm:h-11 md:w-14 md:h-14 rounded-[0.95rem] md:rounded-[1.25rem] border border-[#cdeef7] bg-[#eefafd] text-[#19add6] flex items-center justify-center hover:bg-[#def6fb] hover:-translate-y-0.5 active:scale-95 transition-all shadow-[0_12px_22px_-14px_rgba(25,173,214,0.28)]"
            title="إعادة اللعب"
          >
            <RefreshCw className="w-5 h-5 md:w-7 md:h-7" />
          </button>
        )}
        <button
          onClick={handlePlayAudio}
          className="w-10 h-10 sm:w-11 sm:h-11 md:w-14 md:h-14 bg-[#19add6] rounded-[0.95rem] md:rounded-[1.25rem] border border-[#19add6] flex items-center justify-center hover:bg-[#1599be] hover:-translate-y-0.5 active:scale-95 transition-all shadow-[0_14px_24px_-10px_rgba(25,173,214,0.35)]"
          title="نطق السؤال"
        >
          <Volume2 className="text-white w-5 h-5 md:w-7 md:h-7" />
        </button>
      </div>
    </section>
  );
}
