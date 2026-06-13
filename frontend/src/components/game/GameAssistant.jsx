import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { X } from 'lucide-react';
import useSpeechSynthesis from '../../hooks/useSpeechSynthesis';
import { isGameAudioPlaying } from '../../utils/soundEffects';

/* ──────────────────────────────────────────────
   Help level definitions
   ────────────────────────────────────────────── */
const HELP_LEVELS = [
  {
    key: 'visual',
    label: 'تلميح بصري',
    description: 'انتبه جيداً! الإجابة الصحيحة تضيء الآن.',
    bubbleBg: 'bg-white',
    bubbleText: 'text-indigo-800',
    bubbleBorder: 'border-indigo-200',
    pointerBg: 'bg-white',
    pointerBorder: 'border-indigo-200',
    badgeColor: 'bg-indigo-500',
    dotActive: 'bg-indigo-500',
    dotInactive: 'bg-indigo-100',
  },
  {
    key: 'gesture',
    label: 'تلميح إيمائي',
    description: 'انظر إلى الشاشة، أنا أشير إلى المكان الصحيح.',
    bubbleBg: 'bg-indigo-50',
    bubbleText: 'text-indigo-900',
    bubbleBorder: 'border-indigo-300',
    pointerBg: 'bg-indigo-50',
    pointerBorder: 'border-indigo-300',
    badgeColor: 'bg-indigo-600',
    dotActive: 'bg-indigo-600',
    dotInactive: 'bg-indigo-200',
  },
  {
    key: 'verbal',
    label: 'تلميح لفظي',
    description: 'استمع إلي جيداً... سأخبرك بأول حرف لتسهيل المهمة.',
    bubbleBg: 'bg-blue-50',
    bubbleText: 'text-blue-900',
    bubbleBorder: 'border-blue-300',
    pointerBg: 'bg-blue-50',
    pointerBorder: 'border-blue-300',
    badgeColor: 'bg-blue-600',
    dotActive: 'bg-blue-600',
    dotInactive: 'bg-blue-200',
  },
  {
    key: 'physical',
    label: 'مساعدة جسدية',
    description: 'هيا بنا نضع أيدينا معاً ونختار الإجابة الصحيحة.',
    bubbleBg: 'bg-cyan-50',
    bubbleText: 'text-cyan-900',
    bubbleBorder: 'border-cyan-300',
    pointerBg: 'bg-cyan-50',
    pointerBorder: 'border-cyan-300',
    badgeColor: 'bg-cyan-600',
    dotActive: 'bg-cyan-600',
    dotInactive: 'bg-cyan-200',
  },
];

/* ──────────────────────────────────────────────
   Speech therapist avatar (Image)
   ────────────────────────────────────────────── */
const TherapistAvatar = ({ className = "" }) => (
  <img 
    src="/assistant.jpg" 
    alt="المساعدة" 
    className={`drop-shadow-md w-full h-full rounded-full object-cover ${className}`}
  />
);

import Draggable from 'react-draggable';

/* ──────────────────────────────────────────────
   GameAssistant Component
   ────────────────────────────────────────────── */
