import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Volume2, CheckCircle2, PlayCircle } from 'lucide-react';
import Button from '../components/Button';
import GameHeader from '../components/game/GameHeader';
import { playAudioUrl, playSpokenArabic } from '../utils/soundEffects';

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
  const content = config.content || {};
  const cards = Array.isArray(content.cards) ? content.cards : [];
  const instructionAudio = content.instructionAudio || '';

  const currentCard = cards[currentCardIndex] || null;

  const playInstruction = useCallback(() => {
    if (instructionAudio) {
      playAudioUrl(instructionAudio);
      return;
    }
    if (content.instructionAr) {
      playSpokenArabic(content.instructionAr);
    }
  }, [instructionAudio, content.instructionAr]);

  const playCardAudio = useCallback(() => {
    if (currentCard?.audioUrl) {
      playAudioUrl(currentCard.audioUrl);
      return;
    }
    if (currentCard?.textAr?.trim()) {
      playSpokenArabic(currentCard.textAr);
    }
  }, [currentCard?.audioUrl, currentCard?.textAr]);

  useEffect(() => {
    setIsFlipped(false);
  }, [currentCardIndex]);

  useEffect(() => {
    if (!previewMode) {
      playInstruction();
    }
  }, [game?.id, playInstruction, previewMode]);

  const handleFlip = useCallback(() => {
    onAssistantInteraction?.();
    setVisualPulse(false);
    setGestureHint(false);

    if (!isFlipped) {
      setIsFlipped(true);
      playCardAudio();
      return;
    }

    playCardAudio();
  }, [isFlipped, onAssistantInteraction, playCardAudio]);

  const handleFlipRef = useRef(handleFlip);
  handleFlipRef.current = handleFlip;

  useEffect(() => {
    if (!registerAssistantActions) return undefined;

    registerAssistantActions({
      onVisualHint: () => {
        if (isFlipped) return;
        setVisualPulse(true);
        speak('انتبه جيداً! الكارت يضيء الآن.');
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
  }, [currentCard, isFlipped, registerAssistantActions, playCardAudio]);

  const handleNext = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex((prev) => prev - 1);
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
    return <div className="text-center p-10 font-bold text-xl">لا توجد كروت في هذا النشاط</div>;
  }

  const handleRestart = () => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center select-none px-3" dir="rtl">
      
      {content.instructionAr && (
        <div className="w-full mb-6">
          <GameHeader
            instruction={content.instructionAr}
            instructionAudio={instructionAudio}
            onPlayAudio={playInstruction}
            onRestart={handleRestart}
          />
        </div>
      )}

      {/* Progress Indicator */}
      <div className="flex items-center gap-2 mb-5">
        {cards.map((_, index) => (
          <div
            key={index}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentCardIndex
                ? 'w-10 bg-sky-500'
                : index < currentCardIndex
                ? 'w-5 bg-sky-300'
                : 'w-5 bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* 3D Flip Card Container */}
      <div 
        className={`relative w-full max-w-[360px] md:max-w-[460px] aspect-[4/5] md:aspect-[7/8] cursor-pointer group/card transition-all duration-300 ${
          visualPulse && !isFlipped ? 'ring-8 ring-sky-300 animate-pulse shadow-[0_0_36px_rgba(14,165,233,0.22)] rounded-[2rem]' : ''
        }`}
        style={{ perspective: '2000px' }}
        onClick={handleFlip}
      >
        {gestureHint && !isFlipped && (
          <div className="absolute -top-14 left-1/2 -translate-x-1/2 text-5xl animate-bounce z-30 drop-shadow-md pointer-events-none">
            👇
          </div>
        )}
        <div
          className={`w-full h-full transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] transform-style-3d shadow-xl rounded-3xl ${
            isFlipped ? 'rotate-y-180 shadow-2xl shadow-sky-200/50' : 'hover:scale-[1.01] shadow-sky-100/60'
          }`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front of Card */}
          <div 
            className="absolute inset-0 w-full h-full backface-hidden rounded-3xl border-[6px] border-white overflow-hidden bg-white flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-50 via-white to-cyan-50"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {currentCard?.image ? (
              <div className="w-full h-full px-5 pt-5 pb-24 md:px-8 md:pt-8 md:pb-28 flex items-center justify-center">
                <img 
                  src={currentCard.image} 
                  alt="Card" 
                  className="max-w-full max-h-full object-contain transition-transform duration-700 group-hover/card:scale-105 drop-shadow-lg" 
                />
              </div>
            ) : (
              <div className="text-8xl text-slate-200 font-black">؟</div>
            )}
            
            {/* Front Overlay Hint */}
            <div className={`absolute bottom-5 left-1/2 -translate-x-1/2 bg-white/96 backdrop-blur-sm px-5 py-3 rounded-full shadow-lg border opacity-90 group-hover/card:opacity-100 transition-all duration-300 transform translate-y-2 group-hover/card:translate-y-0 flex items-center gap-2 z-10 ${
              gestureHint ? 'border-sky-300 ring-4 ring-sky-200 scale-105' : 'border-sky-100'
            }`}>
              <PlayCircle size={24} className="text-sky-600 animate-pulse" />
              <span className="text-slate-800 font-black text-sm md:text-base whitespace-nowrap">اضغط للسماع والقلب</span>
            </div>
          </div>

          {/* Back of Card (Flipped) */}
          <div 
            className="absolute inset-0 w-full h-full backface-hidden rounded-3xl border-[6px] border-white overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-50 via-white to-cyan-100 flex flex-col items-center justify-center p-6 text-center transform rotate-y-180"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            {currentCard?.image && (
              <div className="w-40 h-40 md:w-56 md:h-56 rounded-[1.8rem] border-[6px] border-white shadow-xl overflow-hidden mb-4 md:mb-6 flex-shrink-0 bg-white/95 transform transition-transform duration-500 hover:scale-105 flex items-center justify-center">
                <img src={currentCard.image} alt="Card Flipped" className="max-w-full max-h-full object-contain p-2" />
              </div>
            )}
            
            {currentCard?.textAr?.trim() && (
              <h3 className="text-4xl md:text-6xl font-black text-slate-800 mb-2 md:mb-6 tracking-tight drop-shadow-sm leading-tight">
                {currentCard.textAr}
              </h3>
            )}
            
            <button 
              onClick={(e) => { e.stopPropagation(); handleFlip(); }}
              className="mt-2 inline-flex items-center justify-center w-20 h-20 shrink-0 rounded-full bg-white text-sky-600 shadow-xl hover:scale-110 hover:shadow-2xl transition-all border-2 border-sky-100 relative group"
            >
              <div className="absolute inset-0 rounded-full bg-sky-100 opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-300"></div>
              <Volume2 size={40} className="relative z-10" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      {cards.length > 1 ? (
        <div className="flex items-center justify-between w-full max-w-[320px] md:max-w-[360px] mt-7 gap-3">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentCardIndex === 0}
            className="flex-1 !py-4 rounded-2xl !bg-white border-2 border-slate-200 text-slate-700 hover:!bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <ArrowRight size={24} />
          </Button>

          {currentCardIndex === cards.length - 1 && isFlipped ? (
            <Button
              variant="primary"
              onClick={handleComplete}
              className="flex-[2] !py-4 rounded-2xl !bg-emerald-500 hover:!bg-emerald-600 border-b-4 border-emerald-700 text-lg font-black shadow-lg shadow-emerald-200"
            >
              <CheckCircle2 size={24} />
              إكمال النشاط
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleNext}
              disabled={currentCardIndex === cards.length - 1}
              className="flex-[2] !py-4 rounded-2xl !bg-white border-2 border-slate-200 text-slate-700 hover:!bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <ArrowLeft size={24} />
            </Button>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center w-full max-w-[320px] md:max-w-[360px] mt-7">
          {isFlipped ? (
            <Button
              variant="primary"
              onClick={handleComplete}
              className="w-full !py-4 rounded-2xl !bg-emerald-500 hover:!bg-emerald-600 border-b-4 border-emerald-700 text-lg font-black shadow-lg shadow-emerald-200"
            >
              <CheckCircle2 size={24} />
              إكمال النشاط
            </Button>
          ) : (
            <div className="h-[60px] w-full"></div>
          )}
        </div>
      )}

      <style jsx>{`
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
};

export default AudioCardsGame;
