import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import confetti from 'canvas-confetti';
import FeedbackModal from '../components/FeedbackModal';
import GameHeader from '../components/game/GameHeader';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import {
  GAME_ASSISTANT_HINT_CLASS,
  GameCard,
  GameChoice,
  GameContainer,
  GameGrid,
  GameImage,
  GameSection,
} from '../components/game/GameUI';
import { playAudioUrl, playErrorSound, playSuccessSound } from '../utils/soundEffects';
import ChildGameBackdrop from './ChildGameBackdrop';

/* ───────── Concept labels & emoji map ───────── */
const CONCEPT_LABELS = {
  above_below: [
    { key: 'above', textAr: 'فوق', emoji: '⬆️' },
    { key: 'below', textAr: 'تحت', emoji: '⬇️' },
  ],
  inside_outside: [
    { key: 'inside', textAr: 'داخل', emoji: '📦' },
    { key: 'outside', textAr: 'خارج', emoji: '🌍' },
  ],
  front_behind: [
    { key: 'front', textAr: 'أمام', emoji: '➡️' },
    { key: 'behind', textAr: 'خلف', emoji: '⬅️' },
  ],
  right_left: [
    { key: 'right', textAr: 'يمين', emoji: '👉' },
    { key: 'left', textAr: 'يسار', emoji: '👈' },
  ],
  near_far: [
    { key: 'near', textAr: 'قريب', emoji: '🔍' },
    { key: 'far', textAr: 'بعيد', emoji: '🔭' },
  ],
};

/* ───────── Draggable Item (mode 3) ───────── */
function DraggableItem({ item, disabled }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { draggableId: item.id },
    disabled,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 40 : 1,
        opacity: isDragging ? 0.85 : 1,
      }
    : undefined;

  return (
    <GameCard
      as="div"
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative flex min-h-[clamp(100px,18vw,140px)] w-[clamp(100px,18vw,140px)] flex-col items-center justify-center ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing'
      } border-[#dbe7f3] bg-white/94`}
    >
      <GameImage
        src={item.image}
        alt={item.labelAr || item.id}
        className="flex-1"
        emptyLabel="اسحب العنصر"
      />
      {item.labelAr && (
        <div className="mt-1 text-center text-xs font-black text-slate-700">{item.labelAr}</div>
      )}
    </GameCard>
  );
}