const GameAssistant = forwardRef(function GameAssistant(
  {
    idleTime = 7000,
    onVisualHint,
    onGestureHint,
    onVerbalHint,
    onPhysicalPrompt,
    autoEscalate = true,
    voiceEnabled = false,
  },
  ref
) {
  const [currentLevel, setCurrentLevel] = useState(0);
  const currentLevelRef = useRef(0);
  const [visible, setVisible] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [isAnimatingState, setIsAnimating] = useState(false);
  const helpsUsedRef = useRef([]);
  const idleTimerRef = useRef(null);
  const disabledRef = useRef(false);
  const { speak, cancel } = useSpeechSynthesis();
  
  const nodeRef = useRef(null);
  const pointerDownPosRef = useRef(null);

  const callbackMapRef = useRef({
    visual: onVisualHint,
    gesture: onGestureHint,
    verbal: onVerbalHint,
    physical: onPhysicalPrompt,
  });

  useEffect(() => {
    callbackMapRef.current = {
      visual: onVisualHint,
      gesture: onGestureHint,
      verbal: onVerbalHint,
      physical: onPhysicalPrompt,
    };
  }, [onVisualHint, onGestureHint, onVerbalHint, onPhysicalPrompt]);

  const triggerAnimation = () => {
    setIsAnimating(true);
    window.setTimeout(() => setIsAnimating(false), 600);
  };

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const advanceHelp = useCallback(() => {
    if (disabledRef.current) return;

    if (isGameAudioPlaying()) {
      clearIdleTimer();
      idleTimerRef.current = window.setTimeout(advanceHelp, 500);
      return;
    }

    if (currentLevelRef.current >= HELP_LEVELS.length) return;
    const nextLevel = currentLevelRef.current + 1;
    currentLevelRef.current = nextLevel;
    setCurrentLevel(nextLevel);
    setPanelOpen(true);
    triggerAnimation();

    const helpDef = HELP_LEVELS[nextLevel - 1];
    if (helpDef) {
      helpsUsedRef.current.push(helpDef.key);
      const callback = callbackMapRef.current[helpDef.key];
      callback?.();
      
      if (voiceEnabled && helpDef.description) {
        speak(helpDef.description);
      }
    }

    if (autoEscalate && nextLevel < HELP_LEVELS.length) {
      clearIdleTimer();
      idleTimerRef.current = window.setTimeout(advanceHelp, 15000);
    }
  }, [autoEscalate, speak, clearIdleTimer, voiceEnabled]);

  const startIdleTimer = useCallback(() => {
    clearIdleTimer();
    if (idleTime <= 0) return;

    idleTimerRef.current = window.setTimeout(() => {
      setVisible(true);
      if (autoEscalate) {
         advanceHelp();
      } else {
         setCurrentLevel(0);
         currentLevelRef.current = 0;
         setPanelOpen(false);
      }
    }, idleTime);
  }, [clearIdleTimer, idleTime, autoEscalate, advanceHelp]);

  const stopAssistant = useCallback(() => {
    disabledRef.current = true;
    clearIdleTimer();
    setCurrentLevel(0);
    currentLevelRef.current = 0;
    setVisible(false);
    setPanelOpen(false);
    setIsAnimating(false);
    helpsUsedRef.current = [];
    cancel();
  }, [clearIdleTimer, cancel]);

  const pauseAssistant = useCallback(() => {
    if (disabledRef.current) return;
    clearIdleTimer();
    cancel();
    setPanelOpen(false);
    startIdleTimer();
  }, [clearIdleTimer, cancel, startIdleTimer]);

  const resetAssistant = useCallback(() => {
    disabledRef.current = false;
    clearIdleTimer();
    setCurrentLevel(0);
    currentLevelRef.current = 0;
    setVisible(false);
    setPanelOpen(false);
    setIsAnimating(false);
    helpsUsedRef.current = [];
    cancel();
    startIdleTimer();
  }, [clearIdleTimer, startIdleTimer, cancel]);

  useImperativeHandle(ref, () => ({
    resetAssistant,
    pauseAssistant,
    stopAssistant,
    getHelpsUsed: () => [...helpsUsedRef.current],
    getHelpCount: () => helpsUsedRef.current.length,
  }));

  useEffect(() => {
    resetAssistant();

    const handleHide = () => {
      pauseAssistant();
    };

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) handleHide();
      else if (!disabledRef.current) startIdleTimer();
    });
    window.addEventListener("blur", handleHide);

    return () => {
      stopAssistant();
      document.removeEventListener("visibilitychange", handleHide);
      window.removeEventListener("blur", handleHide);
    };
  }, [idleTime, autoEscalate, clearIdleTimer, resetAssistant, pauseAssistant, stopAssistant, startIdleTimer]);

  const handlePointerDown = (e) => {
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleButtonClick = (e) => {
    if (pointerDownPosRef.current) {
      const dist = Math.sqrt(
        Math.pow(e.clientX - pointerDownPosRef.current.x, 2) + 
        Math.pow(e.clientY - pointerDownPosRef.current.y, 2)
      );
      if (dist > 5) return; // Prevent click if dragged more than 5px
    }
    
    // If autoEscalate is true and it's already running, clicking could pause or just show/hide the panel
    // We'll just let them toggle the panel or manually advance
    if (panelOpen) {
      if (currentLevel < HELP_LEVELS.length) {
        advanceHelp();
      } else {
        setPanelOpen(false);
        cancel();
      }
    } else if (currentLevel === 0) {
      advanceHelp();
    } else {
      setPanelOpen(true);
      const currentDef = HELP_LEVELS[currentLevel - 1];
      if (voiceEnabled && currentDef?.description) {
        speak(currentDef.description);
      }
    }
  };

  const activeLevelDef = currentLevel > 0 ? HELP_LEVELS[currentLevel - 1] : null;
  const hasNextLevel = currentLevel < HELP_LEVELS.length;

  if (!visible) return null;

  return (
    <Draggable
      nodeRef={nodeRef}
      bounds="body"
      cancel=".chat-bubble"
      defaultPosition={{ x: window.innerWidth < 768 ? 8 : 24, y: window.innerWidth < 768 ? 8 : 24 }}
    >
      <div 
        ref={nodeRef}
        onPointerDown={handlePointerDown}
        className="fixed top-0 left-0 z-[100] flex flex-col items-start cursor-grab active:cursor-grabbing" 
        dir="ltr"
        style={{ touchAction: 'none' }}
      >
        {/* ── Chat Bubble ── */}
      <div
        className={`chat-bubble
          relative mb-2 md:mb-4 p-3 md:p-4 rounded-2xl md:rounded-3xl max-w-[200px] md:max-w-[280px] shadow-2xl border-2 md:border-4
          transform transition-all duration-500 ease-out origin-bottom-left
          ${panelOpen && activeLevelDef
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-50 opacity-0 translate-y-4 pointer-events-none'
          }
          ${activeLevelDef?.bubbleBg || 'bg-white'}
          ${activeLevelDef?.bubbleText || 'text-indigo-800'}
          ${activeLevelDef?.bubbleBorder || 'border-indigo-200'}
        `}
        style={{ direction: 'rtl', cursor: 'auto' }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black text-white ${activeLevelDef?.badgeColor || 'bg-indigo-500'}`}
            >
              {currentLevel}
            </div>
            <span className="text-sm font-extrabold">{activeLevelDef?.label}</span>
          </div>
          <button
            type="button"
            onClick={() => { setPanelOpen(false); cancel(); }}
            className="rounded-full p-1 opacity-60 transition-opacity hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>

        {/* Description */}
        <p className="font-extrabold text-xs md:text-base leading-relaxed">
          {activeLevelDef?.description}
        </p>

        {/* Next level button */}
        {hasNextLevel && (
          <button
            type="button"
            onClick={advanceHelp}
            className="mt-3 w-full rounded-2xl border-2 border-white/40 bg-white/20 px-4 py-2 text-sm font-black transition-all hover:-translate-y-0.5 hover:bg-white/30"
          >
            مساعدة أكتر ({HELP_LEVELS[currentLevel]?.label})
          </button>
        )}

        {/* Level dots */}
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {HELP_LEVELS.map((lvl, index) => (
            <div
              key={lvl.key}
              className={`h-2.5 w-2.5 rounded-full transition-all ${
                index < currentLevel 
                  ? `${activeLevelDef?.dotActive || 'bg-slate-600'} scale-110 shadow-sm` 
                  : `${activeLevelDef?.dotInactive || 'bg-slate-200'}`
              }`}
            />
          ))}
        </div>

        {/* Triangle pointer */}
        <div
          className={`absolute -bottom-3 left-4 md:left-8 h-6 w-6 rotate-45 border-b-4 border-r-4 ${activeLevelDef?.pointerBg || 'bg-white'} ${activeLevelDef?.pointerBorder || 'border-indigo-200'}`}
        />
      </div>

      {/* ── Mascot Button ── */}
      <button
        type="button"
        onClick={handleButtonClick}
        className={`
          group relative flex items-center justify-center
          w-14 h-14 md:w-20 md:h-20
          bg-gradient-to-br from-cyan-400 to-blue-600
          rounded-full shadow-[0_5px_15px_rgba(0,100,255,0.4)] md:shadow-[0_10px_25px_rgba(0,100,255,0.5)] border-2 md:border-4 border-white
          hover:scale-110 active:scale-95 transition-all duration-300
          ${isAnimatingState ? 'animate-[bounce_0.5s_ease-in-out]' : 'animate-[therapist-float_4s_ease-in-out_infinite]'}
        `}
      >
        <TherapistAvatar />

        {/* Ping ring when idle / waiting */}
        {currentLevel === 0 && (
          <div className="absolute inset-0 rounded-full border-4 border-yellow-400 animate-ping opacity-75" />
        )}

        {/* Active level ring */}
        {currentLevel > 0 && !panelOpen && (
          <div className="absolute inset-0 rounded-full border-4 border-yellow-400 animate-ping opacity-75" />
        )}
      </button>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes therapist-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-8px) rotate(-3deg); }
          75% { transform: translateY(5px) rotate(3deg); }
        }
      `}} />
    </div>
    </Draggable>
  );
});

export default GameAssistant;
