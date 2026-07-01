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
import { motion, AnimatePresence } from 'framer-motion';
import FeedbackModal from '../components/FeedbackModal';
import GameHeader from '../components/game/GameHeader';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import {
  GAME_ASSISTANT_HINT_CLASS,
  GameCard,
  GameContainer,
  GameSection,
  GameImage,
} from '../components/game/GameUI';
import { playAudioUrl, playErrorSound, playSuccessSound } from '../utils/soundEffects';
import ChildGameBackdrop from './ChildGameBackdrop';

function DraggableFoodCard({ item, disabled, matched }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item },
    disabled,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 999 : 1,
        opacity: isDragging ? 0.9 : 1,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative flex w-28 shrink-0 flex-col items-center gap-1 ${
        disabled ? 'cursor-not-allowed opacity-0 scale-0' : 'cursor-grab active:cursor-grabbing hover:-translate-y-1 hover:scale-105'
      } transition-transform duration-150 ${isDragging ? 'z-[999] rotate-2 scale-105' : ''}`}
    >
      <GameCard
        as="div"
        className={`flex h-28 w-28 items-center justify-center overflow-hidden ${
          item.highlighted ? GAME_ASSISTANT_HINT_CLASS : 'border-[#dbe7f3] bg-white/94'
        } ${isDragging ? 'shadow-xl' : ''}`}
      >
        {item.image ? (
          <div className="h-full w-full p-2 flex items-center justify-center">
            <img src={item.image} alt={item.labelAr} className="max-w-full max-h-full object-contain" />
          </div>
        ) : (
          <div className="flex items-center justify-center text-4xl sm:text-5xl">{item.emoji || '\uD83C\uDF7D\uFE0F'}</div>
        )}
      </GameCard>
    </div>
  );
}

function TrayDropZone({ trayImage, isOverTray, droppedItems }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'tray-drop-zone' });

  return (
    <GameSection className="relative z-10 w-full">
      <div 
        ref={setNodeRef}
        className={`w-full max-w-5xl aspect-[4/3] md:aspect-[16/9] lg:aspect-[21/9] rounded-3xl p-6 md:p-8 flex items-center justify-center transition-all duration-500 relative ${
          isOver ? 'ring-4 ring-amber-400 ring-offset-4 scale-[1.02]' : ''
        }`}
      >
        {trayImage ? (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-2 z-0">
            <img src={trayImage} alt="Tray" className="max-w-full max-h-full object-contain drop-shadow-md" />
          </div>
        ) : (
          <div className="absolute inset-0 z-0 pointer-events-none px-8 py-4">
            <div className="w-full h-full relative flex items-center justify-center">
              {/* Outer Handles */}
              <div className="absolute left-[-20px] md:left-[-30px] top-1/2 -translate-y-1/2 w-12 md:w-16 h-32 md:h-40 rounded-[2rem] bg-[#6d441e] shadow-lg border-4 border-[#8b5a2b] z-0"></div>
              <div className="absolute right-[-20px] md:right-[-30px] top-1/2 -translate-y-1/2 w-12 md:w-16 h-32 md:h-40 rounded-[2rem] bg-[#6d441e] shadow-lg border-4 border-[#8b5a2b] z-0"></div>

              {/* Tray Body */}
              <div className="w-full h-full rounded-[2.5rem] border-[16px] md:border-[24px] border-[#8b5a2b] relative overflow-hidden shadow-xl z-10"
                style={{
                  background: 'linear-gradient(135deg, #d4a373 0%, #b88655 100%)',
                  borderTopColor: '#a86f38',
                  borderBottomColor: '#6d441e',
                  borderLeftColor: '#8b5a2b',
                  borderRightColor: '#8b5a2b',
                  boxShadow: 'inset 0 20px 30px rgba(0,0,0,0.4), inset 0 -10px 20px rgba(0,0,0,0.1), 0 10px 25px -5px rgba(0,0,0,0.4)'
                }}
              >
                {/* Wooden Texture Overlay */}
                <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-multiply"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(0,0,0,0.5) 4px, rgba(0,0,0,0.5) 8px)'
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Dropped items area */}
        <div className="absolute inset-0 z-10 flex flex-wrap content-center items-center justify-center gap-1.5 p-3 sm:gap-2 sm:p-5 md:gap-4 md:p-8">
          <AnimatePresence>
            {droppedItems.map((item, idx) => (
              <motion.div
                key={`${item.id}-${idx}`}
                initial={{ scale: 0, y: -20 }}
                animate={{ scale: 1, y: 0 }}
                className="flex h-12 w-12 flex-col items-center justify-center rounded-lg border-2 border-white bg-white/80 shadow-lg backdrop-blur-sm sm:h-16 sm:w-16 sm:rounded-xl md:h-20 md:w-20 md:rounded-2xl"
              >
                {item.image ? (
                  <div className="flex h-full w-full items-center justify-center p-1 sm:p-2">
                    <img src={item.image} alt={item.labelAr} className="max-w-full max-h-full object-contain" />
                  </div>
                ) : (
                  <div className="text-4xl sm:text-5xl">{item.emoji || '🍽️'}</div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </GameSection>
  );
}

const BreakfastTrayGame = ({
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
  const [droppedItems, setDroppedItems] = useState([]);
  const [isOverTray, setIsOverTray] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());
  const { speak } = useSpeechSynthesis();
  const [visualPulse, setVisualPulse] = useState(false);

  const content = config?.content || {};
  const feedbackConfig = config?.feedback || {};
  const instructionAr = content?.instructionAr || 'اكتب التعليمات هنا';
  const instructionAudio = content?.questionAudio || content?.instructionAudio || '';
  const trayImage = content?.trayImage || content?.sceneImage || '';
  const items = Array.isArray(content?.items) ? content.items : [];
  
  // Level rules
  const levelMode = content?.levelMode || 'multi';
  const targetCategory = content?.targetCategory;
  const targetColor = content?.targetColor;
  const targetQuantity = content?.targetQuantity || 1;
  const orderedTargets = Array.isArray(content?.orderedTargets) ? content.orderedTargets : [];
  const targetIds = items.filter(item => item.isTarget).map(item => item.id);

  const avatarState = showModal ? (feedback === 'success' ? 'celebration' : 'error') : 'learning';

  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 2 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { distance: 2 } });
  const sensors = useSensors(mouseSensor, touchSensor);

  const availableItems = items.filter(item => !droppedItems.some(dropped => dropped.id === item.id));

  useEffect(() => {
    setDroppedItems([]);
    setIsOverTray(false);
    setFeedback(null);
    setAttempts(0);
  }, [game?.id]);

  useEffect(() => {
    if (instructionAudio && !previewMode) playAudioUrl(instructionAudio);
  }, [instructionAudio, previewMode]);

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
        setTimeout(() => setVisualPulse(false), 2000);
      },
      onVerbalHint: () => {
        if (helpVoiceEnabled) speak('حاول وضع العنصر الصحيح في الصينية.');
      },
    });

    return () => registerAssistantActions({});
  }, [helpVoiceEnabled, registerAssistantActions, speak]);

  const decorateItems = (itemsList) =>
    itemsList.map((item) => ({
      ...item,
      highlighted: visualPulse && isItemTarget(item),
    }));

  const isItemTarget = (item) => {
    switch (levelMode) {
      case 'single':
      case 'multi':
      case 'multi_unordered':
        return targetIds.includes(item.id);
      case 'ordered':
        const nextExpectedId = orderedTargets[droppedItems.length];
        return item.id === nextExpectedId;
      case 'category':
        return item.category === targetCategory;
      case 'color':
        return item.color === targetColor;
      case 'quantity':
        return targetIds.includes(item.id) && droppedItems.length < targetQuantity;
      default:
        return targetIds.includes(item.id);
    }
  };

  const isGameComplete = (newDroppedItems) => {
    switch (levelMode) {
      case 'single':
        return newDroppedItems.length === 1;
      case 'multi':
      case 'multi_unordered':
        return newDroppedItems.length === targetIds.length;
      case 'ordered':
        return newDroppedItems.length === orderedTargets.length;
      case 'category':
        const expectedCatCount = items.filter(i => i.category === targetCategory).length;
        return newDroppedItems.length === expectedCatCount || newDroppedItems.length >= targetQuantity;
      case 'color':
        const expectedColCount = items.filter(i => i.color === targetColor).length;
        return newDroppedItems.length === expectedColCount || newDroppedItems.length >= targetQuantity;
      case 'quantity':
        return newDroppedItems.length === targetQuantity;
      default:
        return newDroppedItems.length === targetIds.length;
    }
  };

  const finishSuccess = (nextAttempts) => {
    if (feedbackConfig?.successSound) playAudioUrl(feedbackConfig.successSound);
    else playSuccessSound();

    setFeedback('success');
    setShowModal(true);

    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#10b981', '#3b82f6', '#ef4444'],
    });
  };

  const finishError = (message) => {
    if (feedbackConfig?.failSound) playAudioUrl(feedbackConfig.failSound);
    else playErrorSound();
    
    if (message && helpVoiceEnabled) {
      speak(message);
    }
  };

  const handleModalNext = () => {
    setShowModal(false);
    if (feedback === 'error') {
      setFeedback(null);
      return;
    }

    if (previewMode) {
      setDroppedItems([]);
      setFeedback(null);
      setAttempts(0);
      return;
    }

    const responseTime = Date.now() - startTime;
    const timeSpent = Math.floor(responseTime / 1000);
    let expectedCount = targetIds.length;
    if (levelMode === 'ordered') expectedCount = orderedTargets.length;
    if (levelMode === 'quantity') expectedCount = targetQuantity;
    const wrongAnswers = Math.max(attempts - expectedCount, 0);

    onComplete({
      correctAnswers: droppedItems.length,
      wrongAnswers,
      attempts: [attempts],
      prompts: [therapistControlsEnabled ? therapistPromptLevel : 'none'],
      timeSpent,
      responseTime,
      isCorrect: true,
    });
  };

  const handleDragOver = ({ over }) => {
    setIsOverTray(Boolean(over && over.id === 'tray-drop-zone'));
  };

  const handleDragEnd = ({ active, over }) => {
    setIsOverTray(false);
    onAssistantInteraction?.();
    setVisualPulse(false);

    if (!over || over.id !== 'tray-drop-zone') return;

    const item = active.data.current?.item;
    if (!item) return;

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (!isItemTarget(item)) {
      if (levelMode === 'ordered') {
        finishError('ليس هذا الدور. ابحث عن العنصر الصحيح.');
      } else {
        finishError('حاول مرة أخرى.');
      }
      return;
    }

    const nextDroppedItems = [...droppedItems, item];
    setDroppedItems(nextDroppedItems);
    
    if (feedbackConfig?.successSound) {
      playSuccessSound(); 
    }

    if (isGameComplete(nextDroppedItems)) {
      setTimeout(() => {
        finishSuccess(nextAttempts);
      }, 500);
    }
  };

  return (
    <GameContainer className="max-w-5xl" dir="rtl">
      <ChildGameBackdrop previewMode={previewMode} />
      <GameHeader
        instruction={instructionAr}
        avatarState={avatarState}
        onPlayAudio={playInstruction}
        onRestart={() => {
          setDroppedItems([]);
          setFeedback(null);
          setAttempts(0);
          setIsOverTray(false);
          setVisualPulse(false);
        }}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-6 md:space-y-8 flex flex-col items-center">
          <TrayDropZone trayImage={trayImage} isOverTray={isOverTray} droppedItems={droppedItems} />

          <GameSection className="relative z-50 w-full bg-white/60">
            <div className="flex flex-wrap items-center justify-center gap-3 p-3 pb-4 sm:gap-4 sm:p-4 sm:pb-6">
              <AnimatePresence>
                {decorateItems(availableItems).map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0, transition: { duration: 0.2 } }}
                  >
                    <DraggableFoodCard
                      item={item}
                      disabled={feedback === 'success'}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </GameSection>
        </div>
      </DndContext>

      <FeedbackModal
        show={showModal}
        isCorrect={feedback === 'success'}
        onNext={handleModalNext}
        successSound={feedbackConfig.successSound}
        failSound={feedbackConfig.failSound}
      />
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </GameContainer>
  );
};

export default BreakfastTrayGame;
