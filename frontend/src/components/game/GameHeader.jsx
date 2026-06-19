import React, { useEffect, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { playAudioUrl } from '../../utils/soundEffects';
import EddyAvatar from './EddyAvatar';

export default function GameHeader({
  instruction,
  instructionAudio = '',
  onPlayAudio,
  avatarState = 'learning',
}) {
  const [bubbleVisible, setBubbleVisible] = useState(false);

  useEffect(() => {
    setBubbleVisible(false);
    const timer = window.setTimeout(() => setBubbleVisible(true), 40);
    return () => window.clearTimeout(timer);
  }, [instruction, avatarState]);

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
    <section className="w-full py-2 md:py-3">
      <div
        className="mx-auto grid w-full max-w-2xl grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:gap-4 md:gap-5"
        dir="rtl"
      >
        <div
          className={`relative shrink-0 ${
            avatarState === 'celebration'
              ? 'h-[5.9rem] w-[5.9rem] -translate-y-2 sm:h-[6.4rem] sm:w-[6.4rem] sm:-translate-y-3 md:h-[6.8rem] md:w-[6.8rem] md:-translate-y-4'
              : 'h-[5.5rem] w-[5.5rem] sm:h-[6.25rem] sm:w-[6.25rem] md:h-[7rem] md:w-[7rem]'
          }`}
        >
          <EddyAvatar mode={avatarState} className="h-full w-full" />
          <span className="absolute bottom-2 left-1/2 h-3 w-16 -translate-x-1/2 rounded-full bg-slate-400/18 blur-[4px]" />
        </div>

        <div className="relative min-w-0">
          <div
            className={`relative rounded-[1.45rem] border-[3px] border-[#c9d8df] bg-white/84 py-3.5 pl-12 pr-4 text-right shadow-[0_18px_34px_-28px_rgba(15,66,92,0.45)] backdrop-blur-xl transition-all duration-500 ease-out sm:rounded-[1.65rem] sm:py-4 sm:pl-14 sm:pr-5 md:py-5 md:pl-16 md:pr-6 ${
              bubbleVisible ? 'translate-x-0 opacity-100' : 'translate-x-3 opacity-0'
            }`}
          >
            <span className="pointer-events-none absolute -right-[10px] top-1/2 h-5 w-5 -translate-y-1/2 rotate-45 border-r-[3px] border-t-[3px] border-[#c9d8df] bg-white/84 sm:-right-[12px] sm:h-6 sm:w-6" />
            <span className="pointer-events-none absolute -right-[7px] top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-45 bg-white/84 sm:-right-[8px] sm:h-4 sm:w-4" />

            <button
              onClick={handlePlayAudio}
              className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[0.9rem] border border-[#19add6] bg-[#19add6] shadow-[0_12px_20px_-10px_rgba(25,173,214,0.32)] transition-all hover:-translate-y-[calc(50%+2px)] hover:bg-[#1599be] active:scale-95 sm:h-10 sm:w-10 md:left-4"
              title="ظ†ط·ظ‚ ط§ظ„ط³ط¤ط§ظ„"
            >
              <Volume2 className="h-3.5 w-3.5 text-white sm:h-4 sm:w-4" />
            </button>

            <h2 className="relative z-10 text-base font-black leading-snug text-[#23425a] sm:text-xl md:text-[1.55rem]">
              {instruction}
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
}
