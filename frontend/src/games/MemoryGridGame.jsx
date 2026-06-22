import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import BirdHint from '../components/game/BirdHint';
import GameHeader from '../components/game/GameHeader';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import { GAME_ASSISTANT_HINT_CLASS, GameContainer, GameSection } from '../components/game/GameUI';
import { useTherapySounds } from '../hooks/useTherapySounds';
import { playAudioUrl } from '../utils/soundEffects';
import ChildGameBackdrop from './ChildGameBackdrop';

const FALLBACK_ITEMS = [
  { id: 'cat', textAr: 'قطة', emoji: '🐱', category: 'animals' },
  { id: 'dog', textAr: 'كلب', emoji: '🐶', category: 'animals' },
  { id: 'lion', textAr: 'أسد', emoji: '🦁', category: 'animals' },
  { id: 'apple', textAr: 'تفاحة', emoji: '🍎', category: 'fruits' },
  { id: 'banana', textAr: 'موزة', emoji: '🍌', category: 'fruits' },
  { id: 'car', textAr: 'سيارة', emoji: '🚗', category: 'vehicles' },
  { id: 'ball', textAr: 'كرة', emoji: '⚽', category: 'objects' },
  { id: 'house', textAr: 'بيت', emoji: '🏠', category: 'household' },
  { id: 'star', textAr: 'نجمة', emoji: '⭐', category: 'shapes' },
  { id: 'circle', textAr: 'دائرة', emoji: '🔵', category: 'shapes' },
  { id: 'book', textAr: 'كتاب', emoji: '📘', category: 'household' },
  { id: 'cup', textAr: 'كوب', emoji: '🥤', category: 'household' },
  { id: 'fish', textAr: 'سمكة', emoji: '🐟', category: 'animals' },
  { id: 'grapes', textAr: 'عنب', emoji: '🍇', category: 'fruits' },
  { id: 'bus', textAr: 'أتوبيس', emoji: '🚌', category: 'vehicles' },
  { id: 'pizza', textAr: 'بيتزا', emoji: '🍕', category: 'food' },
];

const DIFFICULTY_SETTINGS = {
  easy: { gridSize: 2, viewSeconds: 5, label: 'سهل' },
  medium: { gridSize: 3, viewSeconds: 4, label: 'متوسط' },
  hard: { gridSize: 4, viewSeconds: 3, label: 'صعب' },
};

const shuffle = (items) => {
  const nextItems = [...items];
  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [nextItems[index], nextItems[randomIndex]] = [nextItems[randomIndex], nextItems[index]];
  }
  return nextItems;
};

const normalizeItems = (cards = [], neededCount = 9) => {
  const cleanCards = cards
    .filter((card) => card?.image || card?.textAr || card?.emoji)
    .map((card, index) => ({
      id: String(card.id || `grid_item_${index}`),
      image: card.image || '',
      textAr: card.textAr || card.labelAr || card.label || '',
      audioUrl: card.audioUrl || '',
      emoji: card.emoji || '',
      category: card.category || '',
    }));

  const merged = [...cleanCards, ...FALLBACK_ITEMS.filter((fallback) => !cleanCards.some((card) => card.id === fallback.id))];
  return merged.slice(0, neededCount);
};

const speakTarget = (card, speak) => {
  if (!card) return;
  if (card.audioUrl) {
    playAudioUrl(card.audioUrl);
    return;
  }
  if (card.textAr) {
    speak(`ابحث عن ${card.textAr}`);
  }
};

