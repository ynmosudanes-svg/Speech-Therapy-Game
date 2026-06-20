import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Star, Volume2 } from 'lucide-react';
import Button from '../components/Button';
import BirdHint from '../components/game/BirdHint';
import GameHeader from '../components/game/GameHeader';
import {
  GAME_ASSISTANT_HINT_CLASS,
  GameContainer,
  GameSection,
} from '../components/game/GameUI';
import { useTherapySounds } from '../hooks/useTherapySounds';
import { playAudioUrl, playSpokenArabic } from '../utils/soundEffects';
import ChildGameBackdrop from './ChildGameBackdrop';

const DEFAULT_MEMORY_ITEMS = [
  { id: 'cat', textAr: 'قطة', emoji: '🐱', category: 'animals' },
  { id: 'lion', textAr: 'أسد', emoji: '🦁', category: 'animals' },
  { id: 'apple', textAr: 'تفاحة', emoji: '🍎', category: 'fruits' },
  { id: 'banana', textAr: 'موزة', emoji: '🍌', category: 'fruits' },
  { id: 'car', textAr: 'سيارة', emoji: '🚗', category: 'vehicles' },
  { id: 'star', textAr: 'نجمة', emoji: '⭐', category: 'shapes' },
];

const shuffle = (items) => {
  const nextItems = [...items];
  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [nextItems[index], nextItems[randomIndex]] = [nextItems[randomIndex], nextItems[index]];
  }
  return nextItems;
};

const normalizeCards = (cards = []) => {
  const validCards = cards
    .filter((card) => card?.image || card?.textAr || card?.emoji)
    .map((card, index) => ({
      id: card.id || `memory_item_${index}`,
      image: card.image || '',
      textAr: card.textAr || card.labelAr || card.label || '',
      audioUrl: card.audioUrl || '',
      emoji: card.emoji || '',
      category: card.category || '',
    }));

  return validCards.length >= 2 ? validCards : DEFAULT_MEMORY_ITEMS.slice(0, 4);
};

const buildDeck = (items) =>
  shuffle(
    items.flatMap((item) => [
      { ...item, cardId: `${item.id}_a`, pairId: item.id },
      { ...item, cardId: `${item.id}_b`, pairId: item.id },
    ]),
  );

const speakCard = (card) => {
  if (!card) return;
  if (card.audioUrl) {
    playAudioUrl(card.audioUrl);
    return;
  }
  if (card.textAr?.trim()) {
    playSpokenArabic(card.textAr);
  }
};

