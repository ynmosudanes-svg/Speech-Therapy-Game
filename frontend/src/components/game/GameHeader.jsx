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
    <section className="w-full rounded-[1.2rem] md:rounded-[1.6rem] border border-white/80 bg-white/75 px-3 py-2.5 md:px-4 md:py-3 shadow-[0_14px_30px_-22px_rgba(25,173,214,0.24)] backdrop-blur-xl flex items-center justify-between gap-2 md:gap-3">
      <div className="flex-grow">
        <h2 className="text-sm sm:text-base md:text-2xl font-black text-[#23425a] leading-tight">
          {instruction}
        </h2>
      </div>

      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {onRestart && (
          <button
            onClick={onRestart}
            className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-[0.9rem] md:rounded-[1.1rem] border border-[#cdeef7] bg-[#eefafd] text-[#19add6] flex items-center justify-center hover:bg-[#def6fb] hover:-translate-y-0.5 active:scale-95 transition-all shadow-[0_10px_18px_-12px_rgba(25,173,214,0.26)]"
            title="إعادة اللعب"
          >
            <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        )}
        <button
          onClick={handlePlayAudio}
          className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-[#19add6] rounded-[0.9rem] md:rounded-[1.1rem] border border-[#19add6] flex items-center justify-center hover:bg-[#1599be] hover:-translate-y-0.5 active:scale-95 transition-all shadow-[0_12px_20px_-10px_rgba(25,173,214,0.32)]"
          title="نطق السؤال"
        >
          <Volume2 className="text-white w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>
    </section>
  );
}
