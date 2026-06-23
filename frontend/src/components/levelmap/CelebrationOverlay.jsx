import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import lottie from 'lottie-web';
import celebrationAnimationData from '../../assets/Animation/Celebration.json';
import chickAnimationData from '../../assets/Animation/Reading (1).json';

/**
 * Floating star element for celebration background.
 */
const FloatingStar = ({ delay, x, size, duration }) => (
  <motion.div
    initial={{ y: '110vh', x, opacity: 0, rotate: 0, scale: 0.5 }}
    animate={{
      y: '-20vh',
      opacity: [0, 1, 1, 0.8, 0],
      rotate: [0, 45, -30, 60, 0],
      scale: [0.5, 1.2, 1, 1.1, 0.8],
    }}
    transition={{
      duration: duration || 3.5,
      delay,
      ease: 'easeOut',
    }}
    className="pointer-events-none absolute z-10"
    aria-hidden="true"
  >
    <Star size={size || 24} className="text-amber-400" fill="currentColor" />
  </motion.div>
);

/**
 * Full-screen celebration overlay shown when a group is completed.
 *
 * Props:
 *  - isOpen: boolean
 *  - groupTitle: string
 *  - onClose: () => void
 */
const CelebrationOverlay = ({ isOpen, groupTitle, onClose }) => {
  const celebrationLottieRef = useRef(null);
  const chickLottieRef = useRef(null);
  const [showButton, setShowButton] = useState(false);
  const confettiFiredRef = useRef(false);

  // Fire confetti when overlay opens
  useEffect(() => {
    if (!isOpen || confettiFiredRef.current) return;
    confettiFiredRef.current = true;

    const end = Date.now() + 2500;

    const fireConfetti = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 65,
        origin: { x: 0, y: 0.7 },
        colors: ['#34d399', '#fbbf24', '#60a5fa', '#f472b6', '#a78bfa'],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 65,
        origin: { x: 1, y: 0.7 },
        colors: ['#34d399', '#fbbf24', '#60a5fa', '#f472b6', '#a78bfa'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(fireConfetti);
      }
    };

    // Initial burst
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { x: 0.5, y: 0.5 },
      colors: ['#34d399', '#fbbf24', '#60a5fa', '#f472b6', '#a78bfa', '#fb923c'],
    });

    requestAnimationFrame(fireConfetti);
  }, [isOpen]);

  // Load celebration Lottie
  useEffect(() => {
    if (!isOpen || !celebrationLottieRef.current) return undefined;

    const instance = lottie.loadAnimation({
      container: celebrationLottieRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: celebrationAnimationData,
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
    });

    return () => instance.destroy();
  }, [isOpen]);

  // Load chick Lottie
  useEffect(() => {
    if (!isOpen || !chickLottieRef.current) return undefined;

    const instance = lottie.loadAnimation({
      container: chickLottieRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: chickAnimationData,
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
    });

    return () => instance.destroy();
  }, [isOpen]);

  // Show continue button after delay
  useEffect(() => {
    if (!isOpen) {
      setShowButton(false);
      confettiFiredRef.current = false;
      return undefined;
    }

    const timer = setTimeout(() => setShowButton(true), 2500);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Floating stars config
  const stars = [
    { delay: 0.2, x: '10%', size: 18, duration: 3.2 },
    { delay: 0.5, x: '25%', size: 24, duration: 3.8 },
    { delay: 0.8, x: '45%', size: 16, duration: 3 },
    { delay: 1.0, x: '65%', size: 22, duration: 3.5 },
    { delay: 1.3, x: '80%', size: 20, duration: 3.3 },
    { delay: 0.3, x: '35%', size: 14, duration: 4 },
    { delay: 0.7, x: '55%', size: 26, duration: 3.6 },
    { delay: 1.1, x: '90%', size: 16, duration: 3.1 },
    { delay: 0.6, x: '15%', size: 20, duration: 3.7 },
    { delay: 1.5, x: '72%', size: 18, duration: 3.4 },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden"
          style={{ backdropFilter: 'blur(12px)' }}
        >
          {/* Background overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#073B5C]/80 via-[#0B7FBD]/70 to-[#168FC7]/80" />

          {/* Floating stars */}
          {stars.map((star, i) => (
            <FloatingStar key={`star-${i}`} {...star} />
          ))}

          {/* Celebration content */}
          <motion.div
            initial={{ scale: 0.5, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 30, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 18,
              delay: 0.15,
            }}
            className="relative z-20 flex max-w-lg flex-col items-center gap-4 px-6 text-center sm:gap-5"
          >
            {/* Celebration Lottie animation */}
            <div className="relative h-28 w-28 sm:h-36 sm:w-36">
              <div className="absolute inset-0 rounded-full bg-white/15 blur-2xl" />
              <div ref={celebrationLottieRef} className="relative z-10 h-full w-full" />
            </div>

            {/* "Great Job!" message */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="mb-2 text-3xl font-black text-white drop-shadow-lg sm:text-4xl md:text-5xl">
                !أحسنت يا بطل 🎉
              </h2>
              <p className="text-base font-bold text-white/90 drop-shadow-sm sm:text-lg">
                أكملت جميع ألعاب <span className="text-amber-300">{groupTitle}</span> بنجاح!
              </p>
            </motion.div>

            {/* Reward badge */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 250, damping: 15, delay: 0.8 }}
              className="relative"
            >
              <div className="levelmap-shimmer grid h-20 w-20 place-items-center rounded-[1.4rem] border-4 border-amber-300/80 bg-gradient-to-br from-amber-400 to-amber-500 shadow-[0_8px_24px_rgba(245,158,11,0.35)] sm:h-24 sm:w-24">
                <Award size={40} className="text-white drop-shadow-md" strokeWidth={2.5} />
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -inset-2 rounded-[1.8rem] border-2 border-amber-300/30"
              />
            </motion.div>

            {/* Continue button (appears after delay) */}
            <AnimatePresence>
              {showButton && (
                <motion.button
                  initial={{ opacity: 0, y: 15, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  onClick={onClose}
                  className="mt-2 inline-flex items-center gap-2 rounded-2xl border-2 border-white/30 bg-white px-8 py-3.5 text-base font-black text-[#0B7FBD] shadow-[0_12px_28px_rgba(7,59,92,0.18)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(7,59,92,0.24)] active:scale-95 sm:text-lg"
                >
                  استمر للمجموعة التالية 🚀
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CelebrationOverlay;