const MemoryGridGame = ({
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
  const feedback = config?.feedback || {};
  const difficulty = content.difficulty || 'medium';
  const difficultySettings = DIFFICULTY_SETTINGS[difficulty] || DIFFICULTY_SETTINGS.medium;
  const gridSize = Number(content.gridSize || difficultySettings.gridSize);
  const viewSeconds = Number(content.viewSeconds || difficultySettings.viewSeconds);
  const neededCount = Math.max(4, gridSize * gridSize);
  const items = useMemo(() => normalizeItems(content.cards, neededCount), [content.cards, neededCount]);
  const instructionAr = content.instructionAr || 'تذكر أماكن الصور ثم ابحث عن الصورة المطلوبة';
  const instructionAudio = content.instructionAudio || '';

  const [gridItems, setGridItems] = useState(() => shuffle(items));
  const [targetItem, setTargetItem] = useState(() => items[0] || null);
  const [phase, setPhase] = useState('preview');
  const [secondsLeft, setSecondsLeft] = useState(viewSeconds);
  const [selectedId, setSelectedId] = useState(null);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [stars, setStars] = useState(0);
  const [hintTarget, setHintTarget] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const completionSentRef = useRef(false);
  const { playTap, playCorrect, playWrong, playLevelComplete } = useTherapySounds({ soundEnabled: true });
  const { speak } = useSpeechSynthesis();

  const resetGame = useCallback(() => {
    const nextItems = shuffle(items);
    setGridItems(nextItems);
    setTargetItem(items[0] || null);
    setPhase('preview');
    setSecondsLeft(viewSeconds);
    setSelectedId(null);
    setWrongAnswers(0);
    setStars(0);
    setHintTarget(false);
    setStartTime(Date.now());
    completionSentRef.current = false;
  }, [items, viewSeconds]);

  useEffect(() => {
    resetGame();
  }, [game?.id, resetGame]);

  const playInstruction = useCallback(() => {
    if (instructionAudio) {
      playAudioUrl(instructionAudio);
      return;
    }
    speak(instructionAr);
  }, [instructionAr, instructionAudio]);

  useEffect(() => {
    if (!previewMode) {
      playInstruction();
    }
  }, [game?.id, playInstruction, previewMode]);

  useEffect(() => {
    if (phase !== 'preview') return undefined;
    if (secondsLeft <= 0) {
      setPhase('question');
      speakTarget(targetItem, speak);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setSecondsLeft((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [phase, secondsLeft, targetItem]);

  const showHint = useCallback(() => {
    if (phase === 'preview') return;
    setHintTarget(true);
    if (helpVoiceEnabled) {
      speak('انظر إلى المربع المضيء.');
    }
  }, [helpVoiceEnabled, phase]);

  useEffect(() => {
    if (!registerAssistantActions) return undefined;

    registerAssistantActions({
      onVisualHint: showHint,
      onGestureHint: showHint,
      onVerbalHint: () => {
        if (targetItem?.textAr) speak(`نبحث الآن عن ${targetItem.textAr}`);
      },
      onPhysicalPrompt: showHint,
    });

    return () => registerAssistantActions({});
  }, [registerAssistantActions, showHint, targetItem]);

  const finishActivity = (finalStars = stars) => {
    if (completionSentRef.current) return;
    completionSentRef.current = true;
    const responseTime = Date.now() - startTime;
    onComplete?.({
      correctAnswers: 1,
      wrongAnswers,
      attempts: [wrongAnswers + 1],
      prompts: [therapistControlsEnabled ? therapistPromptLevel : 'none'],
      timeSpent: Math.floor(responseTime / 1000),
      responseTime,
      stars: finalStars,
      selectedAnswer: selectedId || '',
      isCorrect: true,
    });
  };

  const handleCellClick = (item) => {
    if (phase !== 'question' || !item) return;
    onAssistantInteraction?.();
    playTap();
    setSelectedId(item.id);
    setHintTarget(false);

    if (item.id === targetItem?.id) {
      setPhase('success');
      setStars(1);
      if (feedback.successSound) playAudioUrl(feedback.successSound);
      else playCorrect();
      window.setTimeout(() => {
        playLevelComplete();
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.55 } });
        if (!previewMode) {
          finishActivity(1);
        }
      }, 250);
      return;
    }

    setPhase('wrong');
    setWrongAnswers((current) => current + 1);
    if (feedback.failSound) playAudioUrl(feedback.failSound);
    else playWrong();
    window.setTimeout(() => {
      setSelectedId(null);
      setPhase('question');
      speakTarget(targetItem, speak);
    }, 1500);
  };

  const isImagesVisible = phase === 'preview' || phase === 'success';
  const targetQuestion = instructionAr || (targetItem?.textAr ? `أين ${targetItem.textAr}؟` : 'اختر الصورة المطلوبة');
  const headerInstruction =
    phase === 'preview'
      ? instructionAr
      : phase === 'success'
        ? 'أحسنت! إجابة صحيحة'
        : phase === 'wrong'
          ? '\u0627\u0644\u0645\u0631\u0628\u0639 \u0627\u0644\u0635\u062D\u064A\u062D \u064A\u0636\u064A\u0621 \u0627\u0644\u0622\u0646.'
          : targetQuestion;

  return (
    <GameContainer
      className={previewMode ? 'max-w-4xl' : 'max-w-5xl'}
      dir="rtl"
      style={{ maxWidth: 'min(100%, clamp(22rem, 52vw, 44rem))' }}
    >
      <ChildGameBackdrop previewMode={previewMode} />

      <GameHeader
        instruction={headerInstruction}
        avatarState={phase === 'success' ? 'celebration' : phase === 'wrong' ? 'error' : 'learning'}
        onPlayAudio={() => (phase === 'preview' ? playInstruction() : speakTarget(targetItem, speak))}
        onRestart={resetGame}
      />

      <GameSection className="overflow-visible">
        <div
          className="mx-auto grid max-w-[min(84vw,460px)] gap-2 sm:gap-3"
          style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
        >
          {gridItems.map((item) => {
            const isTarget = item.id === targetItem?.id;
            const isSelected = selectedId === item.id;
            const shouldRevealCorrect = phase === 'wrong' && isTarget;
            const shouldShowImage = isImagesVisible || (phase === 'wrong' && (isSelected || isTarget));
            const isHinted = hintTarget && isTarget && phase === 'question';

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleCellClick(item)}
                disabled={phase === 'preview' || phase === 'success'}
                className={`relative min-h-[68px] rounded-[1.2rem] border-4 border-white bg-white p-2 shadow-[0_14px_28px_-24px_rgba(15,23,42,0.45)] transition-all duration-300 sm:min-h-[86px] md:min-h-[104px] ${
                  isHinted ? GAME_ASSISTANT_HINT_CLASS : ''
                } ${
                  phase === 'success' && isTarget
                    ? 'scale-105 ring-4 ring-emerald-300'
                    : shouldRevealCorrect
                      ? 'ring-4 ring-emerald-300'
                      : isSelected && phase === 'wrong'
                        ? 'ring-4 ring-rose-300'
                        : 'hover:-translate-y-0.5'
                }`}
                style={{ aspectRatio: '1 / 1' }}
              >
                {isHinted && (
                  <BirdHint className="pointer-events-none absolute -top-11 left-1/2 z-30 h-14 w-14 -translate-x-1/2 drop-shadow-[0_10px_18px_rgba(6,182,212,0.28)]" />
                )}

                {shouldShowImage ? (
                  <div className="flex h-full w-full flex-col items-center justify-center rounded-[0.9rem] bg-slate-50">
                    {item.image ? (
                      <img src={item.image} alt={item.textAr || 'memory-grid'} className="h-[72%] w-[88%] object-contain" />
                    ) : (
                      <div className="text-4xl sm:text-5xl">{item.emoji || '🧩'}</div>
                    )}
                    {item.textAr && (
                      <span className="mt-1 max-w-full truncate rounded-full bg-white px-2 py-0.5 text-xs font-black text-slate-700">
                        {item.textAr}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[0.9rem] bg-gradient-to-br from-[#19add6] via-[#12bfd0] to-[#21d0bb] text-white shadow-inner">
                    <div className="absolute inset-2 rounded-[0.75rem] border-2 border-white/35" />
                    <div className="absolute -right-5 -top-5 h-14 w-14 rounded-full bg-white/18" />
                    <div className="absolute -bottom-6 -left-4 h-16 w-16 rounded-full bg-white/14" />
                    <span className="relative z-10 text-4xl font-black leading-none drop-shadow-sm sm:text-5xl">؟</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </GameSection>
    </GameContainer>
  );
};

export default MemoryGridGame;
