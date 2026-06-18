import React, { useEffect, useMemo, useState } from 'react';
import { Sparkles, XCircle } from 'lucide-react';
import FeedbackModal from '../components/FeedbackModal';
import GameImage from '../components/game/GameImage';
import GameHeader from '../components/game/GameHeader';
import { playAudioUrl } from '../utils/soundEffects';

const speakArabic = (text) => {
  if (!text || typeof window === 'undefined') {
    return;
  }

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

const MatchingGame = ({
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
  const [shadowRevealed, setShadowRevealed] = useState(false);
  const [shadowHeroPreviewSrc, setShadowHeroPreviewSrc] = useState('');
  const [startTime] = useState(Date.now());

  /* ── Visual hint states ── */
  const [visualPulse, setVisualPulse] = useState(false);
  const [gestureArrow, setGestureArrow] = useState(false);
  const [physicalHighlight, setPhysicalHighlight] = useState(false);

  const instructionAr = config?.content?.instructionAr || game?.questionTextAr || 'اكتب السؤال هنا';
  const questionAudio = config?.content?.questionAudio || game?.questionAudio || '';
  const heroImage = config?.content?.hero?.image || '';
  const options = useMemo(
    () => (Array.isArray(config?.content?.options) ? config.content.options : []),
    [config]
  );
  const successSound = config?.feedback?.successSound || game?.successSound || '';
  const failSound = config?.feedback?.failSound || game?.failSound || '';
  const gameType = config?.gameType || game?.type;
  const isDifferentMode = gameType === 'matching.different';
  const isFindMode = gameType === 'matching.find';
  const isShadowMode = gameType === 'matching.shadow';
  const gridClassName = isDifferentMode
    ? 'grid-cols-2 max-w-2xl mx-auto'
    : isFindMode || isShadowMode
      ? options.length <= 2
        ? 'grid-cols-2 max-w-2xl mx-auto'
        : options.length === 3
          ? 'grid-cols-2 md:grid-cols-3 max-w-4xl mx-auto'
          : options.length <= 4
            ? 'grid-cols-2 md:grid-cols-2 max-w-3xl mx-auto'
            : 'grid-cols-2 md:grid-cols-3 max-w-5xl mx-auto'
    : options.length <= 2
      ? 'grid-cols-2 max-w-3xl mx-auto'
      : 'grid-cols-2 md:grid-cols-2 xl:grid-cols-3';

  /* ── Auto-play question audio from the game ── */
  useEffect(() => {
    if (questionAudio) {
      playAudioUrl(questionAudio);
    }
  }, [questionAudio]);

  useEffect(() => {
    if (!isShadowMode || shadowRevealed || !heroImage || typeof window === 'undefined') {
      setShadowHeroPreviewSrc('');
      return undefined;
    }

    let isCancelled = false;
    const image = new window.Image();
    image.crossOrigin = 'anonymous';

    image.onload = () => {
      if (isCancelled) {
        return;
      }

      try {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;

        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) {
          setShadowHeroPreviewSrc('');
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const frame = context.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = frame.data;

        for (let index = 0; index < pixels.length; index += 4) {
          const red = pixels[index];
          const green = pixels[index + 1];
          const blue = pixels[index + 2];
          const alpha = pixels[index + 3];
          const isNearWhite = red > 240 && green > 240 && blue > 240;
          const isNearlyTransparent = alpha < 20;

          if (isNearWhite || isNearlyTransparent) {
            pixels[index + 3] = 0;
            continue;
          }

          pixels[index] = 0;
          pixels[index + 1] = 0;
          pixels[index + 2] = 0;
          pixels[index + 3] = alpha;
        }

        context.putImageData(frame, 0, 0);
        setShadowHeroPreviewSrc(canvas.toDataURL('image/png'));
      } catch {
        setShadowHeroPreviewSrc('');
      }
    };

    image.onerror = () => {
      if (!isCancelled) {
        setShadowHeroPreviewSrc('');
      }
    };

    image.src = heroImage;

    return () => {
      isCancelled = true;
    };
  }, [heroImage, isShadowMode, shadowRevealed]);

  const playInstruction = () => {
    if (questionAudio) {
      playAudioUrl(questionAudio);
      return;
    }

    speakArabic(instructionAr);
  };

  /* ── Register 4 assistant callbacks ── */
  useEffect(() => {
    if (!registerAssistantActions) {
      return undefined;
    }

    registerAssistantActions({
      /* Level 1: Visual — pulse/glow on correct answer */
      onVisualHint: () => {
        setVisualPulse(true);
        window.setTimeout(() => setVisualPulse(false), 2500);
      },

      /* Level 2: Gesture — show arrow/pointer toward correct */
      onGestureHint: () => {
        setGestureArrow(true);
        window.setTimeout(() => setGestureArrow(false), 3000);
      },

      /* Level 3: Verbal — speak a hint */
      onVerbalHint: () => {
        const correctOption = options.find((o) => o.isCorrect);
        const hint = correctOption?.textAr
          ? `ركّز كويس… الإجابة قريبة من "${correctOption.textAr}"`
          : 'ركّز كويس وبص على الصور تاني.';
        if (helpVoiceEnabled) speakArabic(hint);
      },

      /* Level 4: Physical — full obvious highlight + speak answer */
      onPhysicalPrompt: () => {
        setPhysicalHighlight(true);
        window.setTimeout(() => setPhysicalHighlight(false), 4000);
        if (helpVoiceEnabled) {
          const correctOption = options.find((o) => o.isCorrect);
          const hint = correctOption?.textAr
            ? `الإجابة الصحيحة هي "${correctOption.textAr}"!`
            : 'بص على الصورة اللي بتلمع دي!';
          speakArabic(hint);
        }
      },
    });

    return () => registerAssistantActions({});
  }, [helpVoiceEnabled, instructionAr, questionAudio, options, registerAssistantActions]);

  const handleOptionSelect = (option) => {
    onAssistantInteraction?.();
    setAttempts((current) => current + 1);
    setSelectedOption(option);
    setIsCorrect(Boolean(option.isCorrect));
    setShowFeedback(true);

    // Reveal shadow on correct answer
    if (isShadowMode && option.isCorrect) {
      setShadowRevealed(true);
    }

    // Clear any hints
    setVisualPulse(false);
    setGestureArrow(false);
    setPhysicalHighlight(false);
  };

  const handleNext = () => {
    setShowFeedback(false);

    if (!isCorrect) {
      setSelectedOption(null);
      return;
    }

    if (previewMode) {
      setSelectedOption(null);
      return;
    }

    const totalAttempts = attempts || 1;
    const responseTime = Date.now() - startTime;
    const timeSpent = Math.floor(responseTime / 1000);
    onComplete({
      correctAnswers: 1,
      wrongAnswers: Math.max(totalAttempts - 1, 0),
      attempts: [totalAttempts],
      prompts: [therapistControlsEnabled ? therapistPromptLevel : 'none'],
      timeSpent,
      responseTime,
      selectedAnswer: selectedOption?.id || '',
      isCorrect: true,
    });
  };

  /* ── Helper: compute card border class ── */
  const getOptionBorderClass = (option) => {
    if (selectedOption?.id === option.id) {
      return isCorrect
        ? 'border-[#cfe3f3] bg-sky-50/80 shadow-[0_18px_36px_-18px_rgba(56,189,248,0.24)]'
        : 'border-rose-300 bg-rose-50/80 shadow-[0_18px_36px_-18px_rgba(244,63,94,0.45)] therapy-shake';
    }
    if (physicalHighlight && option.isCorrect) {
      return 'border-[#bfe3f2] ring-4 ring-[#d7ecf7] shadow-[0_22px_44px_-18px_rgba(56,189,248,0.24)] scale-[1.02]';
    }
    if (gestureArrow && option.isCorrect) {
      return 'border-amber-300 ring-4 ring-amber-300/70 shadow-[0_22px_44px_-18px_rgba(217,119,6,0.45)]';
    }
    if (visualPulse && option.isCorrect) {
      return 'border-yellow-300 ring-8 ring-yellow-300/60 animate-pulse shadow-[0_22px_44px_-18px_rgba(250,204,21,0.5)]';
    }
    return 'border-[#dbe7f3] shadow-[0_14px_28px_-24px_rgba(71,85,105,0.22)]';
  };

  const handleRestart = () => {
    setSelectedOption(null);
    setShowFeedback(false);
    setIsCorrect(false);
    setAttempts(0);
    setShadowRevealed(false);
  };

  const shellClassName = previewMode
    ? 'relative isolate w-full overflow-hidden rounded-[2.25rem] md:rounded-[2.75rem] bg-[linear-gradient(135deg,_#f4fbff_0%,_#eef9ff_42%,_#f7fdff_100%)] p-4 md:p-6 shadow-[0_32px_70px_-34px_rgba(70,149,184,0.24)]'
    : 'relative isolate w-full min-h-[calc(100dvh-8rem)] overflow-visible bg-transparent px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-6';
  const backgroundLayerClassName = previewMode ? 'absolute inset-0' : 'fixed inset-0';
  const shadowHeroImageClassName = shadowRevealed
    ? 'relative z-10 max-h-full w-full scale-[1.06] object-contain drop-shadow-sm transition-all duration-500 mix-blend-multiply'
    : 'relative z-10 max-h-full w-full scale-[1.06] object-contain drop-shadow-none transition-all duration-500';

  return (
    <div
      className={shellClassName}
      dir="rtl"
    >
      <div className={`${backgroundLayerClassName} pointer-events-none -z-10 overflow-hidden bg-[linear-gradient(135deg,_#f4fbff_0%,_#eef9ff_42%,_#f7fdff_100%)]`}>
        <div className="absolute right-[7%] top-[9%] h-64 w-64 rounded-full bg-sky-200/24 blur-[74px] therapy-blob" />
        <div className="absolute bottom-[8%] left-[6%] h-80 w-80 rounded-full bg-cyan-200/20 blur-[86px] therapy-blob therapy-blob-delay-1" />
        <div className="absolute left-[34%] top-[42%] h-60 w-60 rounded-full bg-sky-100/22 blur-[72px] therapy-blob therapy-blob-delay-2" />
        <div className="absolute top-[14%] left-[16%] h-24 w-44 rounded-full bg-white/55 blur-[6px]" />
        <div className="absolute top-[17%] left-[21%] h-20 w-24 rounded-full bg-white/60 blur-[4px]" />
        <div className="absolute top-[19%] left-[11%] h-16 w-20 rounded-full bg-white/58 blur-[4px]" />
        <div className="absolute bottom-[24%] right-[12%] h-20 w-20 rounded-full bg-cyan-100/35 blur-[2px]" />
        <div className="absolute top-[28%] right-[18%] h-10 w-10 rounded-full bg-sky-100/48 blur-[1px]" />
        <div className="absolute bottom-[18%] left-[22%] h-12 w-12 rounded-full bg-blue-100/48 blur-[1px]" />

        <Sparkles className="therapy-star absolute left-[13%] top-[12%] h-7 w-7 text-[#f4d35e]/70 drop-shadow-[0_0_12px_rgba(244,211,94,0.45)]" />
        <Sparkles className="therapy-star absolute bottom-[18%] right-[9%] h-9 w-9 text-[#f2c94c]/62 drop-shadow-[0_0_14px_rgba(242,201,76,0.42)] [animation-delay:1.4s]" />
        <Sparkles className="therapy-star absolute right-[22%] top-[26%] h-5 w-5 text-[#f7dc6f]/68 drop-shadow-[0_0_10px_rgba(247,220,111,0.4)] [animation-delay:2.1s]" />
        <Sparkles className="therapy-star absolute left-[26%] bottom-[14%] h-5 w-5 text-[#f6c945]/64 drop-shadow-[0_0_10px_rgba(246,201,69,0.4)] [animation-delay:0.8s]" />
        <Sparkles className="therapy-star absolute right-[12%] top-[14%] h-6 w-6 text-[#f5cf54]/66 drop-shadow-[0_0_12px_rgba(245,207,84,0.42)] [animation-delay:1.1s]" />
        <Sparkles className="therapy-star absolute left-[9%] bottom-[24%] h-4 w-4 text-[#f7dc6f]/60 drop-shadow-[0_0_9px_rgba(247,220,111,0.35)] [animation-delay:2.4s]" />
        <Sparkles className="therapy-star absolute right-[28%] bottom-[10%] h-7 w-7 text-[#f4d35e]/58 drop-shadow-[0_0_11px_rgba(244,211,94,0.38)] [animation-delay:0.5s]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col gap-3 md:gap-5 md:max-w-5xl">
        <GameHeader
          instruction={instructionAr}
          onPlayAudio={playInstruction}
          onRestart={handleRestart}
        />

        {!isFindMode && (
          <div
            className={
              isShadowMode
                ? 'flex min-h-44 w-full max-w-sm flex-col items-center justify-center overflow-hidden rounded-[1.75rem] border border-[#dbe7f3] bg-white/90 p-3 shadow-[0_14px_28px_-24px_rgba(71,85,105,0.2)] backdrop-blur-xl sm:min-h-52 md:min-h-72 md:rounded-[2.25rem] md:p-6 mx-auto'
                : 'rounded-[1.65rem] md:rounded-[2rem] border border-[#dbe7f3] bg-white/85 p-3 md:p-5 shadow-[0_14px_28px_-24px_rgba(71,85,105,0.2)] backdrop-blur-xl flex flex-col items-center justify-center w-full max-w-2xl mx-auto'
            }
          >
            <div
              className={
                isShadowMode
                  ? 'relative z-10 flex h-28 w-full items-center justify-center overflow-hidden rounded-[1.2rem] bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.98),_rgba(248,250,252,0.9)_62%,_rgba(241,245,249,0.72)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] sm:h-32 md:h-52 md:rounded-[1.5rem]'
                  : 'w-full max-w-sm relative z-10'
              }
            >
              {isShadowMode && <div className="absolute inset-3 rounded-[1rem] bg-white/28 blur-md" />}
              {heroImage ? (
                <GameImage
                  src={!shadowRevealed && shadowHeroPreviewSrc ? shadowHeroPreviewSrc : heroImage}
                  alt={game?.titleAr || game?.name || 'Hero'}
                  removeWhiteBackground={!isShadowMode}
                  className={
                    isShadowMode
                      ? shadowHeroImageClassName
                      : 'w-full h-28 sm:h-36 md:h-56 object-contain rounded-[1.3rem] md:rounded-[1.5rem] drop-shadow-md mix-blend-multiply'
                  }
                />
              ) : (
                <div className={`${isShadowMode ? 'h-full' : 'h-28 sm:h-36 md:h-56'} flex w-full items-center justify-center rounded-[1.3rem] border-2 border-dashed border-slate-200 bg-slate-50/70 px-4 text-center font-black leading-7 text-slate-400 md:rounded-[1.5rem]`}>
                  {isShadowMode ? 'صورة الظل' : 'الصورة الرئيسية'}
                </div>
              )}
            </div>
          </div>
        )}

        <div className={`grid gap-3 md:gap-6 w-full mt-10 sm:mt-11 md:mt-3 ${gridClassName}`}>
          {options.map((option, index) => (
            <button
              key={option.id || index}
              type="button"
              onClick={() => handleOptionSelect(option)}
              className={`
                group relative flex min-h-44 sm:min-h-52 md:min-h-72 flex-col items-center justify-between overflow-hidden rounded-[1.75rem] md:rounded-[2.25rem]
                bg-white/85 p-3 md:p-6 border transition-all duration-300 backdrop-blur-xl
                hover:-translate-y-1 hover:border-[#cfe3f3] hover:bg-white
                focus:outline-none focus-visible:ring-4 focus-visible:ring-[#d7ecf7]
                active:scale-95
                ${getOptionBorderClass(option)}
              `}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-sky-500/4 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              {gestureArrow && option.isCorrect && (
                <div className="absolute -top-10 left-1/2 z-20 -translate-x-1/2 text-4xl text-amber-400 drop-shadow-md animate-bounce">
                  ↓
                </div>
              )}

              {selectedOption?.id === option.id && !isCorrect && (
                <XCircle className="absolute right-4 top-4 h-8 w-8 rounded-full bg-rose-500 p-1.5 text-white shadow-lg" />
              )}

              <div className="relative z-10 flex flex-1 w-full items-center justify-center px-2 py-2 md:px-3 md:py-3 transition-transform duration-300 group-hover:scale-[1.02]">
                {option.image ? (
                  <div className="relative flex h-28 w-full items-center justify-center overflow-hidden rounded-[1.2rem] sm:h-32 md:h-52 md:rounded-[1.5rem] bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.98),_rgba(248,250,252,0.9)_62%,_rgba(241,245,249,0.72)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                    <div className="absolute inset-3 rounded-[1rem] bg-white/28 blur-md" />
                    <GameImage
                      src={option.image}
                      alt={option.textAr || `option-${index + 1}`}
                      className="relative z-10 max-h-full w-full scale-[1.06] object-contain drop-shadow-sm pointer-events-none mix-blend-multiply"
                    />
                  </div>
                ) : (
                  <div className="w-full h-28 sm:h-32 md:h-52 bg-slate-50/80 rounded-[1.25rem] md:rounded-[1.5rem] border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 font-black pointer-events-none text-center px-4 leading-7">
                    صورة الاختيار
                  </div>
                )}
              </div>

              {!!option.textAr && (
                <h3 className="relative z-10 mt-2 md:mt-4 rounded-full border border-slate-200/60 bg-slate-100 px-3 py-1.5 md:px-4 md:py-2 text-[11px] sm:text-xs md:text-base font-black text-center text-slate-700 pointer-events-none">
                  {option.textAr}
                </h3>
              )}
            </button>
          ))}
        </div>
      </div>

      <FeedbackModal
        show={showFeedback}
        isCorrect={isCorrect}
        onNext={handleNext}
        successSound={successSound}
        failSound={failSound}
      />
    </div>
  );
};

export default MatchingGame;
