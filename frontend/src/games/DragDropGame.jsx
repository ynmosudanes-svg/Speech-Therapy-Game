import React, { useEffect, useMemo, useState } from 'react';
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
  GameContainer,
  GameGrid,
  GameImage,
  GameSection,
} from '../components/game/GameUI';
import { playAudioUrl, playErrorSound, playSuccessSound } from '../utils/soundEffects';
import ChildGameBackdrop from './ChildGameBackdrop';


function DraggableCard({ item, disabled, matched }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { draggableId: item.id, isCorrect: Boolean(item.isCorrect) },
    disabled,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 40 : 1,
        opacity: isDragging ? 0.9 : 1,
      }
    : undefined;

  return (
    <GameCard
      as="div"
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative flex min-h-[clamp(104px,18vw,140px)] flex-col justify-center ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing'
      } ${
        matched
          ? 'border-emerald-300 bg-emerald-50/90'
          : item.physicalHighlight || item.gestureHighlight || item.highlighted
            ? GAME_ASSISTANT_HINT_CLASS
            : 'border-[#dbe7f3] bg-white/94'
      }`}
    >
      <GameImage
        src={item.image}
        alt={item.labelAr || item.id}
        className="flex-1"
        emptyLabel="صورة العنصر"
      />
      {item.labelAr && <div className="mt-2 text-center text-sm font-black text-slate-700">{item.labelAr}</div>}
    </GameCard>
  );
}

function DraggableTray({ title, items, feedback, matchedDraggableIds }) {
  if (!items.length) return null;

  return (
    <GameSection>
      <div className="mb-3 text-sm font-black text-slate-500">{title}</div>
      <GameGrid minWidth="clamp(96px, 18vw, 132px)">
        {items.map((item) => (
          <DraggableCard
            key={item.id}
            item={item}
            disabled={feedback === 'success' || matchedDraggableIds.includes(item.id)}
            matched={matchedDraggableIds.includes(item.id)}
          />
        ))}
      </GameGrid>
    </GameSection>
  );
}

function SceneDropZone({ sceneImage, isOverScene }) {
  const { setNodeRef } = useDroppable({ id: 'scene-drop-zone' });

  return (
    <GameSection>
      <div ref={setNodeRef} className={`${isOverScene ? 'ring-2 ring-sky-300' : ''} rounded-[clamp(20px,2.1vw,24px)]`}>
        <div className="mb-3 inline-flex rounded-full bg-white px-3 py-1 text-sm font-black text-slate-600">
          اسحب العنصر إلى المشهد
        </div>
        <GameImage
          src={sceneImage}
          alt="scene"
          ratio="4 / 3"
          fit="contain"
          className="mx-auto w-full max-w-[clamp(180px,34vw,340px)]"
          emptyLabel="صورة المشهد"
        />
      </div>
    </GameSection>
  );
}

const groupedPositions = (items) => ({
  left: items.filter((item) => item.startPosition === 'left'),
  right: items.filter((item) => item.startPosition === 'right'),
  bottom: items.filter((item) => item.startPosition === 'bottom' || !item.startPosition),
});

const DragDropGame = ({
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
  const [matchedDraggableIds, setMatchedDraggableIds] = useState([]);
  const [isOverScene, setIsOverScene] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());
  const { speak } = useSpeechSynthesis();
  const [visualPulse, setVisualPulse] = useState(false);
  const [gestureArrow, setGestureArrow] = useState(false);
  const [physicalHighlight, setPhysicalHighlight] = useState(false);

  const content = config?.content || {};
  const feedbackConfig = config?.feedback || {};
  const instructionAr = content?.instructionAr || 'اكتب التعليمات هنا';
  const instructionAudio = content?.instructionAudio || '';
  const sceneImage = content?.sceneImage || '';
  const draggables = Array.isArray(content?.draggables) ? content.draggables : [];
  const mode = content?.mode || 'one-to-one';
  const positionGroups = useMemo(() => groupedPositions(draggables), [draggables]);
  const totalNeededMatches = mode === 'multi-match' ? draggables.filter((item) => item.isCorrect).length : 1;
  const avatarState = showModal ? (feedback === 'success' ? 'celebration' : 'error') : 'learning';

  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 8 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 5 } });
  const sensors = useSensors(mouseSensor, touchSensor);

  useEffect(() => {
    setMatchedDraggableIds([]);
    setIsOverScene(false);
    setFeedback(null);
    setAttempts(0);
  }, [game?.id]);

  useEffect(() => {
    if (instructionAudio) playAudioUrl(instructionAudio);
  }, [instructionAudio]);

  const playInstruction = () => {
    if (instructionAudio) {
      playAudioUrl(instructionAudio);
      return;
    }
    speak(instructionAr);
  };

  useEffect(() => {
    if (!registerAssistantActions) return undefined;

    registerAssistantActions({
      onVisualHint: () => {
        setVisualPulse(true);
      },
      onGestureHint: () => {
        setGestureArrow(true);
        window.setTimeout(() => setGestureArrow(false), 3000);
      },
      onVerbalHint: () => {
        const correctItem = draggables.find((d) => d.isCorrect);
        const hint = correctItem?.labelAr
          ? `جرب تسحب "${correctItem.labelAr}" للمشهد.`
          : 'ركز على العنصر الصحيح واسحبه للمشهد.';
        if (helpVoiceEnabled) speak(hint);
      },
      onPhysicalPrompt: () => {
        setPhysicalHighlight(true);
        window.setTimeout(() => setPhysicalHighlight(false), 4000);
      },
    });

    return () => registerAssistantActions({});
  }, [draggables, helpVoiceEnabled, registerAssistantActions]);

  const decorateItems = (items) =>
    items.map((item) => ({
      ...item,
      highlighted: visualPulse && item.isCorrect,
      gestureHighlight: gestureArrow && item.isCorrect,
      physicalHighlight: physicalHighlight && item.isCorrect,
    }));

  const finishSuccess = (nextAttempts, nextMatchedIds) => {
    if (feedbackConfig?.successSound) playAudioUrl(feedbackConfig.successSound);
    else playSuccessSound();

    setFeedback('success');
    setShowModal(true);

    confetti({
      particleCount: 120,
      spread: 84,
      origin: { y: 0.62 },
      colors: ['#138fbc', '#10b981', '#f59e0b', '#ec4899'],
    });
  };

  const finishError = () => {
    if (feedbackConfig?.failSound) playAudioUrl(feedbackConfig.failSound);
    else playErrorSound();
    setFeedback('error');
    setShowModal(true);
  };

  const handleModalNext = () => {
    setShowModal(false);
    if (feedback === 'error') {
      setFeedback(null);
      return;
    }

    if (previewMode) {
      setMatchedDraggableIds([]);
      setFeedback(null);
      setAttempts(0);
      return;
    }

    const responseTime = Date.now() - startTime;
    const timeSpent = Math.floor(responseTime / 1000);
    const wrongAnswers = Math.max(attempts - totalNeededMatches, 0);

    onComplete({
      correctAnswers: matchedDraggableIds.length,
      wrongAnswers,
      attempts: [attempts],
      prompts: [therapistControlsEnabled ? therapistPromptLevel : 'none'],
      timeSpent,
      responseTime,
      isCorrect: true,
    });
  };

  const handleDragOver = ({ over }) => {
    setIsOverScene(Boolean(over && over.id === 'scene-drop-zone'));
  };

  const handleDragEnd = ({ active, over }) => {
    setIsOverScene(false);
    onAssistantInteraction?.();
    setVisualPulse(false);
    setGestureArrow(false);
    setPhysicalHighlight(false);

    if (!over || over.id !== 'scene-drop-zone') return;

    const draggableId = String(active.id);
    const isCorrect = Boolean(active.data.current?.isCorrect);
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (!isCorrect || matchedDraggableIds.includes(draggableId)) {
      finishError();
      return;
    }

    const nextMatchedIds = [...matchedDraggableIds, draggableId];
    setMatchedDraggableIds(nextMatchedIds);

    const isCompleted = mode === 'multi-match' ? nextMatchedIds.length >= totalNeededMatches : true;
    if (isCompleted) {
      finishSuccess(nextAttempts, nextMatchedIds);
    }
  };

  return (
    <GameContainer className="max-w-4xl" dir="rtl">
      <ChildGameBackdrop previewMode={previewMode} />
      <GameHeader
        instruction={instructionAr}
        avatarState={avatarState}
        onPlayAudio={playInstruction}
        onRestart={() => {
          setMatchedDraggableIds([]);
          setFeedback(null);
          setAttempts(0);
          setIsOverScene(false);
          setVisualPulse(false);
          setGestureArrow(false);
          setPhysicalHighlight(false);
        }}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-4 md:space-y-5">
          <SceneDropZone sceneImage={sceneImage} isOverScene={isOverScene} />

          <DraggableTray
            title="عناصر من اليسار"
            items={decorateItems(positionGroups.left)}
            feedback={feedback}
            matchedDraggableIds={matchedDraggableIds}
          />
          <DraggableTray
            title="عناصر من اليمين"
            items={decorateItems(positionGroups.right)}
            feedback={feedback}
            matchedDraggableIds={matchedDraggableIds}
          />
          <DraggableTray
            title="عناصر من الأسفل"
            items={decorateItems(positionGroups.bottom)}
            feedback={feedback}
            matchedDraggableIds={matchedDraggableIds}
          />
        </div>
      </DndContext>

      <FeedbackModal
        show={showModal}
        isCorrect={feedback === 'success'}
        onNext={handleModalNext}
        successSound={feedbackConfig.successSound}
        failSound={feedbackConfig.failSound}
      />
    </GameContainer>
  );
};

export default DragDropGame;
