import { Volume2 } from 'lucide-react';
import { playAudioUrl } from '../../utils/soundEffects';
import EddyAvatar from './EddyAvatar';

export default function GameHeader({
  instruction,
  instructionAudio = '',
  onPlayAudio,
  avatarState = 'learning',
}) {
  const displayInstruction = instruction;

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
        className="mx-auto grid w-full max-w-xl grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5 sm:gap-3 md:gap-4"
        dir="rtl"
      >
        <div
          className={`relative shrink-0 ${
            avatarState === 'celebration'
              ? 'h-[4.6rem] w-[5.2rem] -translate-y-1 sm:h-[5.1rem] sm:w-[5.8rem] sm:-translate-y-2 md:h-[5.6rem] md:w-[6.4rem] md:-translate-y-3'
              : 'h-[4.2rem] w-[4.8rem] sm:h-[4.9rem] sm:w-[5.6rem] md:h-[5.4rem] md:w-[6.2rem]'
          }`}
        >
          <EddyAvatar mode={avatarState} className="h-full w-full" />
          <span className="absolute bottom-1.5 left-1/2 h-2.5 w-12 -translate-x-1/2 rounded-full bg-slate-400/18 blur-[4px]" />
        </div>

        <div className="relative min-w-0">
          <div className="relative rounded-[1.15rem] border-[3px] border-[#c9d8df] bg-white/84 py-2.5 pl-9 pr-3 text-right shadow-[0_18px_34px_-28px_rgba(15,66,92,0.45)] backdrop-blur-xl sm:rounded-[1.35rem] sm:py-3 sm:pl-11 sm:pr-4 md:py-3.5 md:pl-13 md:pr-5">
            <span className="pointer-events-none absolute -right-[9px] top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 border-r-[3px] border-t-[3px] border-[#c9d8df] bg-white/84 sm:-right-[10px] sm:h-5 sm:w-5" />
            <span className="pointer-events-none absolute -right-[6px] top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 bg-white/84 sm:-right-[7px] sm:h-3.5 sm:w-3.5" />

            <button
              onClick={handlePlayAudio}
              className="absolute left-2.5 top-1/2 z-20 flex h-7.5 w-7.5 -translate-y-1/2 items-center justify-center rounded-[0.8rem] border border-[#19add6] bg-[#19add6] shadow-[0_12px_20px_-10px_rgba(25,173,214,0.32)] transition-all hover:-translate-y-[calc(50%+2px)] hover:bg-[#1599be] active:scale-95 sm:left-3 sm:h-8.5 sm:w-8.5 md:left-4 md:h-9.5 md:w-9.5"
              title="تشغيل الصوت"
            >
              <Volume2 className="h-2.5 w-2.5 text-white sm:h-3 sm:w-3" />
            </button>

            <h2 className="relative z-10 text-[1.05rem] font-black leading-snug text-[#23425a] sm:text-[1.1rem] md:text-[1.18rem]">
              {displayInstruction}
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
}
