import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import FeedbackModal from '../components/FeedbackModal';
import GameHeader from '../components/game/GameHeader';
import {
  GAME_ASSISTANT_HINT_CLASS,
  GameChoice,
  GameContainer,
  GameGrid,
  GameImage,
} from '../components/game/GameUI';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import { playAudioUrl, playErrorSound, playMoveSound } from '../utils/soundEffects';
import ChildGameBackdrop from './ChildGameBackdrop';
import StepTransitionAnimation from './components/StepTransitionAnimation';

const normalizeId = (value, fallback) => String(value || fallback || '').trim();

const getStepTargetId = (step) => normalizeId(step?.targetId || step?.itemId || step?.id);

const createFallbackItems = () => [
  { id: 'coach', labelAr: '\u0627\u0644\u0645\u062f\u0631\u0628', textAr: '\u0627\u0644\u0645\u062f\u0631\u0628', image: '', stepOrder: 1 },
  { id: 'ball', labelAr: '\u0627\u0644\u0643\u0631\u0629', textAr: '\u0627\u0644\u0643\u0631\u0629', image: '', stepOrder: 2 },
  { id: 'girl', labelAr: '\u0627\u0644\u0628\u0646\u062a', textAr: '\u0627\u0644\u0628\u0646\u062a', image: '' },
  { id: 'chair', labelAr: '\u0627\u0644\u0643\u0631\u0633\u064a', textAr: '\u0627\u0644\u0643\u0631\u0633\u064a', image: '' },
];

const normalizeItems = (content) => {
  const sourceItems = Array.isArray(content?.items)
    ? content.items
    : Array.isArray(content?.options)
      ? content.options
      : [];

  const normalized = sourceItems
    .map((item, index) => {
      const id = normalizeId(item?.id, `item_${index + 1}`);
      return {
        ...item,
        id,
        labelAr: item?.labelAr || item?.textAr || item?.label || `\u0639\u0646\u0635\u0631 ${index + 1}`,
        textAr: item?.textAr || item?.labelAr || item?.label || '',
        image: item?.image || item?.imageUrl || '',
        stepOrder: Number.isFinite(Number(item?.stepOrder ?? item?.order))
          ? Number(item?.stepOrder ?? item?.order)
          : null,
      };
    })
    .filter((item) => item.id);

  return normalized.length ? normalized : createFallbackItems();
};

const normalizeSteps = (content, items) => {
  const explicitSteps = Array.isArray(content?.commandSteps)
    ? content.commandSteps
    : Array.isArray(content?.steps)
      ? content.steps
      : [];

  const fromExplicitSteps = explicitSteps
    .map((step, index) => ({
      id: normalizeId(step?.id, `step_${index + 1}`),
      targetId: getStepTargetId(step),
      labelAr: step?.labelAr || step?.textAr || step?.instructionAr || '',
      order: Number.isFinite(Number(step?.order)) ? Number(step.order) : index + 1,
    }))
    .filter((step) => step.targetId);

  if (fromExplicitSteps.length) {
    return fromExplicitSteps.sort((a, b) => a.order - b.order);
  }

  const fromItemOrder = items
    .filter((item) => Number.isFinite(Number(item.stepOrder)) && Number(item.stepOrder) > 0)
    .map((item) => ({
      id: `step_${item.id}`,
      targetId: item.id,
      labelAr: item.labelAr || item.textAr || '',
      order: Number(item.stepOrder),
    }))
    .sort((a, b) => a.order - b.order);

  if (fromItemOrder.length) {
    return fromItemOrder;
  }

  return items.slice(0, Math.min(2, items.length)).map((item, index) => ({
    id: `step_${item.id}`,
    targetId: item.id,
    labelAr: item.labelAr || item.textAr || '',
    order: index + 1,
  }));
};

const StepBadge = ({ index, done }) => (
  <span
    className={`absolute -right-2 -top-2 z-30 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white text-sm font-black shadow-[0_12px_22px_-12px_rgba(15,66,92,0.38)] ${
      done ? 'bg-emerald-500 text-white' : 'bg-[#19add6] text-white'
    }`}
  >
    {done ? <Check className="h-4 w-4" strokeWidth={3} /> : index}
  </span>
);

