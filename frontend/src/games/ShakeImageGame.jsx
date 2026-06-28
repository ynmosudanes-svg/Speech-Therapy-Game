import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FeedbackModal from '../components/FeedbackModal';
import GameHeader from '../components/game/GameHeader';
import { GameContainer, GameImage } from '../components/game/GameUI';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import { playAudioUrl } from '../utils/soundEffects';
import ChildGameBackdrop from './ChildGameBackdrop';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const defaultPosition = { x: 0, y: 0 };

const ShakeImageGame = ({
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
  const cardRef = useRef(null);
  const lastPointRef = useRef(null);
  const completedRef = useRef(false);

  const [position, setPosition] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [shakeScore, setShakeScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());
  const { speak } = useSpeechSynthesis();

  const content = config?.content || {};
  const instructionAr = content.instructionAr || game?.questionTextAr || '\u0627\u0645\u0633\u0643 \u0627\u0644\u0635\u0648\u0631\u0629 \u0648\u0647\u0632\u0647\u0627';
  const questionAudio = content.questionAudio || content.instructionAudio || game?.questionAudio || '';
  const image = content.image || content.hero?.image || game?.targetImage || '';
  const requiredShakes = Math.max(3, Number(content.requiredShakes || 6));
  const successSound = config?.feedback?.successSound || game?.successSound || '';
  const failSound = config?.feedback?.failSound || game?.failSound || '';
  const progress = Math.min(100, Math.round((shakeScore / requiredShakes) * 100));
  const avatarState = showFeedback ? 'celebration' : isDragging ? 'encouraging' : 'learning';

  useEffect(() => {
    if (questionAudio) playAudioUrl(questionAudio);
  }, [questionAudio]);

  const playInstruction = () => {
    if (questionAudio) {
      playAudioUrl(questionAudio);
      return;
    }
    speak(instructionAr);
  };

  const resetGame = useCallback(() => {
    completedRef.current = false;
    lastPointRef.current = null;
    setPosition(defaultPosition);
    setIsDragging(false);
    setShakeScore(0);
    setShowFeedback(false);
    setIsCorrect(false);
  }, []);

  const finishSuccess = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onAssistantInteraction?.();
    setAttempts((current) => current + 1);
    setIsCorrect(true);
    setShowFeedback(true);
    setIsDragging(false);
  }, [onAssistantInteraction]);

  const updateFromPointer = useCallback((event) => {
    const card = cardRef.current;
    if (!card || completedRef.current) return;

    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = clamp(event.clientX - centerX, -42, 42);
    const y = clamp(event.clientY - centerY, -36, 36);
    const now = performance.now();
    const last = lastPointRef.current;

    setPosition({ x, y });

    if (last) {
      const dx = x - last.x;
      const dy = y - last.y;
      const distance = Math.hypot(dx, dy);
      const dt = Math.max(16, now - last.time);
      const speed = distance / dt;
      const changedDirection =
        Math.sign(dx || last.dx || 1) !== Math.sign(last.dx || dx || 1) ||
        Math.sign(dy || last.dy || 1) !== Math.sign(last.dy || dy || 1);

      if (distance > 14 && speed > 0.24 && changedDirection) {
        setShakeScore((current) => {
          const next = Math.min(requiredShakes, current + 1);
          if (next >= requiredShakes) {
            window.setTimeout(finishSuccess, 80);
          }
          return next;
        });
      }
    }

    lastPointRef.current = { x, y, dx: last ? x - last.x : 0, dy: last ? y - last.y : 0, time: now };
  }, [finishSuccess, requiredShakes]);

  const handlePointerDown = (event) => {
    if (showFeedback) return;
    onAssistantInteraction?.();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setIsDragging(true);
    lastPointRef.current = { x: position.x, y: position.y, dx: 0, dy: 0, time: performance.now() };
  };

  const handlePointerMove = (event) => {
    if (!isDragging || showFeedback) return;
    event.preventDefault();
    updateFromPointer(event);
  };

  const handlePointerUp = (event) => {
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    setIsDragging(false);
    lastPointRef.current = null;
    setPosition(defaultPosition);
  };

  useEffect(() => {
    if (!registerAssistantActions) return undefined;

    registerAssistantActions({
      onVisualHint: () => setShakeScore((current) => Math.min(requiredShakes - 1, current + 1)),
      onGestureHint: () => setShakeScore((current) => Math.min(requiredShakes - 1, current + 1)),
      onVerbalHint: () => {
        if (helpVoiceEnabled) speak('\u0627\u0645\u0633\u0643 \u0627\u0644\u0635\u0648\u0631\u0629 \u0648\u062d\u0631\u0643\u0647\u0627 \u064a\u0645\u064a\u0646 \u0648\u0634\u0645\u0627\u0644.');
      },
      onPhysicalPrompt: () => setShakeScore((current) => Math.min(requiredShakes - 1, current + 1)),
    });

    return () => registerAssistantActions({});
  }, [helpVoiceEnabled, registerAssistantActions, requiredShakes, speak]);

  const handleNext = () => {
    setShowFeedback(false);

    if (previewMode) {
      resetGame();
      return;
    }

    const responseTime = Date.now() - startTime;
    onComplete({
      correctAnswers: 1,
      wrongAnswers: 0,
      attempts: [attempts || 1],
      prompts: [therapistControlsEnabled ? therapistPromptLevel : 'none'],
      timeSpent: Math.floor(responseTime / 1000),
      responseTime,
      selectedAnswer: 'shake',
      isCorrect: true,
    });
  };

  const cardStyle = useMemo(() => ({
    transform: `translate(${position.x}px, ${position.y}px) rotate(${position.x / 5}deg)`,
  }), [position.x, position.y]);

  return (
    <GameContainer
      className={previewMode ? 'max-w-4xl' : 'max-w-4xl'}
      dir="rtl"
      style={{ maxWidth: 'min(100%, clamp(22rem, 58vw, 48rem))' }}
    >
      <ChildGameBackdrop previewMode={previewMode} />

      <GameHeader
        instruction={instructionAr}
        avatarState={avatarState}
        onPlayAudio={playInstruction}
        onRestart={resetGame}
      />

      <div className="relative min-h-[clamp(390px,62vh,560px)] overflow-hidden rounded-[1.8rem] border border-[#cdeef7] bg-white/30 px-5 py-8 shadow-[0_22px_48px_-34px_rgba(15,66,92,0.25)] touch-none">
        <div className="mx-auto mb-6 h-3 max-w-sm overflow-hidden rounded-full bg-white/70 shadow-inner">
          <div
            className="h-full rounded-full bg-[#0b8fc5] transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex min-h-[320px] items-center justify-center">
          <button
            ref={cardRef}
            type="button"
            className={`relative grid h-[clamp(210px,38vw,300px)] w-[clamp(210px,38vw,300px)] place-items-center rounded-[1.6rem] border-4 border-white bg-white/95 p-4 shadow-[0_24px_52px_-28px_rgba(15,66,92,0.48)] transition-shadow duration-150 ${
              isDragging ? 'cursor-grabbing shadow-[0_30px_58px_-24px_rgba(15,66,92,0.62)]' : 'cursor-grab'
            }`}
            style={cardStyle}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            aria-label={instructionAr}
          >
            <GameImage
              src={image}
              alt={instructionAr}
              className="h-full min-h-0 w-full"
              fit="contain"
              emptyLabel={'\u0635\u0648\u0631\u0629'}
            />
          </button>
        </div>
      </div>

      <FeedbackModal
        show={showFeedback}
        isCorrect={isCorrect}
        onNext={handleNext}
        successSound={successSound}
        failSound={failSound}
      />
    </GameContainer>
  );
};

export default ShakeImageGame;