const MemoryCardsGame = ({
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
  const instructionAr = content.instructionAr || 'افتح كارتين وابحث عن الصور المتطابقة';
  const instructionAudio = content.instructionAudio || content.questionAudio || '';
  const sourceItems = useMemo(() => {
    const maxPairs = Number(content.maxPairs || content.pairCount || 6);
    return normalizeCards(content.cards).slice(0, Math.max(2, Math.min(8, maxPairs)));
  }, [content.cards, content.maxPairs, content.pairCount]);

  const [deck, setDeck] = useState(() => buildDeck(sourceItems));
  const [flippedIds, setFlippedIds] = useState([]);
  const [matchedPairIds, setMatchedPairIds] = useState([]);
  const [locked, setLocked] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [moves, setMoves] = useState(0);
  const [hintedPairId, setHintedPairId] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const completionSentRef = useRef(false);
  const flipBackTimerRef = useRef(null);
  const { playTap, playCorrect, playWrong, playLevelComplete } = useTherapySounds({ soundEnabled: true });

  const totalPairs = sourceItems.length;
  const matchedCount = matchedPairIds.length;
  const remainingPairs = Math.max(totalPairs - matchedCount, 0);
  const progress = totalPairs ? Math.round((matchedCount / totalPairs) * 100) : 0;
  const earnedStars = Math.max(1, Math.min(3, 3 - Math.floor(wrongAnswers / 3)));

  const resetGame = useCallback(() => {
    if (flipBackTimerRef.current) {
      window.clearTimeout(flipBackTimerRef.current);
      flipBackTimerRef.current = null;
    }
    setDeck(buildDeck(sourceItems));
    setFlippedIds([]);
    setMatchedPairIds([]);
    setLocked(false);
    setWrongAnswers(0);
    setMoves(0);
    setHintedPairId(null);
    setCompleted(false);
    setStartTime(Date.now());
    completionSentRef.current = false;
  }, [sourceItems]);

  useEffect(() => {
    resetGame();
  }, [game?.id, resetGame]);

  useEffect(() => () => {
    if (flipBackTimerRef.current) {
      window.clearTimeout(flipBackTimerRef.current);
    }
  }, []);

  const playInstruction = useCallback(() => {
    if (instructionAudio) {
      playAudioUrl(instructionAudio);
      return;
    }
    playSpokenArabic(instructionAr);
  }, [instructionAr, instructionAudio]);

  useEffect(() => {
    if (!previewMode) {
      playInstruction();
    }
  }, [game?.id, playInstruction, previewMode]);

  const showHelpfulPair = useCallback(() => {
    const nextPair = deck.find((card) => !matchedPairIds.includes(card.pairId))?.pairId || null;
    setHintedPairId(nextPair);
    if (helpVoiceEnabled && nextPair) {
      playSpokenArabic('جرّب افتح الكارت المضيء، وتذكر مكان الصورة.');
    }
  }, [deck, helpVoiceEnabled, matchedPairIds]);

  useEffect(() => {
    if (!registerAssistantActions) return undefined;

    registerAssistantActions({
      onVisualHint: showHelpfulPair,
      onGestureHint: showHelpfulPair,
      onVerbalHint: () => {
        if (helpVoiceEnabled) {
          playSpokenArabic('افتح كارتين. لو الصور مثل بعض، سيظلان ظاهرين.');
        }
      },
      onPhysicalPrompt: showHelpfulPair,
    });

    return () => registerAssistantActions({});
  }, [helpVoiceEnabled, registerAssistantActions, showHelpfulPair]);

  useEffect(() => {
    if (matchedCount !== totalPairs || totalPairs === 0 || completed) return;

    setCompleted(true);
    if (feedback.successSound) playAudioUrl(feedback.successSound);
    else playLevelComplete();

    confetti({
      particleCount: 140,
      spread: 75,
      origin: { y: 0.55 },
      colors: ['#22c55e', '#0ea5e9', '#fbbf24', '#fb7185'],
    });
  }, [completed, feedback.successSound, matchedCount, playLevelComplete, totalPairs]);

  const finishActivity = () => {
    if (completionSentRef.current) return;
    completionSentRef.current = true;
    const responseTime = Date.now() - startTime;
    onComplete?.({
      correctAnswers: totalPairs,
      wrongAnswers,
      attempts: [moves],
      prompts: [therapistControlsEnabled ? therapistPromptLevel : 'none'],
      timeSpent: Math.floor(responseTime / 1000),
      responseTime,
      stars: earnedStars,
      isCorrect: true,
    });
  };

  const handleCardClick = (card) => {
    if (locked || completed) return;
    if (matchedPairIds.includes(card.pairId) || flippedIds.includes(card.cardId)) return;
    if (flippedIds.length >= 2) return;

    onAssistantInteraction?.();
    playTap();
    speakCard(card);
    setHintedPairId(null);

    const nextFlippedIds = [...flippedIds, card.cardId];
    setFlippedIds(nextFlippedIds);

    if (nextFlippedIds.length !== 2) return;

    setMoves((current) => current + 1);
    const firstCard = deck.find((item) => item.cardId === nextFlippedIds[0]);
    const secondCard = deck.find((item) => item.cardId === nextFlippedIds[1]);

    if (firstCard?.pairId === secondCard?.pairId) {
      if (feedback.successSound) playAudioUrl(feedback.successSound);
      else playCorrect();
      setMatchedPairIds((current) => [...current, firstCard.pairId]);
      window.setTimeout(() => setFlippedIds([]), 450);
      return;
    }

    if (feedback.failSound) playAudioUrl(feedback.failSound);
    else playWrong();
    setWrongAnswers((current) => current + 1);
    setLocked(true);
    flipBackTimerRef.current = window.setTimeout(() => {
      setFlippedIds([]);
      setLocked(false);
      flipBackTimerRef.current = null;
    }, 900);
  };

  const columnsClassName =
    deck.length <= 6
      ? 'grid-cols-3'
      : deck.length <= 8
        ? 'grid-cols-4'
        : 'grid-cols-3 sm:grid-cols-4';

  return (
    <GameContainer
      className={previewMode ? 'max-w-4xl' : 'max-w-5xl'}
      dir="rtl"
      style={{ maxWidth: 'min(100%, clamp(22rem, 72vw, 58rem))' }}
    >
      <ChildGameBackdrop previewMode={previewMode} />

      <GameHeader
        instruction={instructionAr}
        avatarState={completed ? 'celebration' : 'learning'}
        onPlayAudio={playInstruction}
        onRestart={resetGame}
      />

      <GameSection className="overflow-visible">
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-center">
            <div className="text-xs font-black text-sky-600">الأزواج المتبقية</div>
            <div className="mt-1 text-2xl font-black text-slate-900">{remainingPairs}</div>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-center">
            <div className="text-xs font-black text-amber-600">النجوم</div>
            <div className="mt-1 flex justify-center gap-1 text-2xl text-amber-400">
              {[1, 2, 3].map((star) => (
                <Star
                  key={star}
                  className={`h-6 w-6 ${star <= earnedStars ? 'fill-current' : 'text-slate-200'}`}
                />
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3">
            <div className="mb-2 flex items-center justify-between text-xs font-black text-emerald-700">
              <span>التقدم</span>
              <span>{progress}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className={`grid ${columnsClassName} mx-auto max-w-3xl gap-3 sm:gap-4`}>
          {deck.map((card) => {
            const isFlipped = flippedIds.includes(card.cardId) || matchedPairIds.includes(card.pairId);
            const isMatched = matchedPairIds.includes(card.pairId);
            const isHinted = hintedPairId === card.pairId && !isFlipped;

            return (
              <button
                key={card.cardId}
                type="button"
                onClick={() => handleCardClick(card)}
                disabled={locked || completed || isMatched}
                className={`group relative min-h-[72px] rounded-[1.35rem] outline-none transition-all duration-200 sm:min-h-[92px] md:min-h-[112px] ${
                  isHinted ? GAME_ASSISTANT_HINT_CLASS : ''
                } ${isMatched ? 'scale-[0.98]' : 'hover:-translate-y-1 active:scale-95'}`}
                style={{ perspective: '1000px', aspectRatio: '1 / 1' }}
                aria-label={isFlipped ? card.textAr || 'كارت مفتوح' : 'كارت مقلوب'}
              >
                {isHinted && (
                  <BirdHint className="pointer-events-none absolute -top-12 left-1/2 z-30 h-14 w-14 -translate-x-1/2 drop-shadow-[0_10px_18px_rgba(6,182,212,0.28)] md:-top-14 md:h-16 md:w-16" />
                )}

                <div
                  className="relative h-full w-full rounded-[inherit] transition-transform duration-500"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  }}
                >
                  <div
                    className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-[inherit] border-4 border-white bg-gradient-to-br from-[#19add6] via-[#12bfd0] to-[#21d0bb] text-white shadow-[0_16px_30px_-22px_rgba(14,116,144,0.65)]"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="absolute inset-3 rounded-[1rem] border-2 border-white/40" />
                    <div className="absolute -right-5 -top-5 h-16 w-16 rounded-full bg-white/18" />
                    <div className="absolute -bottom-7 -left-5 h-20 w-20 rounded-full bg-white/14" />
                    <span className="relative z-10 text-5xl font-black leading-none drop-shadow-sm sm:text-6xl">؟</span>
                  </div>

                  <div
                    className={`absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-[inherit] border-4 bg-white p-2 text-center shadow-[0_16px_30px_-22px_rgba(15,23,42,0.4)] ${
                      isMatched ? 'border-emerald-300 ring-4 ring-emerald-100' : 'border-white'
                    }`}
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  >
                    {card.image ? (
                      <img
                        src={card.image}
                        alt={card.textAr || 'memory-card'}
                        className="h-[70%] w-[86%] object-contain drop-shadow-sm"
                      />
                    ) : (
                      <div className="text-4xl sm:text-5xl md:text-6xl">{card.emoji || '🧩'}</div>
                    )}
                    {card.textAr && (
                      <div className="mt-1 max-w-full truncate rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 sm:text-sm">
                        {card.textAr}
                      </div>
                    )}
                    {isMatched && (
                      <div className="absolute right-2 top-2 rounded-full bg-emerald-500 p-1 text-white">
                        <Star className="h-4 w-4 fill-current" />
                      </div>
                    )}
                    {isFlipped && !isMatched && (
                      <Volume2 className="absolute left-2 top-2 h-4 w-4 text-sky-500" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </GameSection>

      {completed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] border border-sky-100 bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-400 text-4xl shadow-lg">
              🎉
            </div>
            <h2 className="text-2xl font-black text-slate-900 md:text-3xl">أحسنت! لقد أكملت اللعبة</h2>
            <p className="mt-2 text-sm font-bold text-slate-500">جمعت {earnedStars} نجوم ووجدت كل الأزواج.</p>
            <div className="my-5 flex justify-center gap-2 text-amber-400">
              {[1, 2, 3].map((star) => (
                <Star
                  key={star}
                  className={`h-9 w-9 ${star <= earnedStars ? 'fill-current' : 'text-slate-200'}`}
                />
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button type="button" variant="outline" onClick={resetGame} className="!py-3">
                <RotateCcw className="h-5 w-5" />
                العب مرة أخرى
              </Button>
              {!previewMode && (
                <Button type="button" variant="primary" onClick={finishActivity} className="!py-3">
                  إنهاء النشاط
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </GameContainer>
  );
};

export default MemoryCardsGame;
