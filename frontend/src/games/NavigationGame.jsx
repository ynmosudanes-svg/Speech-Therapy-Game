import React, { useEffect, useMemo, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw, Volume2 } from 'lucide-react';
import FeedbackModal from '../components/FeedbackModal';
import GameHeader from '../components/game/GameHeader';
import {
  playAudioUrl,
  playBoundarySound,
  playErrorSound,
  playMoveSound,
  playSuccessSound,
} from '../utils/soundEffects';

const DEFAULT_CELL_SIZE = 56;
const PREVIEW_CELL_SIZE = 58;

const speakArabic = (text) => {
  if (!text || typeof window === 'undefined') return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ar-SA';
  window.speechSynthesis.speak(utterance);
};

const preventKeyboardAudioTrigger = (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    event.stopPropagation();
  }
};

const PlaceholderTile = ({ label, className = '' }) => (
  <div
    className={`w-full h-full rounded-2xl border-2 border-dashed border-slate-300 bg-white/90 flex items-center justify-center text-center text-xs md:text-sm font-black text-slate-400 px-2 ${className}`}
  >
    {label}
  </div>
);

const ControlButton = ({ icon: Icon, onClick, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-12 h-12 sm:w-14 sm:h-14 md:w-20 md:h-20 rounded-2xl md:rounded-[1.5rem] bg-sky-500 text-white shadow-[0_5px_0_#0284c7] md:shadow-[0_6px_0_#0284c7] hover:bg-sky-400 active:translate-y-1 md:active:translate-y-1.5 active:shadow-none transition-all flex items-center justify-center ${className}`}
  >
    <Icon size={24} className="md:w-8 md:h-8" />
  </button>
);

const NavigationGame = ({
  game,
  config,
  onComplete,
  therapistControlsEnabled = false,
  therapistPromptLevel = 'none',
  previewMode = false,
  onAssistantInteraction,
  registerAssistantActions,
  helpVoiceEnabled = false,
}) => {
  const content = config?.content || {};
  const feedbackConfig = config?.feedback || {};
  const instructionAr = content?.instructionAr || '';
  const instructionAudio = content?.instructionAudio || '';
  const sceneImage = content?.sceneImage || '';
  const movable = content?.movable || {};
  const target = content?.target || {};
  const grid = content?.grid || {};
  const moveSound = config?.feedback?.moveSound || '';
  const boundarySound = config?.feedback?.boundarySound || '';

  const cols = Math.max(Number(grid?.cols || 8), 2);
  const rows = Math.max(Number(grid?.rows || 6), 2);
  const startX = Math.min(Math.max(Number(movable?.startX ?? 1), 1), cols);
  const startY = Math.min(Math.max(Number(movable?.startY ?? 1), 1), rows);
  const targetX = Math.min(Math.max(Number(target?.x ?? cols), 1), cols);
  const targetY = Math.min(Math.max(Number(target?.y ?? rows), 1), rows);
  const radius = Math.max(Number(target?.radius || 1), 1);

  const [position, setPosition] = useState({ x: startX, y: startY });
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [shake, setShake] = useState(false);
  const [startTime] = useState(Date.now());

  /* ── Hint states ── */
  const [visualPulse, setVisualPulse] = useState(false);
  const [gestureDirection, setGestureDirection] = useState(null); // 'up'|'down'|'left'|'right'
  const [physicalPath, setPhysicalPath] = useState(false);

  const isIncomplete =
    Number.isNaN(cols) ||
    Number.isNaN(rows) ||
    Number.isNaN(startX) ||
    Number.isNaN(startY) ||
    Number.isNaN(targetX) ||
    Number.isNaN(targetY);

  useEffect(() => {
    setPosition({ x: startX, y: startY });
    setAttempts(0);
    setFeedback(null);
    setShake(false);
  }, [game?.id, startX, startY, targetX, targetY]);

  /* ── Auto-play audio from the game ── */
  useEffect(() => {
    if (!previewMode && instructionAudio) {
      playAudioUrl(instructionAudio);
    }
  }, [instructionAudio, previewMode]);

  const boardContainerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = boardContainerRef.current;
    if (!el) return;
    
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const cellSize = useMemo(() => {
    if (containerSize.width === 0 || containerSize.height === 0) {
      return previewMode ? PREVIEW_CELL_SIZE : DEFAULT_CELL_SIZE;
    }
    // We have the exact pixel dimensions of the wrapper. 
    // Calculate max cell size to fit BOTH width and height with a small padding (16px)
    const padding = 16;
    const maxCellWidth = (containerSize.width - padding) / cols;
    const maxCellHeight = (containerSize.height - padding) / rows;
    
    // Use the smallest so it fits perfectly, capped at DEFAULT_CELL_SIZE
    return Math.min(maxCellWidth, maxCellHeight, DEFAULT_CELL_SIZE);
  }, [containerSize, cols, rows, previewMode]);

  const boardStyle = useMemo(
    () => ({
      width: `${cols * cellSize}px`,
      height: `${rows * cellSize}px`,
      backgroundImage: `
        linear-gradient(to right, rgba(148, 163, 184, 0.14) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(148, 163, 184, 0.14) 1px, transparent 1px)
      `,
      backgroundSize: `${cellSize}px ${cellSize}px`,
      backgroundColor: '#fffdf9',
    }),
    [cellSize, cols, rows]
  );

  const movableStyle = useMemo(
    () => ({
      width: `${cellSize}px`,
      height: `${cellSize}px`,
      left: `${(position.x - 1) * cellSize}px`,
      top: `${(position.y - 1) * cellSize}px`,
      transition: 'left 220ms ease, top 220ms ease, transform 220ms ease',
    }),
    [cellSize, position.x, position.y]
  );

  const targetStyle = useMemo(
    () => ({
      width: `${cellSize}px`,
      height: `${cellSize}px`,
      left: `${(targetX - 1) * cellSize}px`,
      top: `${(targetY - 1) * cellSize}px`,
    }),
    [cellSize, targetX, targetY]
  );

  const playInstruction = () => {
    if (instructionAudio) {
      playAudioUrl(instructionAudio);
      return;
    }
    speakArabic(instructionAr || 'حرّك العنصر حتى يصل إلى الهدف');
  };

  /* ── Compute direction hint from player to target ── */
  const computeDirectionHint = () => {
    const dx = targetX - position.x;
    const dy = targetY - position.y;
    if (Math.abs(dx) >= Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    }
    return dy > 0 ? 'down' : 'up';
  };

  const directionArrow = {
    up: '⬆️',
    down: '⬇️',
    left: '⬅️',
    right: '➡️',
  };

  /* ── Register 4 assistant callbacks ── */
  useEffect(() => {
    if (!registerAssistantActions) {
      return undefined;
    }

    registerAssistantActions({
      onVisualHint: () => {
        setVisualPulse(true);
        window.setTimeout(() => setVisualPulse(false), 2500);
      },
      onGestureHint: () => {
        const dir = computeDirectionHint();
        setGestureDirection(dir);
        window.setTimeout(() => setGestureDirection(null), 3000);
      },
      onVerbalHint: () => {
        const dir = computeDirectionHint();
        const dirNames = { up: 'فوق', down: 'تحت', left: 'شمال', right: 'يمين' };
        if (helpVoiceEnabled) {
          speakArabic(`حرّك العنصر ${dirNames[dir] || ''} عشان تقرب من الهدف.`);
        }
      },
      onPhysicalPrompt: () => {
        setPhysicalPath(true);
        window.setTimeout(() => setPhysicalPath(false), 4000);
        if (helpVoiceEnabled) {
          const dir = computeDirectionHint();
          const dirNames = { up: 'فوق', down: 'تحت', left: 'شمال', right: 'يمين' };
          speakArabic(`اتجه ${dirNames[dir] || ''}! الهدف بيلمع… روح عليه!`);
        }
      },
    });

    return () => registerAssistantActions({});
  }, [helpVoiceEnabled, instructionAr, instructionAudio, position, targetX, targetY, registerAssistantActions]);

  const resetGame = () => {
    setPosition({ x: startX, y: startY });
    setAttempts(0);
    setFeedback(null);
    setShake(false);
    setVisualPulse(false);
    setGestureDirection(null);
    setPhysicalPath(false);
  };

  const triggerBlockedFeedback = () => {
    if (boundarySound) playAudioUrl(boundarySound);
    else if (feedbackConfig?.failSound) playAudioUrl(feedbackConfig.failSound);
    else {
      playBoundarySound();
      playErrorSound();
    }

    setShake(true);
    setTimeout(() => setShake(false), 260);
  };

  const detectSuccess = (nextX, nextY, nextAttempts) => {
    const distance = Math.abs(nextX - targetX) + Math.abs(nextY - targetY);
    if (distance > radius) {
      return;
    }

    if (feedbackConfig?.successSound) playAudioUrl(feedbackConfig.successSound);
    else playSuccessSound();

    setFeedback('success');
    setShowModal(true);
    confetti({
      particleCount: 140,
      spread: 90,
      origin: { y: 0.65 },
      colors: ['#2563eb', '#10b981', '#f59e0b'],
    });
  };

  const handleModalNext = () => {
    setShowModal(false);

    if (previewMode) {
      resetGame();
      return;
    }

    const responseTime = Date.now() - startTime;
    const timeSpent = Math.floor(responseTime / 1000);
    onComplete({
      correctAnswers: 1,
      wrongAnswers: Math.max(attempts - 1, 0),
      attempts: [attempts],
      prompts: [therapistControlsEnabled ? therapistPromptLevel : 'none'],
      timeSpent,
      responseTime,
      isCorrect: true,
    });
  };

  const moveBy = (dx, dy) => {
    if (isIncomplete || feedback === 'success') return;
    onAssistantInteraction?.();

    // Clear hints on interaction
    setVisualPulse(false);
    setGestureDirection(null);
    setPhysicalPath(false);

    const nextX = position.x + dx;
    const nextY = position.y + dy;

    if (nextX < 1 || nextX > cols || nextY < 1 || nextY > rows) {
      triggerBlockedFeedback();
      return;
    }

    const nextAttempts = attempts + 1;
    if (moveSound) playAudioUrl(moveSound);
    else playMoveSound();

    setAttempts(nextAttempts);
    setPosition({ x: nextX, y: nextY });
    detectSuccess(nextX, nextY, nextAttempts);
  };

  if (isIncomplete) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-[#eadfbe] p-10 text-center">
        <h2 className="text-3xl font-black text-slate-800 mb-4">اللعبة غير مكتملة</h2>
      </div>
    );
  }

  const showTargetHighlight = visualPulse || physicalPath;

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-1 md:gap-4 h-[calc(100vh-80px)] overflow-hidden" dir="rtl">
      <GameHeader
        instruction={instructionAr || 'حرّك العنصر حتى يصل إلى الهدف'}
        onPlayAudio={playInstruction}
        onRestart={resetGame}
      />

      <section 
        ref={boardContainerRef}
        className="rounded-xl md:rounded-[2.4rem] border border-[#dbe7f3] bg-[#f8fbff] shadow-sm flex-1 min-h-0 flex items-center justify-center overflow-hidden w-full"
      >
        <div className="relative overflow-hidden rounded-lg md:rounded-[2rem] bg-white border border-[#dbe7f3] shrink-0" style={boardStyle}>
            {sceneImage ? (
              <img
                src={sceneImage}
                alt={game?.titleAr || 'scene'}
                className="absolute inset-0 w-full h-full object-cover opacity-90"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(19,143,188,0.08),_transparent_44%),linear-gradient(180deg,_#fffdf9_0%,_#f8fbfd_100%)]" />
            )}

            <div className="absolute inset-0 pointer-events-none">
              <div
                className={`absolute rounded-full border-4 ${showTargetHighlight ? 'border-[#168FC7] bg-[#168FC7]/20 scale-105' : 'border-emerald-400/80 bg-emerald-300/20 animate-pulse'}`}
                style={{
                  width: `${cellSize * Math.max(radius, 1)}px`,
                  height: `${cellSize * Math.max(radius, 1)}px`,
                  left: `${(targetX - 1) * cellSize + cellSize / 2 - (cellSize * Math.max(radius, 1)) / 2}px`,
                  top: `${(targetY - 1) * cellSize + cellSize / 2 - (cellSize * Math.max(radius, 1)) / 2}px`,
                }}
              />

              <div className="absolute" style={targetStyle}>
                {target?.image ? (
                  <img
                    src={target.image}
                    alt="target"
                    className={`w-full h-full scale-[1.18] object-contain drop-shadow-md ${showTargetHighlight ? 'drop-shadow-[0_0_12px_rgba(22,143,199,0.9)]' : ''}`}
                  />
                ) : (
                  <PlaceholderTile
                    label="الهدف"
                    className={showTargetHighlight ? 'text-[#168FC7] border-[#168FC7] bg-[#eef7fc]' : 'text-emerald-600 border-emerald-200 bg-white/95'}
                  />
                )}
              </div>
            </div>

            {/* Gesture direction indicator */}
            {gestureDirection && (
              <div
                className="absolute z-30 text-4xl animate-bounce flex items-center justify-center pointer-events-none"
                style={{
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                  left: `${(position.x - 1) * cellSize}px`,
                  top: `${(position.y - 1) * cellSize}px`,
                  transform: 'translateY(-100%)',
                }}
              >
                {directionArrow[gestureDirection]}
              </div>
            )}

            <div className={`absolute ${shake ? 'animate-pulse' : ''}`} style={movableStyle}>
              {movable?.image ? (
                <img src={movable.image} alt="movable" className="w-full h-full scale-[1.2] object-contain drop-shadow-lg" />
              ) : (
                <PlaceholderTile label="العنصر" className="text-blue-600 border-blue-200 bg-white/95" />
              )}
            </div>

            </div>
      </section>

      {previewMode && (!sceneImage || !movable?.image || !target?.image) && (
        <div className="rounded-xl border border-dashed border-sky-200 bg-sky-50 px-3 py-2 text-center text-xs md:text-sm font-bold text-sky-700">
          المعاينة تعمل الآن بـ placeholders. يمكنك رفع الصور لاحقًا.
        </div>
      )}

      <section className="bg-white rounded-xl md:rounded-[2rem] border border-[#dbe7f3] py-3 md:p-4 shadow-sm shrink-0">
        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-5 w-fit mx-auto" dir="ltr">
          <div />
          <ControlButton icon={ArrowUp} onClick={() => moveBy(0, -1)} />
          <div />
          <ControlButton icon={ArrowLeft} onClick={() => moveBy(-1, 0)} />
          <ControlButton icon={ArrowDown} onClick={() => moveBy(0, 1)} />
          <ControlButton icon={ArrowRight} onClick={() => moveBy(1, 0)} />
        </div>
      </section>

      <FeedbackModal
        show={showModal}
        isCorrect={feedback === 'success'}
        onNext={handleModalNext}
        successSound={feedbackConfig.successSound}
        failSound={feedbackConfig.failSound}
      />
    </div>
  );
};

export default NavigationGame;