/* ───────── Drop Zone overlay on scene (mode 3) ───────── */
function SceneDropZone({ sceneImage, dropZone, isOver, matched }) {
  const { setNodeRef } = useDroppable({ id: 'spatial-drop-zone' });

  const zoneStyle = dropZone
    ? {
        position: 'absolute',
        left: `${dropZone.x - dropZone.width / 2}%`,
        top: `${dropZone.y - dropZone.height / 2}%`,
        width: `${dropZone.width}%`,
        height: `${dropZone.height}%`,
      }
    : {};

  return (
    <GameSection>
      <div className="relative overflow-hidden rounded-[clamp(16px,1.6vw,20px)]">
        <GameImage
          src={sceneImage}
          alt="scene"
          ratio="4 / 3"
          fit="contain"
          className="mx-auto w-full max-w-[clamp(260px,48vw,460px)]"
          emptyLabel="صورة المشهد"
        />
        {dropZone && (
          <div
            ref={setNodeRef}
            className={`rounded-2xl border-[3px] border-dashed transition-all duration-300 ${
              matched
                ? 'border-emerald-400 bg-emerald-200/30'
                : isOver
                  ? 'border-sky-400 bg-sky-200/25 scale-105'
                  : 'border-amber-300/70 bg-amber-100/15'
            }`}
            style={zoneStyle}
          >
            {!matched && (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-xl opacity-50">📍</span>
              </div>
            )}
          </div>
        )}
      </div>
    </GameSection>
  );
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const SpatialConceptsGame = ({
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
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());
  const [dragMatched, setDragMatched] = useState(false);
  const [isOverDropZone, setIsOverDropZone] = useState(false);
  const { speak } = useSpeechSynthesis();
  const [visualPulse, setVisualPulse] = useState(false);

  /* ── Extract config ── */
  const content = config?.content || {};
  const feedbackConfig = config?.feedback || {};
  const instructionAr = content?.instructionAr || 'أين العنصر؟ اختر المفهوم المكاني الصحيح';
  const questionAudio = content?.questionAudio || '';
  const sceneImage = content?.sceneImage || '';
  const gameMode = content?.gameMode || 'choose_concept';
  const conceptType = content?.conceptType || 'above_below';
  const options = useMemo(
    () => (Array.isArray(content?.options) ? content.options : []),
    [content],
  );
  const dragItem = content?.dragItem || null;
  const dropZone = content?.dropZone || null;
  const successSound = feedbackConfig?.successSound || '';
  const failSound = feedbackConfig?.failSound || '';

  const avatarState = showFeedback ? (isCorrect ? 'celebration' : 'error') : 'learning';

  /* ── DnD sensors ── */
  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 8 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 5 } });
  const sensors = useSensors(mouseSensor, touchSensor);

  /* ── Play instruction audio on mount ── */
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

  /* ── Assistant actions ── */
  useEffect(() => {
    if (!registerAssistantActions) return undefined;

    registerAssistantActions({
      onVisualHint: () => {
        setVisualPulse(true);
      },
      onVerbalHint: () => {
        const correctOption = options.find((o) => o.isCorrect);
        const hint = correctOption?.textAr
          ? `ركز كويس، الإجابة هي "${correctOption.textAr}"`
          : 'ركز كويس وبص على الصور تاني.';
        if (helpVoiceEnabled) speak(hint);
      },
    });

    return () => registerAssistantActions({});
  }, [helpVoiceEnabled, options, registerAssistantActions]);

  /* ── Reset on game change ── */
  useEffect(() => {
    setSelectedOption(null);
    setShowFeedback(false);
    setIsCorrect(false);
    setAttempts(0);
    setDragMatched(false);
    setIsOverDropZone(false);
    setVisualPulse(false);
  }, [game?.id]);

  /* ── Handlers: Choose modes ── */
  const handleOptionSelect = (option) => {
    onAssistantInteraction?.();
    setVisualPulse(false);
    setAttempts((c) => c + 1);
    setSelectedOption(option);
    setIsCorrect(Boolean(option.isCorrect));
    setShowFeedback(true);
  };

  const handleNext = () => {
    setShowFeedback(false);

    if (!isCorrect) {
      setSelectedOption(null);
      return;
    }

    confetti({ particleCount: 120, spread: 70, origin: { y: 0.62 } });

    if (previewMode) {
      setSelectedOption(null);
      setDragMatched(false);
      return;
    }

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    onComplete({
      correctAnswers: 1,
      wrongAnswers: Math.max(attempts - 1, 0),
      attempts: [attempts],
      prompts: [therapistControlsEnabled ? therapistPromptLevel : 'none'],
      timeSpent,
    });
  };

  const handleRestart = () => {
    setSelectedOption(null);
    setShowFeedback(false);
    setIsCorrect(false);
    setAttempts(0);
    setDragMatched(false);
    setIsOverDropZone(false);
    setVisualPulse(false);
  };

  /* ── Handlers: Drag mode ── */
  const handleDragOver = ({ over }) => {
    setIsOverDropZone(Boolean(over && over.id === 'spatial-drop-zone'));
  };

  const handleDragEnd = ({ active, over }) => {
    setIsOverDropZone(false);
    onAssistantInteraction?.();
    setVisualPulse(false);

    if (!over || over.id !== 'spatial-drop-zone') return;

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    // Drag mode is always correct if dropped on the zone
    setDragMatched(true);
    setIsCorrect(true);
    setShowFeedback(true);

    if (successSound) playAudioUrl(successSound);
    else playSuccessSound();

    confetti({
      particleCount: 120,
      spread: 84,
      origin: { y: 0.62 },
      colors: ['#138fbc', '#10b981', '#f59e0b', '#ec4899'],
    });
  };

  const handleDragModalNext = () => {
    setShowFeedback(false);

    if (previewMode) {
      setDragMatched(false);
      setAttempts(0);
      return;
    }

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    onComplete({
      correctAnswers: 1,
      wrongAnswers: Math.max(attempts - 1, 0),
      attempts: [attempts],
      prompts: [therapistControlsEnabled ? therapistPromptLevel : 'none'],
      timeSpent,
    });
  };

  /* ═══════════════════════════════════════════
     RENDER: Mode 3 — Drag to Position
  ═══════════════════════════════════════════ */
  if (gameMode === 'drag_to_position') {
    return (
      <GameContainer className="max-w-4xl" dir="rtl">
        <ChildGameBackdrop previewMode={previewMode} />
        <GameHeader
          instruction={instructionAr}
          avatarState={avatarState}
          onPlayAudio={playInstruction}
          onRestart={handleRestart}
        />

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-4 md:space-y-5">
            <SceneDropZone
              sceneImage={sceneImage}
              dropZone={dropZone}
              isOver={isOverDropZone}
              matched={dragMatched}
            />

            {dragItem && !dragMatched && (
              <GameSection>
                <div className="flex items-center justify-center">
                  <DraggableItem item={dragItem} disabled={dragMatched} />
                </div>
              </GameSection>
            )}
          </div>
        </DndContext>

        <FeedbackModal
          show={showFeedback}
          isCorrect={isCorrect}
          onNext={handleDragModalNext}
          successSound={successSound}
          failSound={failSound}
        />
      </GameContainer>
    );
  }

  /* ═══════════════════════════════════════════
     RENDER: Mode 1 (choose_concept) & Mode 2 (choose_element)
  ═══════════════════════════════════════════ */
  const isConceptMode = gameMode === 'choose_concept';

  return (
    <GameContainer
      className="max-w-4xl"
      dir="rtl"
      style={{ maxWidth: 'min(100%, clamp(20rem, 52vw, 46rem))' }}
    >
      <ChildGameBackdrop previewMode={previewMode} />

      <GameHeader
        instruction={instructionAr}
        avatarState={avatarState}
        onPlayAudio={playInstruction}
        onRestart={handleRestart}
      />

      {/* Scene Image */}
      {sceneImage && (
        <GameSection className="mx-auto max-w-[clamp(220px,32vw,340px)]">
          <GameImage
            src={sceneImage}
            alt="المشهد"
            fit="contain"
            ratio="4 / 3"
            emptyLabel="صورة المشهد"
          />
        </GameSection>
      )}

      {/* Options */}
      <GameGrid
        className="mx-auto w-full max-w-3xl justify-items-center"
        minWidth={isConceptMode ? 'clamp(120px, 22vw, 160px)' : 'clamp(120px, 18vw, 184px)'}
      >
        {options.map((option, index) => {
          const isHinted = visualPulse && option.isCorrect;
          const state =
            selectedOption?.id === option.id
              ? isCorrect
                ? 'correct'
                : 'wrong'
              : isHinted
                ? 'hint'
                : 'idle';

          return (
            <GameChoice
              key={option.id || index}
              onClick={() => handleOptionSelect(option)}
              state={state}
              className={`relative w-full ${
                isConceptMode
                  ? 'max-w-[200px] min-h-[clamp(90px,14vw,130px)]'
                  : 'max-w-[220px] min-h-[clamp(124px,16vw,176px)] lg:max-w-[210px]'
              }`}
            >
              {/* Concept mode: emoji + text */}
              {isConceptMode && (
                <div className="flex flex-col items-center justify-center gap-2 py-2">
                  <span className="text-3xl md:text-4xl">{option.emoji || '📍'}</span>
                  <span className="text-base font-black text-slate-800 md:text-lg">
                    {option.textAr}
                  </span>
                </div>
              )}

              {/* Element mode: image + text */}
              {!isConceptMode && (
                <>
                  <GameImage
                    src={option.image}
                    alt={option.textAr || `option-${index + 1}`}
                    className="flex-1"
                    fit="contain"
                    emptyLabel="صورة الاختيار"
                  />
                  {!!option.textAr && (
                    <div className="mt-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 md:text-sm">
                      {option.textAr}
                    </div>
                  )}
                </>
              )}
            </GameChoice>
          );
        })}
      </GameGrid>

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

export default SpatialConceptsGame;
