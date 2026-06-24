import React, { useState, useEffect, useRef, useCallback } from 'react';
import FeedbackModal from '../components/FeedbackModal';
import GameHeader from '../components/game/GameHeader';
import { GameContainer, GameSection } from '../components/game/GameUI';
import ChildGameBackdrop from './ChildGameBackdrop';
import GazeCalibration from './components/GazeCalibration';
import { useWebGazer } from '../hooks/useWebGazer';
import { motion } from 'framer-motion';
import lottie from 'lottie-web';
import birdAnimation from '../assets/Animation/Bird.json';

const EyeTrackingBirdGame = ({
  game,
  onComplete,
  previewMode = false,
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [startTime] = useState(() => Date.now());

  // Bird progress from 0 (right) to 100 (left)
  const [birdProgress, setBirdProgress] = useState(0);
  const [isLookingAtBird, setIsLookingAtBird] = useState(false);
  const [inputMode, setInputMode] = useState('mouse'); // 'mouse' | 'gaze'
  const [isCalibrated, setIsCalibrated] = useState(false);
  
  const { isReady, isTracking, gazeData, error, startTracking, stopTracking } = useWebGazer();

  const birdRef = useRef(null);
  const lottieContainerRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());
  const animationFrameRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0 }); // Tracks mouse OR gaze position
  const completedRef = useRef(false);

  const content = game?.config?.content;
  const birdImage = content?.hero?.image || null;

  useEffect(() => {
    if (content?.questionAudio) {
      playAudioUrl(content.questionAudio);
    }
  }, [content]);

  // ---- Setup Lottie Bird Animation ----
  useEffect(() => {
    if (!lottieContainerRef.current) return;

    const anim = lottie.loadAnimation({
      container: lottieContainerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: birdAnimation,
    });
    
    anim.setSpeed(isLookingAtBird ? 1.5 : 0.5); // Fly faster when looking

    return () => anim.destroy();
  }, [isLookingAtBird]);

  // ---- Mouse tracking (always active as fallback) ----
  useEffect(() => {
    // Only use mouse if not tracking with eyes
    if (inputMode === 'gaze') return;
    const handleMouseMove = (e) => {
      pointerRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [inputMode]);

  // Update pointerRef with gazeData if in gaze mode
  useEffect(() => {
    if (inputMode === 'gaze' && gazeData) {
      pointerRef.current = gazeData;
    }
  }, [gazeData, inputMode]);

  // ---- Try to load WebGazer ----
  useEffect(() => {
    if (!previewMode && !isTracking && isReady && !error) {
      // Start tracking with video ON for calibration
      startTracking(true);
    }
  }, [previewMode, isTracking, isReady, error, startTracking]);

  // Skip calibration and fallback to mouse if WebGazer fails
  useEffect(() => {
    if (error && !isCalibrated) {
      console.warn('Eye tracking failed, falling back to mouse:', error);
      setIsCalibrated(true);
    }
  }, [error, isCalibrated]);

  // When calibration completes, switch to gaze mode and hide video
  useEffect(() => {
    if (isCalibrated && window.webgazer) {
      window.webgazer.showVideo(false);
      window.webgazer.showFaceOverlay(false);
      window.webgazer.showFaceFeedbackBox(false);
      setInputMode('gaze');
    }
  }, [isCalibrated]);

  // Cleanup webgazer on unmount
  useEffect(() => {
    return () => {
      stopTracking();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [stopTracking]);

  // ---- Main game loop ----
  useEffect(() => {
    // Do not run game loop if we are in gaze mode but haven't calibrated yet
    if (showFeedback || previewMode || (isTracking && !isCalibrated)) return;

    lastUpdateRef.current = Date.now();

    const loop = () => {
      const now = Date.now();
      const delta = now - lastUpdateRef.current;
      lastUpdateRef.current = now;

      if (birdRef.current && !completedRef.current) {
        const rect = birdRef.current.getBoundingClientRect();
        const padding = 200;
        const ptr = pointerRef.current;

        const isFocused =
          ptr.x >= rect.left - padding &&
          ptr.x <= rect.right + padding &&
          ptr.y >= rect.top - padding &&
          ptr.y <= rect.bottom + padding;

        setIsLookingAtBird(isFocused);

        if (isFocused) {
          setBirdProgress(prev => {
            const next = prev + (12 * (delta / 1000));
            if (next >= 100) {
              completedRef.current = true;
              handleWin();
              return 100;
            }
            return next;
          });
        }
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [showFeedback, previewMode]);

  const handleWin = () => {
    if (showFeedback) return;
    setShowFeedback(true);
  };

  const handleNext = () => {
    setShowFeedback(false);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    onComplete({
      correctAnswers: 1,
      wrongAnswers: 0,
      attempts: [1],
      prompts: ['none'],
      timeSpent,
    });
  };

  const handleRestart = () => {
    setShowFeedback(false);
    setBirdProgress(0);
    completedRef.current = false;
  };

  if (!content) return null;

  return (
    <GameContainer className="max-w-4xl overflow-hidden" dir="rtl">
      <ChildGameBackdrop previewMode={previewMode} />

      {!isCalibrated && !previewMode && (
        <GazeCalibration 
          onComplete={() => setIsCalibrated(true)} 
          isReady={isTracking} 
        />
      )}

      {(!isTracking || isCalibrated || previewMode) && (
        <>
          <GameHeader
            instruction={content.instructionAr || 'انظر إلى العصفور ليطير! 🐦'}
            avatarState={showFeedback ? 'celebration' : 'learning'}
            onPlayAudio={() => {
              if (content?.questionAudio) playAudioUrl(content.questionAudio);
            }}
            onRestart={handleRestart}
          />

      {/* Input Mode Badge */}
      <div className="flex justify-center mb-2">
        <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${
          inputMode === 'gaze'
            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
            : 'bg-sky-100 text-sky-700 border border-sky-200'
        }`}>
          {inputMode === 'gaze' ? '👁️ وضع التتبع بالعين' : '🖱️ وضع الماوس'}
        </span>
      </div>

      <GameSection className="mx-auto w-full max-w-4xl mt-4 relative overflow-hidden rounded-[2.5rem] shadow-2xl border-4 border-sky-100 min-h-[360px] md:min-h-[460px]">
        {/* Background Sky */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-400 via-sky-300 to-sky-100" />

        {/* Sun */}
        <div className="absolute top-6 right-8 w-20 h-20 bg-yellow-300 rounded-full blur-[2px] shadow-[0_0_40px_rgba(253,224,71,0.8)]" />

        {/* Clouds */}
        <motion.div
          className="absolute top-8 opacity-60"
          animate={{ x: [0, 80, 0] }}
          transition={{ repeat: Infinity, duration: 25, ease: 'easeInOut' }}
          style={{ left: '10%' }}
        >
          <div className="w-32 h-12 bg-white rounded-full blur-[1px]" />
          <div className="absolute -top-4 left-4 w-16 h-16 bg-white rounded-full blur-[1px]" />
          <div className="absolute -top-2 left-12 w-12 h-12 bg-white rounded-full blur-[1px]" />
        </motion.div>
        <motion.div
          className="absolute top-20 opacity-50"
          animate={{ x: [0, -60, 0] }}
          transition={{ repeat: Infinity, duration: 20, ease: 'easeInOut' }}
          style={{ left: '60%' }}
        >
          <div className="w-40 h-14 bg-white rounded-full blur-[1px]" />
          <div className="absolute -top-6 left-6 w-20 h-20 bg-white rounded-full blur-[1px]" />
        </motion.div>

        {/* Ground/Mountains */}
        <div className="absolute -bottom-10 -left-10 right-1/2 h-32 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-[100%] opacity-80" />
        <div className="absolute -bottom-8 left-1/3 -right-10 h-40 bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-t-[100%] opacity-90" />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-b-[2rem]" />

        {/* Progress Bar */}
        <div className="absolute top-4 left-4 right-4 h-3 bg-white/50 rounded-full overflow-hidden shadow-inner">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
            style={{ width: `${birdProgress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        {/* The Bird */}
        <div
          ref={birdRef}
          className="absolute top-1/2 -translate-y-1/2"
          style={{
            right: `${5 + (birdProgress * 0.85)}%`,
            transition: 'right 0.1s linear',
            zIndex: 10
          }}
        >
          <motion.div
            animate={isLookingAtBird ? {
              y: [0, -15, 0, -10, 0],
              rotate: [0, -5, 5, -2, 0],
            } : {
              y: 0,
              rotate: 0,
            }}
            transition={isLookingAtBird ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" } : { duration: 0.5 }}
            className="relative cursor-pointer"
          >
            {birdImage ? (
              <img src={birdImage} alt="عصفور" className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-2xl" />
            ) : (
              <div 
                ref={lottieContainerRef} 
                className="w-24 h-24 md:w-32 md:h-32 drop-shadow-2xl scale-x-[-1]" 
                style={{ filter: 'drop-shadow(0px 10px 15px rgba(0,0,0,0.3))' }}
              />
            )}

            {/* Sparkles when flying */}
            {isLookingAtBird && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.6, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="absolute -inset-6 bg-yellow-200/50 rounded-full blur-xl z-[-1]"
                />
                {/* Stars */}
                {[...Array(3)].map((_, i) => (
                  <motion.span
                    key={i}
                    className="absolute text-yellow-300 text-lg"
                    style={{ top: `${-10 + i * 15}px`, left: `${-20 - i * 10}px` }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0.5, 1.2, 0.5],
                      y: [0, -15, -30],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1,
                      delay: i * 0.3,
                    }}
                  >
                    ⭐
                  </motion.span>
                ))}
              </>
            )}

            {/* Paused indicator */}
            {!isLookingAtBird && birdProgress > 0 && birdProgress < 100 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white/90 text-slate-600 text-xs font-bold px-2 py-1 rounded-full shadow whitespace-nowrap"
              >
                💤 بستناك!
              </motion.div>
            )}
          </motion.div>
        </div>
      </GameSection>

        <FeedbackModal
          show={showFeedback}
          isCorrect={true}
          onNext={handleNext}
          successSound={game?.config?.feedback?.successSound}
        />
      </>
    )}
    </GameContainer>
  );
};

export default EyeTrackingBirdGame;
