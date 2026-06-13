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
import { Volume2 } from 'lucide-react';
import FeedbackModal from '../components/FeedbackModal';
import GameHeader from '../components/game/GameHeader';
import { playAudioUrl, playErrorSound, playSuccessSound } from '../utils/soundEffects';

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
        opacity: isDragging ? 0.85 : 1,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`w-24 md:w-28 shrink-0 rounded-[1.4rem] border-2 bg-white p-2 shadow-sm transition-all ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing hover:-translate-y-1'
      } ${
        matched
          ? 'border-emerald-400 bg-emerald-50'
          : item.physicalHighlight
            ? 'border-emerald-500 bg-emerald-50 shadow-[0_0_0_6px_rgba(5,150,105,0.25)] scale-110'
            : item.gestureHighlight
              ? 'border-amber-400 bg-amber-50 shadow-[0_0_0_4px_rgba(217,119,6,0.18)]'
              : item.highlighted
                ? 'border-[#168FC7] bg-[#eef7fc] shadow-[0_0_0_4px_rgba(22,143,199,0.18)] animate-pulse'
                : 'border-[#dbe7f3]'
      }`}
    >
      {/* Gesture arrow */}
      {item.gestureHighlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-amber-500 text-2xl animate-bounce z-10">
          👇
        </div>
      )}
      {item.image ? (
        <img
          src={item.image}
          alt={item.labelAr || item.id}
          className="w-full h-20 md:h-24 object-contain rounded-xl bg-slate-50"
        />
      ) : (
        <div className="w-full h-20 md:h-24 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs font-black text-center px-2">
          صورة العنصر
        </div>
      )}
      {item.labelAr && <div className="text-center text-xs md:text-sm font-black text-slate-700 mt-2">{item.labelAr}</div>}
    </div>
  );
}

function DraggableTray({ title, items, feedback, matchedDraggableIds }) {
  if (!items.length) return null;

  return (
    <section className="rounded-[1.8rem] border border-[#dbe7f3] bg-white/90 p-4 shadow-sm">
      <div className="text-sm font-black text-slate-500 mb-3">{title}</div>
      <div className="flex flex-wrap justify-center gap-3">
        {items.map((item) => (
          <DraggableCard
            key={item.id}
            item={item}
            disabled={feedback === 'success' || matchedDraggableIds.includes(item.id)}
            matched={matchedDraggableIds.includes(item.id)}
          />
        ))}
      </div>
    </section>
  );
}

function SceneDropZone({ sceneImage, title, isOverScene, feedback }) {
  const { setNodeRef } = useDroppable({ id: 'scene-drop-zone' });

  return (
    <div
      ref={setNodeRef}
      className={`relative rounded-[2.4rem] border p-5 md:p-7 min-h-[340px] md:min-h-[400px] shadow-sm transition-all ${
        isOverScene ? 'border-blue-500 bg-blue-50' : 'border-[#dbe7f3] bg-[#f8fbff]'
      }`}
    >
      {sceneImage ? (
        <img
          src={sceneImage}
          alt={title || 'scene'}
          className="w-full h-[250px] md:h-[300px] object-contain rounded-[2rem] bg-white p-4 md:p-6"
        />
      ) : (
        <div className="w-full h-[250px] md:h-[300px] rounded-[2rem] bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 font-black">
          صورة المشهد
        </div>
      )}

      <div className="absolute top-4 left-4 rounded-full bg-white/95 px-4 py-2 text-sm font-black text-slate-700 shadow-sm">
        اسحب العنصر إلى المشهد
      </div>
    </div>
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

  /* ── Hint states ── */
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

  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 8 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 5 } });
  const sensors = useSensors(mouseSensor, touchSensor);

  useEffect(() => {
    setMatchedDraggableIds([]);
    setIsOverScene(false);
    setFeedback(null);
    setAttempts(0);
  }, [game?.id]);

  /* ── Auto-play instruction audio from the game ── */
  useEffect(() => {
    if (instructionAudio) playAudioUrl(instructionAudio);
  }, [instructionAudio]);

  const playInstruction = () => {
    if (instructionAudio) {
      playAudioUrl(instructionAudio);
      return;
    }

    if (typeof window !== 'undefined') {
      const utterance = new SpeechSynthesisUtterance(instructionAr);
      utterance.lang = 'ar-SA';
      window.speechSynthesis.speak(utterance);
    }
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
        setGestureArrow(true);
        window.setTimeout(() => setGestureArrow(false), 3000);
      },
      onVerbalHint: () => {
        const correctItem = draggables.find((d) => d.isCorrect);
        const hint = correctItem?.labelAr
          ? `جرّب تسحب "${correctItem.labelAr}" للمشهد.`
          : 'ركّز على العنصر الصح واسحبه للمشهد.';
        if (helpVoiceEnabled) speakArabic(hint);
      },
      onPhysicalPrompt: () => {
        setPhysicalHighlight(true);
        window.setTimeout(() => setPhysicalHighlight(false), 4000);
        if (helpVoiceEnabled) {
          const correctItem = draggables.find((d) => d.isCorrect);
          const hint = correctItem?.labelAr
            ? `اسحب "${correctItem.labelAr}" اللي بيلمع ده للمشهد!`
            : 'اسحب العنصر اللي بيلمع للمشهد!';
          speakArabic(hint);
        }
      },
    });

    return () => registerAssistantActions({});
  }, [helpVoiceEnabled, instructionAr, instructionAudio, draggables, registerAssistantActions]);

  /* ── Decorate items with hint flags ── */
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
      particleCount: 160,
      spread: 90,
      origin: { y: 0.6 },
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

    // Clear hints on interaction
    setVisualPulse(false);
    setGestureArrow(false);
    setPhysicalHighlight(false);

    if (!over || over.id !== 'scene-drop-zone') {
      return;
    }

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
    <div className="max-w-6xl mx-auto space-y-6" dir="rtl">
      <GameHeader
        instruction={instructionAr}
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

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="space-y-7 md:space-y-8">
          <SceneDropZone
            sceneImage={sceneImage}
            title={game?.titleAr}
            isOverScene={isOverScene}
            feedback={feedback}
          />

          <div className="grid grid-cols-1 gap-5 md:gap-6">
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
        </div>
      </DndContext>

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

export default DragDropGame;
