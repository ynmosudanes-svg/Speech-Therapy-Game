import React, { useEffect, useMemo, useState } from 'react';
import FeedbackModal from '../components/FeedbackModal';
import GameHeader from '../components/game/GameHeader';
import {
  GameChoice,
  GameContainer,
  GameGrid,
  GameImage,
  GameSection,
} from '../components/game/GameUI';
import { playAudioUrl } from '../utils/soundEffects';
import ChildGameBackdrop from './ChildGameBackdrop';

const speakArabic = (text) => {
  if (!text || typeof window === 'undefined') return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ar-SA';
  window.speechSynthesis.speak(utterance);
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
  const [visualPulse, setVisualPulse] = useState(false);
  const [gestureArrow, setGestureArrow] = useState(false);
  const [physicalHighlight, setPhysicalHighlight] = useState(false);

  const instructionAr = config?.content?.instructionAr || game?.questionTextAr || 'اكتب السؤال هنا';
  const questionAudio = config?.content?.questionAudio || game?.questionAudio || '';
  const heroImage = config?.content?.hero?.image || '';
  const options = useMemo(
    () => (Array.isArray(config?.content?.options) ? config.content.options : []),
    [config],
  );
  const successSound = config?.feedback?.successSound || game?.successSound || '';
  const failSound = config?.feedback?.failSound || game?.failSound || '';
  const gameType = config?.gameType || game?.type;
  const isDifferentMode = gameType === 'matching.different';
  const isFindMode = gameType === 'matching.find';
  const isShadowMode = gameType === 'matching.shadow';
  const avatarState = showFeedback ? (isCorrect ? 'celebration' : 'error') : 'learning';

  useEffect(() => {
    if (questionAudio) playAudioUrl(questionAudio);
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
      if (isCancelled) return;
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
      if (!isCancelled) setShadowHeroPreviewSrc('');
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

  useEffect(() => {
    if (!registerAssistantActions) return undefined;

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
        const correctOption = options.find((o) => o.isCorrect);
        const hint = correctOption?.textAr
          ? `ركز كويس، الإجابة قريبة من "${correctOption.textAr}"`
          : 'ركز كويس وبص على الصور تاني.';
        if (helpVoiceEnabled) speakArabic(hint);
      },
      onPhysicalPrompt: () => {
        setPhysicalHighlight(true);
        window.setTimeout(() => setPhysicalHighlight(false), 4000);
      },
    });

    return () => registerAssistantActions({});
  }, [helpVoiceEnabled, options, registerAssistantActions]);

  const handleOptionSelect = (option) => {
    onAssistantInteraction?.();
    setAttempts((current) => current + 1);
    setSelectedOption(option);
    setIsCorrect(Boolean(option.isCorrect));
    setShowFeedback(true);

    if (isShadowMode && option.isCorrect) {
      setShadowRevealed(true);
    }

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

  const handleRestart = () => {
    setSelectedOption(null);
    setShowFeedback(false);
    setIsCorrect(false);
    setAttempts(0);
    setShadowRevealed(false);
  };

  const optionMinWidth = isDifferentMode ? 'clamp(132px, 26vw, 210px)' : 'clamp(136px, 24vw, 220px)';
  const heroImageSrc = !shadowRevealed && shadowHeroPreviewSrc ? shadowHeroPreviewSrc : heroImage;

  return (
    <GameContainer className={previewMode ? 'max-w-4xl' : 'max-w-4xl'} dir="rtl">
      <ChildGameBackdrop previewMode={previewMode} />

      <GameHeader
        instruction={instructionAr}
        avatarState={avatarState}
        onPlayAudio={playInstruction}
        onRestart={handleRestart}
      />

      {!isFindMode && (
        <GameSection className={isShadowMode ? 'mx-auto max-w-[clamp(220px,42vw,320px)]' : 'mx-auto max-w-[clamp(220px,48vw,360px)]'}>
          <GameImage
            src={heroImageSrc}
            alt={game?.titleAr || game?.name || 'Hero'}
            fit="contain"
            imgClassName={isShadowMode && !shadowRevealed ? 'brightness-0 saturate-0 opacity-95' : ''}
            emptyLabel={isShadowMode ? 'صورة الظل' : 'الصورة الرئيسية'}
          />
        </GameSection>
      )}

      <GameGrid className="mx-auto w-full" minWidth={optionMinWidth}>
        {options.map((option, index) => {
          const state =
            selectedOption?.id === option.id
              ? isCorrect
                ? 'correct'
                : 'wrong'
              : physicalHighlight && option.isCorrect
                ? 'hint'
                : 'idle';

          return (
            <GameChoice
              key={option.id || index}
              onClick={() => handleOptionSelect(option)}
              state={state}
              className="relative min-h-[clamp(156px,28vw,236px)]"
            >
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

              {gestureArrow && option.isCorrect && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-3xl text-amber-500">↓</div>
              )}
              {visualPulse && option.isCorrect && (
                <div className="pointer-events-none absolute inset-0 rounded-[clamp(20px,2.1vw,24px)] ring-4 ring-yellow-300/70 animate-pulse" />
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

export default MatchingGame;
