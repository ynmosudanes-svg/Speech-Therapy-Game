import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

function DraggableSequenceItem({ item, index }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `source-${item.id}`,
    data: { item, sourceIndex: index },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 50 : 1,
        opacity: isDragging ? 0.75 : 1,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative touch-none select-none cursor-grab active:cursor-grabbing bg-white rounded-[1.6rem] border-2 shadow-md p-2 transition-all duration-150 will-change-transform hover:shadow-lg hover:-translate-y-1 ${
        item.physicalHighlight
          ? 'border-emerald-500 bg-emerald-50 shadow-[0_0_0_6px_rgba(5,150,105,0.25)] scale-105'
          : item.gestureHighlight
            ? 'border-amber-400 bg-amber-50 shadow-[0_0_0_4px_rgba(217,119,6,0.18)]'
            : item.highlighted
              ? 'border-[#168FC7] bg-[#eef7fc] shadow-[0_0_0_4px_rgba(22,143,199,0.18)] animate-pulse'
              : 'border-blue-100'
      }`}
    >
      {/* Physical prompt: show order number */}
      {item.physicalHighlight && item.order && (
        <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-black flex items-center justify-center shadow-md z-20">
          {item.order}
        </div>
      )}
      {/* Gesture arrow */}
      {item.gestureHighlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-amber-500 text-2xl animate-bounce z-10">
          👇
        </div>
      )}
      {item.image ? (
        <img
          src={item.image}
          alt={item.labelAr || 'خطوة'}
          className="pointer-events-none w-28 h-28 md:w-32 md:h-32 object-contain rounded-xl bg-slate-50"
        />
      ) : (
        <div className="w-28 h-28 md:w-32 md:h-32 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs font-black text-center">
          صورة الخطوة
        </div>
      )}
      {item.labelAr && <div className="text-center text-sm font-bold text-slate-700 mt-1 truncate px-1">{item.labelAr}</div>}
    </div>
  );
}

function DroppableSlot({ slotIndex, placedItem }) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${slotIndex}` });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col items-center justify-center rounded-[1.6rem] border-2 border-dashed transition-all min-h-[150px] md:min-h-[170px] w-full ${
        isOver
          ? 'border-blue-500 bg-blue-50 scale-105'
          : placedItem
            ? 'border-green-300 bg-green-50'
            : 'border-slate-300 bg-slate-50'
      }`}
    >
      <div className="text-xs font-black text-slate-400 mb-1">{slotIndex + 1}</div>
      {placedItem ? (
        <div className="p-1">
          {placedItem.image ? (
            <img
              src={placedItem.image}
              alt={placedItem.labelAr || 'خطوة'}
              className="pointer-events-none w-28 h-28 md:w-32 md:h-32 object-contain rounded-xl"
            />
          ) : (
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs font-black text-center">
              صورة
            </div>
          )}
          {placedItem.labelAr && <div className="text-center text-xs font-bold text-slate-700 mt-1 truncate">{placedItem.labelAr}</div>}
        </div>
      ) : (
        <div className="text-3xl text-slate-300">+</div>
      )}
    </div>
  );
}

const SequenceGame = ({
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
  const [availableItems, setAvailableItems] = useState([]);
  const [placedItems, setPlacedItems] = useState([]);
  const [attempts, setAttempts] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [startTime] = useState(Date.now());

  /* ── Hint states ── */
  const [highlightedStepId, setHighlightedStepId] = useState(null);
  const [gestureStepId, setGestureStepId] = useState(null);
  const [physicalMode, setPhysicalMode] = useState(false);

  const instructionAr =
    config?.content?.instructionAr || game?.questionTextAr || game?.instructionTextAr || game?.instructionText || 'رتب الخطوات';
  const instructionAudio = config?.content?.instructionAudio || game?.questionAudio || game?.instructionAudio || '';
  const steps = useMemo(() => {
    if (Array.isArray(config?.content?.steps)) return config.content.steps;
    if (Array.isArray(game?.items)) return game.items;
    return [];
  }, [config, game]);

  const successSound = config?.feedback?.successSound || game?.successSound || '';
  const failSound = config?.feedback?.failSound || game?.failSound || '';
  const avatarState = showFeedback ? (feedback === 'success' ? 'celebration' : 'error') : 'learning';

  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 4 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 3 } });
  const sensors = useSensors(mouseSensor, touchSensor);

  useEffect(() => {
    if (!steps.length) {
      setAvailableItems([]);
      setPlacedItems([]);
      return;
    }

    setCompleted(false);
    setFeedback(null);
    setShowFeedback(false);
    setAttempts(0);
    setPlacedItems(new Array(steps.length).fill(null));
    setAvailableItems([...steps].sort(() => Math.random() - 0.5));

    if (!previewMode && instructionAudio) playAudioUrl(instructionAudio);
  }, [steps, instructionAudio, previewMode]);

  const resetBoard = useCallback(() => {
    setCompleted(false);
    setFeedback(null);
    setShowFeedback(false);
    setPlacedItems(new Array(steps.length).fill(null));
    setAvailableItems([...steps].sort(() => Math.random() - 0.5));
    setHighlightedStepId(null);
    setGestureStepId(null);
    setPhysicalMode(false);
  }, [steps]);

  /* ── Register 4 assistant callbacks ── */
  useEffect(() => {
    if (!registerAssistantActions) {
      return undefined;
    }

    registerAssistantActions({
      /* Visual: highlight the next needed step */
      onVisualHint: () => {
        const nextOrder = placedItems.filter(Boolean).length + 1;
        const nextStep = steps.find((item) => Number(item.order) === nextOrder) || steps.find((item) => Number(item.order) === 1);
        setHighlightedStepId(nextStep?.id || null);
        window.setTimeout(() => setHighlightedStepId(null), 2500);
      },

      /* Gesture: arrow pointing to next step */
      onGestureHint: () => {
        const nextOrder = placedItems.filter(Boolean).length + 1;
        const nextStep = steps.find((item) => Number(item.order) === nextOrder);
        setGestureStepId(nextStep?.id || null);
        window.setTimeout(() => setGestureStepId(null), 3000);
      },

      /* Verbal: speak the hint */
      onVerbalHint: () => {
        const nextOrder = placedItems.filter(Boolean).length + 1;
        const nextStep = steps.find((item) => Number(item.order) === nextOrder);
        const hint = nextStep?.labelAr
          ? `الخطوة التالية هي "${nextStep.labelAr}"`
          : `دور على الخطوة رقم ${nextOrder}`;
        if (helpVoiceEnabled) speakArabic(hint);
      },

      /* Physical: show all order numbers on steps */
      onPhysicalPrompt: () => {
        setPhysicalMode(true);
        window.setTimeout(() => setPhysicalMode(false), 4000);
        if (helpVoiceEnabled) {
          speakArabic('هوريك ترتيب الخطوات كلها! بص على الأرقام.');
        }
      },
    });

    return () => registerAssistantActions({});
  }, [helpVoiceEnabled, instructionAudio, placedItems, registerAssistantActions, steps]);

  const checkCompletion = useCallback(
    (placed) => {
      if (placed.some((item) => item === null)) return;

      const nextAttempt = attempts + 1;
      setAttempts(nextAttempt);

      const isCorrectOrder = placed.every((item, index) => Number(item.order) === index + 1);

      if (!isCorrectOrder) {
        setFeedback('error');
        setShowFeedback(true);
        if (failSound) playAudioUrl(failSound);
        else playErrorSound();
        return;
      }

      setCompleted(true);
      setFeedback('success');
      setShowFeedback(true);
      if (successSound) playAudioUrl(successSound);
      else playSuccessSound();

      confetti({
        particleCount: 180,
        spread: 100,
        origin: { y: 0.55 },
        colors: ['#2563eb', '#f59e0b', '#10b981', '#ec4899'],
      });
    },
    [attempts, failSound, successSound]
  );

  const handleFeedbackNext = () => {
    setShowFeedback(false);

    if (feedback === 'error') {
      resetBoard();
      return;
    }

    if (feedback !== 'success') return;

    if (previewMode) {
      resetBoard();
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

  const handleDragEnd = ({ active, over }) => {
    if (!over || completed) return;
    onAssistantInteraction?.();

    // Clear hints on interaction
    setHighlightedStepId(null);
    setGestureStepId(null);
    setPhysicalMode(false);

    const slotMatch = String(over.id).match(/^slot-(\d+)$/);
    if (!slotMatch) return;

    const slotIndex = Number(slotMatch[1]);
    const draggedItem = active.data.current?.item;
    if (!draggedItem || placedItems[slotIndex] !== null) return;

    const nextPlacedItems = [...placedItems];
    nextPlacedItems[slotIndex] = draggedItem;
    setPlacedItems(nextPlacedItems);
    setAvailableItems((current) => current.filter((item) => item.id !== draggedItem.id));

    if (!nextPlacedItems.some((item) => item === null)) checkCompletion(nextPlacedItems);
  };

  /* ── Decorate items with hint flags ── */
  const decorateItem = (item) => ({
    ...item,
    highlighted: highlightedStepId === item.id,
    gestureHighlight: gestureStepId === item.id,
    physicalHighlight: physicalMode,
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6" dir="rtl">
      <GameHeader
        instruction={instructionAr}
        avatarState={avatarState}
        onPlayAudio={() => {
          if (instructionAudio) playAudioUrl(instructionAudio);
          else speakArabic(instructionAr);
        }}
        onRestart={resetBoard}
      />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="bg-white rounded-[2rem] p-4 md:p-6 border-2 border-[#dbe7f3] shadow-sm">
          <div className="text-sm font-bold text-blue-600 mb-3 text-center">ضع الصور هنا بالترتيب الصحيح</div>
          <div className={`grid gap-4 md:gap-5 ${steps.length <= 3 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}>
            {placedItems.map((item, index) => (
              <DroppableSlot key={index} slotIndex={index} placedItem={item} />
            ))}
          </div>
        </div>

        {availableItems.length > 0 && (
          <div className="bg-white/70 backdrop-blur-sm p-4 md:p-6 rounded-[2rem] border border-[#dbe7f3]">
            <div className="text-sm font-bold text-slate-500 mb-3 text-center">اسحب الصور من هنا</div>
            <div className="flex flex-wrap justify-center gap-5 md:gap-6">
              {availableItems.map((item, index) => (
                <DraggableSequenceItem key={item.id} item={decorateItem(item)} index={index} />
              ))}
            </div>
          </div>
        )}
      </DndContext>

      <FeedbackModal
        show={showFeedback}
        isCorrect={feedback === 'success'}
        onNext={handleFeedbackNext}
        successSound={successSound}
        failSound={failSound}
      />
    </div>
  );
};

export default SequenceGame;
