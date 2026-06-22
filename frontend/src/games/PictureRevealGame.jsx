import React, { useEffect, useMemo, useState } from 'react';
import FeedbackModal from '../components/FeedbackModal';
import GameHeader from '../components/game/GameHeader';
import {
  GameChoice,
  GameContainer,
  GameImage,
  GameSection,
} from '../components/game/GameUI';
import BirdHint from '../components/game/BirdHint';
import { playAudioUrl } from '../utils/soundEffects';
import ChildGameBackdrop from './ChildGameBackdrop';
import {
  CHILD_GAME_BOARD_MAX_WIDTH,
  CHILD_GAME_SHELL_CLASS,
} from './childGameLayout';

const shuffleArray = (items) => {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
};

const PictureRevealGame = ({
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
  const instructionAr = content.instructionAr || game?.questionTextAr || 'اكشف الصورة ثم اختر الإجابة الصحيحة';
  const questionAudio = content.questionAudio || game?.questionAudio || '';
  const image = content.image || '';
  const gridSize = Math.max(2, Math.min(6, Number(content.gridSize || 4)));
  const revealCount = Math.max(1, Number(content.revealCount || 1));
  const revealMode = content.revealMode || game?.revealMode || 'manual';
  const options = useMemo(() => (Array.isArray(content.options) ? content.options : []), [content]);

  const [revealedCells, setRevealedCells] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showCorrectBird, setShowCorrectBird] = useState(false);
  const [startTime] = useState(Date.now());

  const totalCells = gridSize * gridSize;
  const revealOneCell = (preferredCellIndex = null) => {
    setRevealedCells((current) => {
      const next = new Set(current);

      if (
        Number.isInteger(preferredCellIndex)
        && preferredCellIndex >= 0
        && preferredCellIndex < totalCells
        && !next.has(preferredCellIndex)
      ) {
        next.add(preferredCellIndex);
        return [...next];
      }

      for (let index = 0; index < totalCells; index += 1) {
        if (!next.has(index)) {
          next.add(index);
          break;
        }
      }

      return [...next];
    });
  };
  const autoRevealOrder = useMemo(
    () => shuffleArray(Array.from({ length: totalCells }, (_, index) => index)),
    [game?.id, gridSize, totalCells],
  );
  const answeredEnough = revealedCells.length >= Math.min(totalCells, revealCount);
  const isAutoReveal = revealMode === 'auto';
  const correctOption = options.find((option) => option.isCorrect);
  const avatarState = showFeedback ? (isCorrect ? 'celebration' : 'error') : 'learning';

  useEffect(() => {
    setRevealedCells([]);
    setSelectedOption(null);
    setShowFeedback(false);
    setIsCorrect(false);
    setAttempts(0);
    setShowCorrectBird(false);
  }, [game?.id, gridSize, revealMode, image]);

  useEffect(() => {
    if (!previewMode && questionAudio) {
      playAudioUrl(questionAudio);
    }
  }, [previewMode, questionAudio]);

  useEffect(() => {
    if (!isAutoReveal || !image || typeof window === 'undefined') {
      return undefined;
    }

    const maxReveals = isAutoReveal ? revealCount : 1;
    let stepIndex = 0;
    const intervalId = window.setInterval(() => {
      setRevealedCells((current) => {
        if (current.length >= maxReveals) {
          window.clearInterval(intervalId);
          return current;
        }

        const nextCellIndex = autoRevealOrder[stepIndex];
        stepIndex += 1;

        if (typeof nextCellIndex !== 'number') {
          window.clearInterval(intervalId);
          return current;
        }

        if (current.includes(nextCellIndex)) {
          return current;
        }

        const next = [...current, nextCellIndex];
        if (next.length >= maxReveals) {
          window.clearInterval(intervalId);
        }
        return next;
      });
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [autoRevealOrder, image, isAutoReveal, totalCells]);

  useEffect(() => {
    if (!registerAssistantActions) {
      return undefined;
    }

    registerAssistantActions({
      onVisualHint: () => {
        setShowCorrectBird(true);
        window.setTimeout(() => setShowCorrectBird(false), 2500);
        revealOneCell();
      },
      onGestureHint: () => {
        setShowCorrectBird(true);
        window.setTimeout(() => setShowCorrectBird(false), 2500);
        revealOneCell(0);
      },
      onVerbalHint: () => {
        if (helpVoiceEnabled) {
          const hint = correctOption?.textAr
            ? `الإجابة الصحيحة قريبة من "${correctOption.textAr}"`
            : 'انظر إلى الصورة ثم اختر الإجابة الصحيحة.';
          const utterance = new SpeechSynthesisUtterance(hint);
          utterance.lang = 'ar-SA';
          window.speechSynthesis.speak(utterance);
        }
      },
      onPhysicalPrompt: () => {
        revealOneCell();
      },
    });

    return () => registerAssistantActions({});
  }, [correctOption, helpVoiceEnabled, registerAssistantActions, totalCells]);

  const handleCellClick = (cellIndex) => {
    if (!image || isAutoReveal || revealedCells.includes(cellIndex)) return;
    onAssistantInteraction?.();
    setRevealedCells((current) => (current.includes(cellIndex) ? current : [...current, cellIndex]));
  };

  const handleSelectOption = (option) => {
    onAssistantInteraction?.();
    setAttempts((current) => current + 1);
    setSelectedOption(option);
    setIsCorrect(Boolean(option.isCorrect));
    setShowFeedback(true);
    if (option.isCorrect) {
      setShowCorrectBird(true);
    }
  };

  const handleNext = () => {
    setShowFeedback(false);

    if (!isCorrect) return;
    if (previewMode) return;

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    onComplete({
      correctAnswers: 1,
      wrongAnswers: Math.max(attempts - 1, 0),
      attempts: [Math.max(attempts, 1)],
      prompts: [therapistControlsEnabled ? therapistPromptLevel : 'none'],
      timeSpent,
      isCorrect: true,
    });
  };

  const handleRestart = () => {
    setRevealedCells([]);
    setSelectedOption(null);
    setShowFeedback(false);
    setIsCorrect(false);
    setAttempts(0);
  };

  if (!image) {
    return (
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-[#dbe7f3] bg-white p-8 text-center font-black text-slate-600">
        أضف صورة اللعبة أولا.
      </div>
    );
  }

  return (
    <GameContainer className={`${CHILD_GAME_SHELL_CLASS} select-none`} dir="rtl">
      <ChildGameBackdrop previewMode={previewMode} />

      <GameHeader
        instruction={instructionAr}
        avatarState={avatarState}
        onPlayAudio={() => {
          if (questionAudio) {
            playAudioUrl(questionAudio);
            return;
          }
          if (helpVoiceEnabled) {
            const utterance = new SpeechSynthesisUtterance(instructionAr);
            utterance.lang = 'ar-SA';
            window.speechSynthesis.speak(utterance);
          }
        }}
        onRestart={handleRestart}
      />

      <GameSection>
        <div className="mx-auto w-full" style={{ maxWidth: `${CHILD_GAME_BOARD_MAX_WIDTH}px` }}>
          <div className="relative">
            <GameImage
              src={image}
              alt={game?.titleAr || 'صورة اللعبة'}
              imgClassName="object-contain"
            />

            <div
              className="absolute inset-0 grid overflow-hidden rounded-[clamp(16px,1.8vw,20px)]"
              style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: totalCells }, (_, cellIndex) => {
                const isRevealed = revealedCells.includes(cellIndex);

                return (
                  <button
                    key={cellIndex}
                    type="button"
                    onClick={() => handleCellClick(cellIndex)}
                    className={`border border-white/70 transition-all duration-300 ${
                      isRevealed
                        ? 'pointer-events-none bg-transparent'
                        : 'bg-[linear-gradient(135deg,_rgba(18,126,166,0.88),_rgba(32,183,181,0.88))] hover:opacity-85 active:scale-[0.99]'
                    }`}
                    aria-label={`كشف الجزء ${cellIndex + 1}`}
                  >
                    {!isRevealed && (
                      <span className="flex h-full w-full items-center justify-center text-sm font-black text-white md:text-lg">
                        {cellIndex + 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </GameSection>

      {answeredEnough && (
        <GameSection>
          <div className="mb-3 text-center text-lg font-black text-slate-800">ما هي الصورة؟</div>
          <div
            className="mx-auto grid justify-items-center"
            style={{
              maxWidth: 'min(100%, 32rem)',
              gap: 'clamp(8px, 1vw, 10px)',
              gridTemplateColumns: 'repeat(auto-fit, minmax(132px, 1fr))',
            }}
          >
            {options.map((option, index) => (
              <GameChoice
                key={option.id || index}
                onClick={() => handleSelectOption(option)}
                state={
                  selectedOption?.id === option.id
                    ? isCorrect
                      ? 'correct'
                      : 'wrong'
                    : 'idle'
                }
                className="w-full max-w-[19rem] min-h-[60px] px-4 py-2.5 text-right lg:min-h-[56px] lg:max-w-[17rem]"
              >
                {showCorrectBird && option.isCorrect && (
                  <BirdHint className="pointer-events-none absolute -top-10 left-1/2 z-30 h-14 w-14 -translate-x-1/2 drop-shadow-[0_10px_18px_rgba(6,182,212,0.28)] md:-top-12 md:h-16 md:w-16" />
                )}
                <div className="text-[0.98rem] font-black leading-tight text-slate-800 md:text-[1.02rem]">
                  {option.textAr || option.label || `اختيار ${index + 1}`}
                </div>
              </GameChoice>
            ))}
          </div>
        </GameSection>
      )}

      <FeedbackModal
        show={showFeedback}
        isCorrect={isCorrect}
        onNext={handleNext}
        successSound={content.successSound || game?.successSound}
        failSound={content.failSound || game?.failSound}
      />
    </GameContainer>
  );
};

export default PictureRevealGame;
