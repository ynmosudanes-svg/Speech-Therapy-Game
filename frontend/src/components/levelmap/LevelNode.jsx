import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Lock, Check, Sparkles } from 'lucide-react';
import lottie from 'lottie-web';
import chickAnimation from '../../assets/Animation/Reading (1).json';

/**
 * Chick mascot that floats near the current level.
 */
const BirdMascot = () => {
  const mascotRef = useRef(null);

  useEffect(() => {
    if (!mascotRef.current) return undefined;

    const instance = lottie.loadAnimation({
      container: mascotRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: chickAnimation,
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
    });

    return () => instance.destroy();
  }, []);

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, y: [0, -6, 0] }}
      transition={{
        scale: { type: 'spring', stiffness: 260, damping: 20, delay: 0.3 },
        opacity: { duration: 0.3, delay: 0.3 },
        y: { duration: 2.6, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' },
      }}
      className="pointer-events-none absolute -right-14 top-1/2 z-20 h-12 w-12 -translate-y-1/2 sm:-right-16 sm:h-14 sm:w-14 md:-right-[4.5rem] md:h-16 md:w-16"
      aria-hidden="true"
    >
      <div className="absolute -bottom-1 left-1/2 h-3 w-8 -translate-x-1/2 rounded-full bg-[#b9d6df]/50 blur-md" />
      <div ref={mascotRef} className="relative z-10 h-full w-full drop-shadow-[0_10px_14px_rgba(15,111,166,0.16)]" />
    </motion.div>
  );
};

/**
 * Sparkle decorations around the current level node.
 */