const StepProgress = ({ current, total }) => (
  <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-[#cdeef7] bg-white/90 px-3 py-1.5 text-xs font-black text-[#0b6f98] shadow-[0_10px_22px_-18px_rgba(25,173,214,0.5)]">
    {Array.from({ length: total }).map((_, index) => (
      <span
        key={index}
        className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
          index <= current ? 'bg-[#19add6]' : 'bg-slate-200'
        }`}
      />
    ))}
    <span className="pr-1">الخطوة {Math.min(current + 1, total)} من {total}</span>
  </div>
);

export default function MultiStepCommandGame({
  game,
  config,
  onComplete,
  therapistControlsEnabled = false,
  therapistPromptLevel = 'none',
  previewMode = false,
  onAssistantInteraction,
  registerAssistantActions,
  helpVoiceEnabled = false,
}) {
  const content = config?.content || {};
  const instructionAr = content?.instructionAr || game?.questionTextAr || 'نفذ التعليمات بالترتيب';
  const questionAudio = content?.questionAudio || content?.instructionAudio || game?.questionAudio || '';
  const successSound = config?.feedback?.successSound || game?.successSound || '';
  const failSound = config?.feedback?.failSound || game?.failSound || '';
  const items = useMemo(() => normalizeItems(content), [content]);
  const commandSteps = useMemo(() => normalizeSteps(content, items), [content, items]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedTargets, setCompletedTargets] = useState([]);
  const [wrongTargetId, setWrongTargetId] = useState('');
  const [pulseTargetId, setPulseTargetId] = useState('');
  const [transitionState, setTransitionState] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [completionStats, setCompletionStats] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());
  const { speak } = useSpeechSynthesis();
  const sceneRef = useRef(null);
  const itemRefs = useRef({});

  const currentStep = commandSteps[currentStepIndex] || null;
  const currentTargetId = getStepTargetId(currentStep);
  const totalSteps = Math.max(commandSteps.length, 1);
  const avatarState = showFeedback ? 'celebration' : 'learning';

  useEffect(() => {
    if (!previewMode && questionAudio) {
      playAudioUrl(questionAudio);
    }
  }, [previewMode, questionAudio]);

  useEffect(() => {
    if (!registerAssistantActions) return undefined;

    registerAssistantActions({
      onVisualHint: () => {
        setPulseTargetId(currentTargetId);
        window.setTimeout(() => setPulseTargetId(''), 2400);
      },
      onGestureHint: () => {
        setPulseTargetId(currentTargetId);
        window.setTimeout(() => setPulseTargetId(''), 3000);
      },
      onVerbalHint: () => {
        const item = items.find((entry) => entry.id === currentTargetId);
        if (helpVoiceEnabled) {
          speak(item?.labelAr ? ['\u0627\u0636\u063a\u0637 \u0639\u0644\u0649', item.labelAr].join(' ') : '\u0627\u0636\u063a\u0637 \u0639\u0644\u0649 \u0627\u0644\u0639\u0646\u0635\u0631 \u0627\u0644\u0635\u062d\u064a\u062d');
        }
      },
      onPhysicalPrompt: () => {
        setPulseTargetId(currentTargetId);
        window.setTimeout(() => setPulseTargetId(''), 3200);
      },
    });

    return () => registerAssistantActions({});
  }, [currentTargetId, helpVoiceEnabled, items, registerAssistantActions, speak]);

  const playInstruction = () => {
    if (questionAudio) {
      playAudioUrl(questionAudio);
      return;
    }
    speak(instructionAr);
  };

  const resetActivity = () => {
    setCurrentStepIndex(0);
    setCompletedTargets([]);
    setWrongTargetId('');
    setPulseTargetId('');
    setTransitionState(null);
    setShowFeedback(false);
    setCompletionStats(null);
    setAttempts(0);
  };

  const finishActivity = (nextAttempts, nextCompletedTargets) => {
    const responseTime = Date.now() - startTime;
    const timeSpent = Math.floor(responseTime / 1000);
    setCompletionStats({
      correctAnswers: 1,
      wrongAnswers: Math.max(nextAttempts - totalSteps, 0),
      attempts: [nextAttempts],
      prompts: [therapistControlsEnabled ? therapistPromptLevel : 'none'],
      timeSpent,
      responseTime,
      selectedAnswer: nextCompletedTargets.join(','),
      isCorrect: true,
    });
    setShowFeedback(true);
  };

  const handleItemSelect = (item) => {
    if (!currentStep || showFeedback) return;

    onAssistantInteraction?.();
    setPulseTargetId('');
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (item.id !== currentTargetId) {
      playErrorSound();
      setWrongTargetId(item.id);
      window.setTimeout(() => setWrongTargetId(''), 520);
      return;
    }

    playMoveSound();
    const nextCompletedTargets = [...completedTargets, item.id];
    setCompletedTargets(nextCompletedTargets);

    const isLastStep = currentStepIndex >= commandSteps.length - 1;
    if (isLastStep) {
      finishActivity(nextAttempts, nextCompletedTargets);
      return;
    }

    const nextStep = commandSteps[currentStepIndex + 1];
    const nextTargetId = getStepTargetId(nextStep);
    setTransitionState({
      key: `${item.id}-${nextTargetId}-${Date.now()}`,
      fromId: item.id,
      toId: nextTargetId,
    });
    setCurrentStepIndex((current) => current + 1);
  };

  const getItemState = (item) => {
    if (wrongTargetId === item.id) return 'wrong';
    if (completedTargets.includes(item.id)) return 'correct';
    if (pulseTargetId === item.id || currentTargetId === item.id) return 'hint';
    return 'idle';
  };

  return (
    <GameContainer
      className="max-w-4xl"
      dir="rtl"
      style={{ maxWidth: 'min(100%, clamp(22rem, 58vw, 48rem))' }}
    >
      <ChildGameBackdrop previewMode={previewMode} />

      <GameHeader
        instruction={instructionAr}
        avatarState={avatarState}
        onPlayAudio={playInstruction}
        onRestart={resetActivity}
      />

      <StepProgress current={currentStepIndex} total={totalSteps} />

      <div ref={sceneRef} className="relative mx-auto w-full">
        <GameGrid
          className="mx-auto w-full max-w-4xl justify-items-center"
          minWidth="clamp(118px, 18vw, 172px)"
          forceAutoFit
        >
          {items.map((item, index) => {
            const completedIndex = completedTargets.indexOf(item.id);
            const isCompleted = completedIndex >= 0;
            const isPreviousCompleted = isCompleted && completedIndex < completedTargets.length - 1;
            const state = getItemState(item);

            return (
              <GameChoice
                key={item.id || index}
                ref={(node) => {
                  if (node) itemRefs.current[item.id] = { current: node };
                }}
                onClick={() => handleItemSelect(item)}
                state={state}
                className={`min-h-[clamp(142px,20vw,190px)] w-full max-w-[220px] ${
                  state === 'wrong' ? 'animate-pulse' : ''
                }`}
              >
                {isCompleted && (
                  <StepBadge index={completedIndex + 1} done={isPreviousCompleted} />
                )}

                <GameImage
                  src={item.image}
                  alt={item.labelAr || item.textAr || `item-${index + 1}`}
                  className="flex-1"
                  fit="contain"
                  emptyLabel="\u0635\u0648\u0631\u0629"
                />

                {!!(item.labelAr || item.textAr) && (
                  <div className="mt-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 md:text-sm">
                    {item.labelAr || item.textAr}
                  </div>
                )}
              </GameChoice>
            );
          })}
        </GameGrid>

        {transitionState && (
          <StepTransitionAnimation
            runKey={transitionState.key}
            fromRef={itemRefs.current[transitionState.fromId]}
            toRef={itemRefs.current[transitionState.toId]}
            containerRef={sceneRef}
            onComplete={() => {
              setTransitionState(null);
              setPulseTargetId(transitionState.toId);
              window.setTimeout(() => setPulseTargetId(''), 1100);
            }}
          />
        )}
      </div>

      <FeedbackModal
        show={showFeedback}
        isCorrect
        onNext={() => {
          if (previewMode) {
            resetActivity();
            return;
          }
          if (completionStats) onComplete(completionStats);
        }}
        successSound={successSound}
        failSound={failSound}
      />
    </GameContainer>
  );
}
