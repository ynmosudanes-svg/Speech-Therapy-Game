import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Hand } from 'lucide-react';
import FeedbackModal from '../components/FeedbackModal';
import GameHeader from '../components/game/GameHeader';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import { GameContainer, GameImage } from '../components/game/GameUI';
import { playAudioUrl } from '../utils/soundEffects';
import ChildGameBackdrop from './ChildGameBackdrop';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const TouchHandGame = ({
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
  const boardRef = useRef(null);
  const optionRefs = useRef({});
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const completedRef = useRef(false);

  const [handPosition, setHandPosition] = useState({ x: 50, y: 78 });
  const [isDragging, setIsDragging] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [visualPulse, setVisualPulse] = useState(false);
  const [startTime] = useState(Date.now());
  const { speak } = useSpeechSynthesis();

  const content = config?.content || {};
  const instructionAr = content.instructionAr || game?.questionTextAr || 'المس الصورة المطلوبة';
  const questionAudio = content.questionAudio || content.instructionAudio || game?.questionAudio || '';
  const options = useMemo(
    () => (Array.isArray(content.options) ? content.options : []),
    [content.options],
  );
  const successSound = config?.feedback?.successSound || game?.successSound || '';
  const failSound = config?.feedback?.failSound || game?.failSound || '';
  const avatarState = showFeedback ? (isCorrect ? 'celebration' : 'error') : 'learning';

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

  const resetHand = useCallback(() => {
    setHandPosition({ x: 50, y: 78 });
    setIsDragging(false);
    completedRef.current = false;
  }, []);

  const registerOptionRef = (optionId) => (node) => {
    if (node) optionRefs.current[optionId] = node;
    else delete optionRefs.current[optionId];
  };

  const getTouchedOption = useCallback((position) => {
    const board = boardRef.current;
    if (!board) return null;

    const boardRect = board.getBoundingClientRect();
    const pointX = boardRect.left + (position.x / 100) * boardRect.width;
    const pointY = boardRect.top + (position.y / 100) * boardRect.height;

    return options.find((option) => {
      const node = optionRefs.current[option.id];
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      return pointX >= rect.left && pointX <= rect.right && pointY >= rect.top && pointY <= rect.bottom;
    }) || null;
  }, [options]);

  const finishAttempt = useCallback((option) => {
    if (!option || completedRef.current) return;

    onAssistantInteraction?.();
    const correct = Boolean(option.isCorrect);
    completedRef.current = correct;
    setAttempts((current) => current + 1);
    setSelectedOption(option);
    setIsCorrect(correct);
    setShowFeedback(true);
    setVisualPulse(false);
  }, [onAssistantInteraction]);

  const updateHandFromPointer = useCallback((event) => {
    const board = boardRef.current;
    if (!board) return;

    const rect = board.getBoundingClientRect();
    const x = clamp(((event.clientX - rect.left - dragOffsetRef.current.x) / rect.width) * 100, 8, 92);
    const y = clamp(((event.clientY - rect.top - dragOffsetRef.current.y) / rect.height) * 100, 10, 90);
    const nextPosition = { x, y };

    setHandPosition(nextPosition);

    const touchedOption = getTouchedOption(nextPosition);
    if (touchedOption?.isCorrect) finishAttempt(touchedOption);
  }, [finishAttempt, getTouchedOption]);

  const handlePointerDown = (event) => {
    if (showFeedback) return;
    const board = boardRef.current;
    if (!board) return;

    onAssistantInteraction?.();
    const rect = board.getBoundingClientRect();
    const handX = rect.left + (handPosition.x / 100) * rect.width;
    const handY = rect.top + (handPosition.y / 100) * rect.height;

    dragOffsetRef.current = {
      x: event.clientX - handX,
      y: event.clientY - handY,
    };

    event.currentTarget.setPointerCapture?.(event.pointerId);
    setIsDragging(true);
  };

  const handlePointerMove = (event) => {
    if (!isDragging || showFeedback) return;
    event.preventDefault();
    updateHandFromPointer(event);
  };

  const handlePointerUp = (event) => {
    if (!isDragging) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    setIsDragging(false);

    const touchedOption = getTouchedOption(handPosition);
    if (touchedOption) finishAttempt(touchedOption);
  };

  useEffect(() => {
    if (!registerAssistantActions) return undefined;

    registerAssistantActions({
      onVisualHint: () => setVisualPulse(true),
      onGestureHint: () => setVisualPulse(true),
      onVerbalHint: () => {
        const correctOption = options.find((option) => option.isCorrect);
        if (helpVoiceEnabled) {
          speak(correctOption?.textAr ? `اسحب اليد إلى ${correctOption.textAr}` : 'اسحب اليد إلى الصورة الصحيحة.');
        }
      },
      onPhysicalPrompt: () => setVisualPulse(true),
    });

    return () => registerAssistantActions({});
  }, [helpVoiceEnabled, options, registerAssistantActions, speak]);

  const handleNext = () => {
    setShowFeedback(false);

    if (!isCorrect) {
      setSelectedOption(null);
      resetHand();
      return;
    }

    if (previewMode) {
      setSelectedOption(null);
      resetHand();
      return;
    }

    const totalAttempts = attempts || 1;
    const responseTime = Date.now() - startTime;
    onComplete({
      correctAnswers: 1,
      wrongAnswers: Math.max(totalAttempts - 1, 0),
      attempts: [totalAttempts],
      prompts: [therapistControlsEnabled ? therapistPromptLevel : 'none'],
      timeSpent: Math.floor(responseTime / 1000),
      responseTime,
      selectedAnswer: selectedOption?.id || '',
      isCorrect: true,
    });
  };

  const correctOptionId = options.find((option) => option.isCorrect)?.id;

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
        onRestart={resetHand}
      />

      <div
        ref={boardRef}
        className="relative min-h-[clamp(390px,62vh,560px)] overflow-hidden rounded-[1.8rem] border border-[#cdeef7] bg-white/30 p-4 shadow-[0_22px_48px_-34px_rgba(15,66,92,0.25)] touch-none sm:p-5"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {options.map((option, index) => {
            const isSelected = selectedOption?.id === option.id;
            const isHinted = visualPulse && option.id === correctOptionId;
            const stateClass = isSelected
              ? isCorrect
                ? 'border-emerald-300 bg-emerald-50/95'
                : 'border-rose-300 bg-rose-50/95'
              : isHinted
                ? 'border-[#19add6] bg-white ring-[3px] ring-[#7dd3fc]/90 shadow-[0_0_0_5px_rgba(25,173,214,0.20)]'
                : 'border-[#dbe7f3] bg-white/94';

            return (
              <div
                key={option.id || index}
                ref={registerOptionRef(option.id)}
                className={`relative z-10 min-h-[clamp(130px,22vw,190px)] rounded-[1.2rem] border p-2 transition-all duration-200 ${stateClass}`}
              >
                <GameImage
                  src={option.image}
                  alt={option.textAr || `option-${index + 1}`}
                  className="h-full min-h-[118px]"
                  fit="contain"
                  emptyLabel="صورة"
                />
                {!!option.textAr && (
                  <div className="mt-2 text-center text-sm font-black text-slate-700">{option.textAr}</div>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className={`absolute z-30 grid h-24 w-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-white bg-gradient-to-br from-amber-100 to-orange-200 text-[#0f6f95] shadow-[0_18px_36px_-18px_rgba(15,66,92,0.45)] transition-transform duration-150 ${
            isDragging ? 'scale-110 cursor-grabbing' : 'cursor-grab active:scale-105'
          }`}
          style={{ left: `${handPosition.x}%`, top: `${handPosition.y}%` }}
          onPointerDown={handlePointerDown}
          aria-label="اسحب اليد"
        >
          <Hand className="h-14 w-14" strokeWidth={2.7} />
          <span className="pointer-events-none absolute -top-2 rounded-full bg-white/95 px-2 py-0.5 text-[0.65rem] font-black text-slate-600 shadow-sm">
            اسحب
          </span>
        </button>
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

export default TouchHandGame;
