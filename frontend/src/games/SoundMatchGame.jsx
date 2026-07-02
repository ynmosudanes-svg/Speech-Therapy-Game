import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw, Volume2 } from 'lucide-react';
import FeedbackModal from '../components/FeedbackModal';
import GameHeader from '../components/game/GameHeader';
import {
  GameChoice,
  GameContainer,
  GameGrid,
  GameImage,
  GameSection,
} from '../components/game/GameUI';
import { isPlayableMediaUrl, stopGameAudio } from '../utils/soundEffects';
import ChildGameBackdrop from './ChildGameBackdrop';

const TEXT = {
  defaultInstruction: 'اسمع الصوت واختر الحيوان الصحيح',
  listenNow: 'اسمع الصوت',
  chooseNow: 'اختر الحيوان',
  replay: 'إعادة الصوت',
  noImage: 'صورة الحيوان',
};

const SoundMatchGame = ({
  game,
  onComplete,
  therapistControlsEnabled = false,
  therapistPromptLevel = 'none',
  onAssistantInteraction = () => {},
  registerAssistantActions,
  previewMode = false,
}) => {
  const content = game?.config?.content || {};
  const feedback = game?.config?.feedback || {};
  const options = Array.isArray(content.options) ? content.options : [];
  const correctOption = useMemo(() => options.find((option) => option.isCorrect) || options[0] || null, [options]);
  const instructionText = content.instructionAr || game?.questionTextAr || TEXT.defaultInstruction;
  const instructionAudio = content.questionAudio || content.instructionAudio || game?.questionAudio || '';
  const targetAudio = content.targetAudio || '';

  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [phase, setPhase] = useState(previewMode ? 'ready' : 'idle');
  const [hintedOptionId, setHintedOptionId] = useState('');
  const [startTime] = useState(Date.now());
  const [attempts, setAttempts] = useState(0);

  const audioRef = useRef(null);
  const sequenceRef = useRef(0);

  const cleanupAudio = useCallback(() => {
    sequenceRef.current += 1;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const playClip = useCallback((url) => new Promise((resolve) => {
    if (!url || typeof window === 'undefined' || !isPlayableMediaUrl(url)) {
      resolve();
      return;
    }

    const audio = new Audio(url);
    audioRef.current = audio;

    const release = () => {
      if (audioRef.current === audio) {
        audioRef.current = null;
      }
      resolve();
    };

    audio.addEventListener('ended', release, { once: true });
    audio.addEventListener('error', release, { once: true });
    audio.play().catch(release);
  }), []);

  const speakText = useCallback((text) => new Promise((resolve) => {
    if (!text || typeof window === 'undefined' || !window.speechSynthesis) {
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-EG';
    utterance.rate = 0.88;
    utterance.pitch = 1.08;
    utterance.onend = resolve;
    utterance.onerror = resolve;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }), []);

  const playTargetSound = useCallback(async () => {
    stopGameAudio();
    cleanupAudio();
    const sequenceId = sequenceRef.current;
    setPhase('sound');

    if (targetAudio) {
      await playClip(targetAudio);
    } else if (correctOption?.textAr) {
      await speakText(correctOption.textAr);
    }

    if (sequenceRef.current === sequenceId) {
      setPhase('ready');
    }
  }, [cleanupAudio, correctOption?.textAr, playClip, speakText, targetAudio]);

  const playFullPrompt = useCallback(async () => {
    stopGameAudio();
    cleanupAudio();
    const sequenceId = sequenceRef.current;
    setHintedOptionId('');
    setPhase('intro');

    if (instructionAudio) {
      await playClip(instructionAudio);
    } else {
      await speakText(instructionText);
    }

    if (sequenceRef.current !== sequenceId) return;

    setPhase('sound');
    if (targetAudio) {
      await playClip(targetAudio);
    } else if (correctOption?.textAr) {
      await speakText(correctOption.textAr);
    }

    if (sequenceRef.current === sequenceId) {
      setPhase('ready');
    }
  }, [cleanupAudio, correctOption?.textAr, instructionAudio, instructionText, playClip, speakText, targetAudio]);

  useEffect(() => {
    if (!previewMode) {
      playFullPrompt();
    }

    return cleanupAudio;
  }, [cleanupAudio, game?.id, playFullPrompt, previewMode]);

  useEffect(() => {
    if (!registerAssistantActions) return undefined;

    registerAssistantActions({
      onVisualHint: () => {
        if (correctOption?.id) {
          setHintedOptionId(correctOption.id);
        }
      },
      onGestureHint: () => {
        if (correctOption?.id) {
          setHintedOptionId(correctOption.id);
        }
      },
      onVerbalHint: () => {
        playTargetSound();
      },
      onPhysicalPrompt: () => {
        if (correctOption) {
          setPhase('ready');
          setHintedOptionId(correctOption.id);
        }
      },
    });

    return () => registerAssistantActions({});
  }, [correctOption, playTargetSound, registerAssistantActions]);

  const handleOptionSelect = (option) => {
    if (phase !== 'ready' || showFeedback) return;

    onAssistantInteraction?.();
    setAttempts((current) => current + 1);
    setSelectedOption(option);
    setIsCorrect(Boolean(option.isCorrect));
    setShowFeedback(true);
    setHintedOptionId('');
  };

  const handleNext = () => {
    setShowFeedback(false);

    if (isCorrect) {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      onComplete({
        correctAnswers: 1,
        wrongAnswers: Math.max(0, attempts - 1),
        attempts: [attempts],
        prompts: [therapistControlsEnabled ? therapistPromptLevel : 'none'],
        timeSpent,
      });
      return;
    }

    setSelectedOption(null);
    playTargetSound();
  };

  const handleRestart = () => {
    setSelectedOption(null);
    setShowFeedback(false);
    setIsCorrect(false);
    setAttempts(0);
    playFullPrompt();
  };

  const isLocked = phase !== 'ready' || showFeedback;
  const avatarState = showFeedback ? (isCorrect ? 'celebration' : 'error') : 'learning';

  if (!options.length) {
    return (
      <GameContainer className="max-w-3xl" dir="rtl">
        <ChildGameBackdrop />
        <GameSection className="text-center text-lg font-black text-slate-600">
          لا توجد اختيارات في هذا النشاط
        </GameSection>
      </GameContainer>
    );
  }

  return (
    <GameContainer className="max-w-4xl" dir="rtl">
      <ChildGameBackdrop />
      <GameHeader
        instruction={instructionText}
        instructionAudio={instructionAudio}
        avatarState={avatarState}
        onPlayAudio={playFullPrompt}
      />

      <GameSection className="mx-auto w-full max-w-2xl">
        <div className="flex flex-col items-center gap-4 text-center">
          <button
            type="button"
            onClick={playTargetSound}
            className={`group relative flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-[#19add6] text-white shadow-[0_24px_48px_-28px_rgba(25,173,214,0.85)] transition-all hover:-translate-y-1 active:scale-95 sm:h-32 sm:w-32 ${
              phase === 'sound' ? 'animate-pulse' : ''
            }`}
            aria-label={TEXT.replay}
          >
            <span className="absolute inset-3 rounded-full border border-white/35" />
            <Volume2 className="h-12 w-12 sm:h-14 sm:w-14" strokeWidth={2.8} />
          </button>

          <div className="flex items-center gap-2 rounded-full border border-sky-100 bg-white px-4 py-2 text-sm font-black text-sky-700 shadow-sm">
            {phase === 'ready' ? (
              <>
                <RefreshCw size={16} />
                <span>{TEXT.chooseNow}</span>
              </>
            ) : (
              <>
                <Volume2 size={16} />
                <span>{TEXT.listenNow}</span>
              </>
            )}
          </div>
        </div>
      </GameSection>

      <GameGrid className="mx-auto w-full max-w-4xl" minWidth="clamp(140px, 36vw, 190px)">
        {options.map((option) => {
          const selected = selectedOption?.id === option.id;
          const state = selected
            ? isCorrect
              ? 'correct'
              : 'wrong'
            : hintedOptionId === option.id
              ? 'hint'
              : 'idle';

          return (
            <GameChoice
              key={option.id}
              onClick={() => handleOptionSelect(option)}
              disabled={isLocked}
              state={state}
              className={`min-h-[clamp(160px,38vw,220px)] ${isLocked ? 'cursor-not-allowed opacity-65' : ''}`}
            >
              <GameImage src={option.image} alt={option.textAr || option.label || ''} className="flex-1" emptyLabel={TEXT.noImage} />
            </GameChoice>
          );
        })}
      </GameGrid>

      <FeedbackModal
        show={showFeedback}
        isCorrect={isCorrect}
        onNext={handleNext}
        successSound={feedback.successSound || game?.successSound}
        failSound={feedback.failSound || game?.failSound}
      />
    </GameContainer>
  );
};

export default SoundMatchGame;