const CurrentSparkles = () => (
  <>
    <motion.div
      animate={{ rotate: [0, 15, -10, 0], scale: [1, 1.2, 0.9, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      className="pointer-events-none absolute -left-3 -top-1"
    >
      <Sparkles size={14} className="text-amber-400" fill="currentColor" />
    </motion.div>
    <motion.div
      animate={{ rotate: [0, -12, 8, 0], scale: [0.9, 1.15, 1, 0.9] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      className="pointer-events-none absolute -right-3 top-2"
    >
      <Sparkles size={11} className="text-cyan-400" fill="currentColor" />
    </motion.div>
    <motion.div
      animate={{ rotate: [0, 10, -15, 0], scale: [1, 0.85, 1.1, 1] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      className="pointer-events-none absolute -bottom-2 left-0"
    >
      <Sparkles size={12} className="text-cyan-300" fill="currentColor" />
    </motion.div>
    <motion.div
      animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
      className="pointer-events-none absolute -right-2 bottom-1"
    >
      <Sparkles size={9} className="text-amber-300" fill="currentColor" />
    </motion.div>
  </>
);

// Zigzag offsets — short pattern within a group (NOT long zigzag)
const ZIGZAG_OFFSETS = [
  'mr-auto ml-[8%] sm:ml-[12%]',          // left-ish
  'ml-auto mr-[8%] sm:mr-[12%]',          // right-ish
  'mx-auto',                                // center
  'ml-auto mr-[16%] sm:mr-[20%]',          // right-ish deeper
];

/**
 * A single level node in the progression map.
 *
 * Props:
 *  - data: game object
 *  - status: 'done' | 'current' | 'locked'
 *  - displayIndex: position in the group (used for zigzag)
 *  - levelNumber: display number (1-based within the group)
 *  - nodeRef: ref callback for path calculation
 *  - onClick: click handler
 *  - getGameTitle: function to get game title
 */
const LevelNode = ({ data, status, displayIndex, levelNumber, nodeRef, onClick, getGameTitle }) => {
  const title = getGameTitle(data);
  const isCurrent = status === 'current';
  const isDone = status === 'done';
  const isLocked = status === 'locked';

  const offsetClass = ZIGZAG_OFFSETS[displayIndex % ZIGZAG_OFFSETS.length];

  return (
    <motion.div
      id={isCurrent ? 'current-level-node' : undefined}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration: 0.4,
        delay: Math.min(displayIndex * 0.06, 0.3),
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={`relative flex w-fit ${offsetClass}`}
    >
      <motion.button
        type="button"
        disabled={isLocked}
        onClick={isLocked ? undefined : onClick}
        whileHover={isLocked ? undefined : { scale: isCurrent ? 1.06 : 1.04, y: -3 }}
        whileTap={isLocked ? undefined : { scale: 0.95 }}
        className="group relative z-10 flex flex-col items-center gap-1.5 outline-none disabled:cursor-not-allowed"
        aria-label={isLocked ? `${title} مقفلة` : `ابدأ ${title}`}
      >
        {/* "Start!" label above current level */}
        {isCurrent && (
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-9 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-2xl border border-[#b8deec] bg-white px-4 py-1 text-xs font-black text-[#168FC7] shadow-[0_8px_16px_-8px_rgba(15,111,166,0.35)]"
          >
            ابدأ! 🎯
            <span className="absolute -bottom-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r border-[#b8deec] bg-white" />
          </motion.span>
        )}

        {/* Main circle */}
        <span
          ref={nodeRef}
          className={`relative grid place-items-center rounded-full transition-all duration-300 ${
            isCurrent
              ? 'h-[4.8rem] w-[4.8rem] sm:h-[5.2rem] sm:w-[5.2rem] shadow-[0_0_0_8px_rgba(22,143,199,0.1),0_0_24px_rgba(34,199,232,0.25),0_6px_0_#b9e2ef]'
              : isDone
                ? 'h-[3.8rem] w-[3.8rem] sm:h-[4rem] sm:w-[4rem] shadow-[0_4px_0_#b8ead7,0_8px_16px_-10px_rgba(20,184,129,0.2)]'
                : 'h-[3.5rem] w-[3.5rem] sm:h-[3.8rem] sm:w-[3.8rem] shadow-[0_4px_0_#d2e0e6,0_8px_16px_-10px_rgba(15,111,166,0.15)]'
          }`}
        >
          {/* Sparkles for current */}
          {isCurrent && <CurrentSparkles />}

          {/* Pulse ring for current */}
          {isCurrent && (
            <span className="absolute inset-0 animate-ping rounded-full bg-[#168FC7]/10" style={{ animationDuration: '2s' }} />
          )}

          {/* Inner circle with icon */}
          <span
            className={`grid place-items-center rounded-full border-[3.5px] transition-all duration-300 ${
              isCurrent
                ? 'h-[3.8rem] w-[3.8rem] sm:h-[4.2rem] sm:w-[4.2rem] border-[#a7e9fb] bg-[linear-gradient(160deg,#22c7e8,#168FC7)] text-white shadow-[inset_0_-4px_0_rgba(15,111,166,0.35)]'
                : isDone
                  ? 'h-[3rem] w-[3rem] sm:h-[3.2rem] sm:w-[3.2rem] border-[#b9f3dc] bg-[linear-gradient(160deg,#34d399,#10b981)] text-white shadow-[inset_0_-3px_0_rgba(9,120,83,0.25)]'
                  : 'h-[2.8rem] w-[2.8rem] sm:h-[3rem] sm:w-[3rem] border-[#d6e3e9] bg-[linear-gradient(160deg,#cbd5e1,#94a3b8)] text-white/70 shadow-[inset_0_-3px_0_rgba(80,105,116,0.2)]'
            }`}
          >
            {isCurrent ? (
              <Play size={22} fill="currentColor" className="translate-x-[1px]" />
            ) : isDone ? (
              <Check size={22} strokeWidth={3.5} />
            ) : (
              <Lock size={17} />
            )}
          </span>

          {/* Green check badge for completed */}
          {isDone && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.2 }}
              className="absolute -right-1 -top-1 z-10 grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-emerald-500 shadow-md sm:h-6 sm:w-6"
            >
              <Check size={12} strokeWidth={3} className="text-white" />
            </motion.span>
          )}

          {/* Lock badge for locked */}
          {isLocked && (
            <span className="absolute -right-0.5 -top-0.5 z-10 grid h-4.5 w-4.5 place-items-center rounded-full border-2 border-white bg-slate-400 shadow-sm sm:h-5 sm:w-5">
              <Lock size={10} className="text-white" />
            </span>
          )}
        </span>

        {/* Level number */}
        <span
          className={`text-[0.65rem] font-black transition-colors sm:text-xs ${
            isCurrent
              ? 'text-[#168FC7]'
              : isDone
                ? 'text-emerald-600'
                : 'text-slate-400'
          }`}
        >
          {levelNumber}
        </span>

        {/* Tooltip on hover (desktop only) */}
        <span className="pointer-events-none absolute bottom-[calc(100%+2.5rem)] left-1/2 hidden -translate-x-1/2 scale-90 whitespace-nowrap rounded-xl border border-[#dbe7f3] bg-white/95 px-4 py-2 opacity-0 shadow-lg transition-all duration-200 group-hover:scale-100 group-hover:opacity-100 sm:block">
          <span className={`block text-xs font-black ${isDone ? 'text-emerald-600' : isCurrent ? 'text-[#168FC7]' : 'text-slate-500'}`}>
            {title}
          </span>
        </span>

        {/* Mascot for current level */}
        {isCurrent && <BirdMascot />}
      </motion.button>
    </motion.div>
  );
};

export default LevelNode;
