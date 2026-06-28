import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FeedbackModal from '../components/FeedbackModal';
import GameHeader from '../components/game/GameHeader';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import { GameContainer, GameImage } from '../components/game/GameUI';
import { playAudioUrl } from '../utils/soundEffects';
import fingerPointerImage from '../assets/touch-finger-pointer.png';
import openHandImage from '../assets/touch-open-hand.png';
import ChildGameBackdrop from './ChildGameBackdrop';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const defaultPointerPosition = { x: 50, y: 80 };

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

  const [handPosition, setHandPosition] = useState(defaultPointerPosition);
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
  const pointerType = content.pointerType === 'finger' ? 'finger' : 'hand';
  const pointerLabel = pointerType === 'finger' ? '\u0627\u0644\u0645\u0633' : '\u0627\u0633\u062d\u0628';
  const pointerImage = pointerType === 'finger' ? fingerPointerImage : openHandImage;
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
    setHandPosition(defaultPointerPosition);
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
          const actionText = pointerType === 'finger' ? '\u062d\u0631\u0643 \u0627\u0644\u0635\u0628\u0627\u0639 \u0625\u0644\u0649' : '\u0627\u0633\u062d\u0628 \u0627\u0644\u064a\u062f \u0625\u0644\u0649';
          speak(correctOption?.textAr ? `${actionText} ${correctOption.textAr}` : `${actionText} \u0627\u0644\u0635\u0648\u0631\u0629 \u0627\u0644\u0635\u062d\u064a\u062d\u0629.`);
        }
      },
      onPhysicalPrompt: () => setVisualPulse(true),
    });

    return () => registerAssistantActions({});
  }, [helpVoiceEnabled, options, pointerType, registerAssistantActions, speak]);

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
        className="relative min-h-[clamp(390px,62vh,560px)] overflow-hidden rounded-[1.8rem] border border-[#cdeef7] bg-white/30 px-4 pt-6 pb-28 shadow-[0_22px_48px_-34px_rgba(15,66,92,0.25)] touch-none sm:px-5 sm:pt-7 sm:pb-32"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="mx-auto flex max-w-[min(100%,42rem)] flex-wrap items-center justify-center gap-4 sm:gap-5">
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
                className={`relative z-10 h-[clamp(145px,21vw,205px)] w-[clamp(132px,18vw,180px)] rounded-[1.2rem] border p-2 transition-all duration-200 ${stateClass}`}
              >
                <GameImage
                  src={option.image}
                  alt={option.textAr || `option-${index + 1}`}
                  className="h-full min-h-0"
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
          className={`absolute z-30 grid h-24 w-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-white bg-gradient-to-br from-amber-100 to-orange-200 text-[#0f6f95] shadow-[0_18px_36px_-18px_rgba(15,66,92,0.45)] transition-transform duration-150 sm:h-28 sm:w-28 ${
            isDragging ? 'scale-110 cursor-grabbing' : 'cursor-grab active:scale-105'
          }`}
          style={{ left: `${handPosition.x}%`, top: `${handPosition.y}%` }}
          onPointerDown={handlePointerDown}
          aria-label={pointerLabel}
        >
          <img
            src={pointerImage}
            alt=""
            className={pointerType === 'finger' ? 'h-16 w-16 object-contain drop-shadow-sm sm:h-20 sm:w-20' : 'h-[4.5rem] w-[4.5rem] object-contain drop-shadow-sm sm:h-24 sm:w-24'}
            draggable="false"
          />
          <span className="pointer-events-none absolute -top-2 rounded-full bg-white/95 px-2 py-0.5 text-[0.65rem] font-black text-slate-600 shadow-sm">
            {pointerLabel}
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
