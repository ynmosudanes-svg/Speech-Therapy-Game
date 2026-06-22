import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Volume2, CheckCircle2 } from 'lucide-react';
import Button from '../components/Button';
import GameHeader from '../components/game/GameHeader';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import { playAudioUrl } from '../utils/soundEffects';

const AudioCardsGame = ({
  game,
  onComplete,
  therapistControlsEnabled = false,
  therapistPromptLevel = 'none',
  onAssistantInteraction = () => {},
  registerAssistantActions,
  helpVoiceEnabled = false,
  previewMode = false,
}) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [visualPulse, setVisualPulse] = useState(false);
  const [gestureHint, setGestureHint] = useState(false);

  const config = game?.config || {};
  const content = config?.content || {};
  const cards = Array.isArray(content.cards) ? content.cards : [];
  const instructionAudio = content.instructionAudio || '';

  const currentCard = cards[currentCardIndex] || null;
  const stackedCards = useMemo(() => cards.slice(currentCardIndex + 1, currentCardIndex + 4), [cards, currentCardIndex]);
  const isLastCard = currentCardIndex === cards.length - 1;
  const { speak } = useSpeechSynthesis();

  const playInstruction = useCallback(() => {
    if (instructionAudio) {
      playAudioUrl(instructionAudio);
      return;
    }
    if (content.instructionAr) {
      speak(content.instructionAr);
    }
  }, [instructionAudio, content.instructionAr, speak]);

  const playCardAudio = useCallback(() => {
    if (currentCard?.audioUrl) {
      playAudioUrl(currentCard.audioUrl);
      return;
    }
    if (currentCard?.textAr?.trim()) {
      speak(currentCard.textAr);
    }
  }, [currentCard?.audioUrl, currentCard?.textAr, speak]);

  useEffect(() => {
    setIsFlipped(false);
  }, [currentCardIndex]);

  useEffect(() => {
    setVisualPulse(false);
    setGestureHint(false);
  }, [currentCardIndex]);

  useEffect(() => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setVisualPulse(false);
    setGestureHint(false);
  }, [game?.id]);

  useEffect(() => {
    if (!previewMode) {
      playInstruction();
    }
  }, [game?.id, playInstruction, previewMode]);

  const handleCardPress = useCallback(() => {
    onAssistantInteraction?.();
    setVisualPulse(false);
    setGestureHint(false);

    if (!isFlipped) {
      setIsFlipped(true);
      playCardAudio();
      return;
    }

    if (!isLastCard) {
      setCurrentCardIndex((prev) => Math.min(prev + 1, cards.length - 1));
      return;
    }

    playCardAudio();
  }, [cards.length, isFlipped, isLastCard, onAssistantInteraction, playCardAudio]);

  const handleFlipRef = useRef(handleCardPress);
  handleFlipRef.current = handleCardPress;

  useEffect(() => {
    if (!registerAssistantActions) return undefined;

    registerAssistantActions({
      onVisualHint: () => {
        if (isFlipped) return;
        setVisualPulse(true);


      },
      onGestureHint: () => {
        if (isFlipped) return;
        setGestureHint(true);
        speak('انظر إلى الشاشة، أنا أشير إلى المكان الصحيح.');
        window.setTimeout(() => setGestureHint(false), 3000);
      },
      onVerbalHint: () => {
        const hint = currentCard?.textAr
          ? `الكلمة هي "${currentCard.textAr}"`
          : 'اضغط على الكارت عشان تسمع الكلمة';
        speak(hint);
      },
      onPhysicalPrompt: () => {
        if (!isFlipped) {
          handleFlipRef.current?.();
          return;
        }
        const hint = currentCard?.textAr
          ? `الكلمة هي "${currentCard.textAr}"`
          : 'اضغط على الكارت عشان تسمع الكلمة';
        speak(hint);
      },
    });

    return () => registerAssistantActions({});
  }, [currentCard, isFlipped, registerAssistantActions, speak]);

  const handleNext = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
      setIsFlipped(false);
      setVisualPulse(false);
      setGestureHint(false);
    }
  };

  const handlePrev = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex((prev) => prev - 1);
      setIsFlipped(false);
      setVisualPulse(false);
      setGestureHint(false);
    }
  };

  const handleComplete = () => {
    const stats = {
      correctAnswers: cards.length,
      wrongAnswers: 0,
      attempts: cards.map(() => 1),
      prompts: cards.map(() => 'none'),
      timeSpent: 0,
    };
    onComplete(stats);
  };

  if (!cards.length) {
    return <div className="p-10 text-center text-xl font-bold">لا توجد كروت في هذا النشاط</div>;
  }

  const handleRestart = () => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setVisualPulse(false);
    setGestureHint(false);
  };

  return (
    <div
      className="relative mx-auto flex w-full max-w-4xl select-none flex-col items-center px-3 pb-4 pt-2 md:px-4"
      dir="rtl"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[2.5rem] bg-[radial-gradient(circle_at_top,_rgba(186,230,253,0.55),_transparent_42%),linear-gradient(180deg,_rgba(255,255,255,0.96)_0%,_rgba(239,246,255,0.9)_100%)]" />
      <div className="pointer-events-none absolute left-1/2 top-14 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-sky-200/35 blur-3xl" />

      {content.instructionAr && (
        <div className="mb-5 w-full">
          <GameHeader
            instruction={content.instructionAr}
            instructionAudio={instructionAudio}
            onPlayAudio={playInstruction}
            onRestart={handleRestart}
          />
        </div>
      )}

      <div className="mb-5 flex items-center gap-2">
        {cards.map((_, index) => (
          <div
            key={index}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentCardIndex
                ? 'w-12 bg-sky-500 shadow-[0_0_0_4px_rgba(56,189,248,0.12)]'
                : index < currentCardIndex
                  ? 'w-5 bg-sky-300'
                  : 'w-5 bg-slate-200/80'
            }`}
          />
        ))}
      </div>

      <div className="relative w-full max-w-[440px] px-2 pb-2 pt-2 md:max-w-[520px]">
        <div className="pointer-events-none absolute inset-x-4 bottom-0 h-28 rounded-[2rem] bg-sky-300/15 blur-3xl" />

        <div
          className={`relative mx-auto w-full cursor-pointer transition-all duration-300 ${
            visualPulse && !isFlipped ? 'drop-shadow-[0_0_34px_rgba(14,165,233,0.22)]' : ''
          }`}
          style={{ perspective: '2200px' }}
          onClick={handleCardPress}
        >
          <div className="absolute inset-0 translate-y-7 scale-[0.97] rotate-[-2.5deg] rounded-[1.5rem] border border-white/70 bg-gradient-to-br from-sky-100 to-cyan-100 shadow-[0_26px_60px_-42px_rgba(14,116,144,0.55)]" />

          {stackedCards.map((card, index) => (
            <div
              key={card.id || `${card.textAr || 'card'}-${index}`}
              className="absolute inset-0 rounded-[1.5rem] border border-white/80 bg-white/65 backdrop-blur-sm shadow-[0_22px_48px_-34px_rgba(15,23,42,0.22)]"
              style={{
                transform: `translateY(${18 + index * 16}px) scale(${0.96 - index * 0.035}) rotate(${index % 2 === 0 ? -4 - index : 4 + index}deg)`,
                opacity: Math.max(0.34 - index * 0.06, 0.18),
              }}
            >
              <div className="flex h-full items-center justify-center overflow-hidden rounded-[inherit] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(239,246,255,0.84))] p-5">
                {card.image ? (
                  <img
                    src={card.image}
                    alt={card.textAr || 'preview'}
                    className="h-full w-full object-contain opacity-70 blur-[0.2px]"
                  />
                ) : (
                  <div className="text-7xl font-black text-sky-200">؟</div>
                )}
              </div>
            </div>
          ))}

          {gestureHint && !isFlipped && (
            <div className="pointer-events-none absolute -top-12 left-1/2 z-30 -translate-x-1/2 animate-bounce text-5xl drop-shadow-md">
              ↓
            </div>
          )}

          <div
            className={`relative z-10 h-[min(58vw,320px)] w-full overflow-visible rounded-[1.5rem] transition-transform duration-500 md:h-[320px] ${
              isFlipped ? 'shadow-[0_28px_80px_-36px_rgba(14,165,233,0.34)]' : 'hover:-translate-y-1'
            }`}
          >
            <div
              className={`relative h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div
                className="absolute inset-0 flex flex-col items-center justify-between overflow-hidden rounded-[1.5rem] border-4 border-white/95 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.98),_rgba(232,244,255,0.9))] p-5 shadow-[0_24px_48px_-28px_rgba(14,116,144,0.45)] md:p-6"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="absolute inset-x-5 top-5 h-12 rounded-full bg-sky-100/50 blur-2xl" />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-sky-100/80 to-transparent" />

                <div className="relative flex w-full flex-1 items-center justify-center overflow-hidden rounded-[1.75rem] bg-transparent p-2 md:p-4">
                  {currentCard?.image ? (
                    <img
                      src={currentCard.image}
                      alt={currentCard.textAr || 'Card'}
                      className="h-full w-full object-contain drop-shadow-[0_14px_20px_rgba(15,23,42,0.16)] transition-transform duration-700"
                    />
                  ) : (
                    <div className="text-8xl font-black text-slate-200">؟</div>
                  )}
                </div>

                <div className="mt-4 flex w-full items-center justify-between gap-3">
                  <div className="rounded-full border border-sky-100 bg-white/85 px-4 py-2 text-sm font-black text-sky-700 shadow-sm">
                    اضغط للكشف
                  </div>
                  <div className="rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-sm font-black text-slate-500 shadow-sm">
                    {currentCardIndex + 1} / {cards.length}
                  </div>
                </div>
              </div>

              <div
                className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-[1.5rem] border-4 border-white/95 bg-[radial-gradient(circle_at_top,_rgba(245,250,255,0.98),_rgba(225,242,255,0.92))] p-5 text-center shadow-[0_24px_48px_-28px_rgba(15,23,42,0.28)] md:p-6"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                {currentCard?.image && (
                  <div className="mb-5 flex h-[44%] w-[88%] items-center justify-center rounded-[1.75rem] border border-white/90 bg-white/90 p-4 shadow-[0_18px_36px_-24px_rgba(15,23,42,0.32)] md:mb-6">
                    <img
                      src={currentCard.image}
                      alt={currentCard.textAr || 'Card Flipped'}
                      className="h-full w-full object-contain"
                    />
                  </div>
                )}

                {currentCard?.textAr?.trim() && (
                  <h3 className="mb-4 text-3xl font-black tracking-tight text-slate-800 md:mb-5 md:text-5xl">
                    {currentCard.textAr}
                  </h3>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    playCardAudio();
                  }}
                  className="inline-flex h-20 w-20 items-center justify-center rounded-full border border-sky-100 bg-white text-sky-600 shadow-[0_18px_30px_-18px_rgba(14,165,233,0.55)] transition-all duration-200 hover:scale-110 hover:shadow-[0_22px_40px_-18px_rgba(14,165,233,0.65)]"
                  aria-label="تشغيل الصوت مرة أخرى"
                >
                  <Volume2 size={38} />
                </button>

                <p className="mt-4 text-sm font-bold text-slate-500">اضغط على الكارت للانتقال للكارت التالي</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {cards.length > 1 ? (
        <div className="mt-7 flex w-full max-w-[320px] items-center justify-between gap-3 md:max-w-[360px]">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentCardIndex === 0}
            className="flex-1 rounded-2xl border-2 border-slate-200 !bg-white !py-4 text-slate-700 shadow-sm hover:!bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowRight size={24} />
          </Button>

          {currentCardIndex === cards.length - 1 && isFlipped ? (
            <Button
              variant="primary"
              onClick={handleComplete}
              className="flex-[2] rounded-2xl border-b-4 border-emerald-700 !bg-emerald-500 !py-3 text-sm font-black shadow-lg shadow-emerald-200 hover:!bg-emerald-600 md:text-base"
            >
              <CheckCircle2 size={24} />
              <span className="text-sm md:text-base leading-tight">إكمال النشاط</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleNext}
              disabled={currentCardIndex === cards.length - 1}
              className="flex-[2] rounded-2xl border-2 border-slate-200 !bg-white !py-4 text-slate-700 shadow-sm hover:!bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft size={24} />
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-7 flex w-full max-w-[320px] items-center justify-center md:max-w-[360px]">
          {isFlipped ? (
            <Button
              variant="primary"
              onClick={handleComplete}
              className="w-full rounded-2xl border-b-4 border-emerald-700 !bg-emerald-500 !py-3 text-sm font-black shadow-lg shadow-emerald-200 hover:!bg-emerald-600 md:text-base"
            >
              <CheckCircle2 size={24} />
              <span className="text-sm md:text-base leading-tight">إكمال النشاط</span>
            </Button>
          ) : (
            <div className="h-[60px] w-full" />
          )}
        </div>
      )}

      <style jsx>{`
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
};

export default AudioCardsGame;