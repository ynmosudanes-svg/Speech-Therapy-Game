import React, { useEffect, useMemo, useState } from 'react';
import { Eye, Grid2x2, Sparkles } from 'lucide-react';
import FeedbackModal from '../components/FeedbackModal';
import GameHeader from '../components/game/GameHeader';
import { playAudioUrl } from '../utils/soundEffects';

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
  const revealMode = content.revealMode || 'manual';
  const revealCount = Math.max(1, Number(content.revealCount || 1));
  const options = useMemo(
    () => (Array.isArray(content.options) ? content.options : []),
    [content]
  );

  const [revealedCells, setRevealedCells] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());

  const totalCells = gridSize * gridSize;
  const answeredEnough = revealedCells.length >= Math.min(totalCells, revealCount);
  const correctOption = options.find((option) => option.isCorrect);

  useEffect(() => {
    setRevealedCells([]);
    setSelectedOption(null);
    setShowFeedback(false);
    setIsCorrect(false);
    setAttempts(0);
  }, [game?.id, gridSize]);

  useEffect(() => {
    if (!previewMode && questionAudio) {
      playAudioUrl(questionAudio);
    }
  }, [previewMode, questionAudio]);

  useEffect(() => {
    if (!registerAssistantActions) {
      return undefined;
    }

    registerAssistantActions({
      onVisualHint: () => {
        setRevealedCells((current) => {
          const next = new Set(current);
          for (let index = 0; index < totalCells; index += 1) {
            if (next.size >= Math.min(totalCells, revealCount)) break;
            next.add(index);
          }
          return [...next];
        });
      },
      onGestureHint: () => {
        setRevealedCells((current) => {
          const next = new Set(current);
          next.add(0);
          return [...next];
        });
      },
      onVerbalHint: () => {
        if (helpVoiceEnabled) {
          const hint = correctOption?.textAr ? `الإجابة الصحيحة قريبة من "${correctOption.textAr}"` : 'انظر إلى الصورة ثم اختر الإجابة الصحيحة.';
          const utterance = new SpeechSynthesisUtterance(hint);
          utterance.lang = 'ar-SA';
          window.speechSynthesis.speak(utterance);
        }
      },
      onPhysicalPrompt: () => {
        setRevealedCells(Array.from({ length: totalCells }, (_, index) => index));
      },
    });

    return () => registerAssistantActions({});
  }, [correctOption, helpVoiceEnabled, registerAssistantActions, revealCount, totalCells]);

  const handleCellClick = (cellIndex) => {
    if (!image || revealedCells.includes(cellIndex)) {
      return;
    }

    onAssistantInteraction?.();

    setRevealedCells((current) => {
      if (current.includes(cellIndex)) {
        return current;
      }
      return [...current, cellIndex];
    });
  };

  const handleSelectOption = (option) => {
    onAssistantInteraction?.();
    setAttempts((current) => current + 1);
    setSelectedOption(option);
    setIsCorrect(Boolean(option.isCorrect));
    setShowFeedback(true);
  };

  const handleNext = () => {
    setShowFeedback(false);

    if (!isCorrect) {
      return;
    }

    if (previewMode) {
      return;
    }

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

  const visibleImageClassName = revealMode === 'auto'
    ? 'opacity-100'
    : 'opacity-100 transition-all duration-300';

  if (!image) {
    return (
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-[#dbe7f3] bg-white p-8 text-center font-black text-slate-600">
        أضف صورة اللعبة أولاً.
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 select-none" dir="rtl">
      <GameHeader
        instruction={instructionAr}
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

      <div className="rounded-[2rem] border border-[#dbe7f3] bg-white/90 p-3 shadow-[0_18px_36px_-28px_rgba(71,85,105,0.2)] md:p-5">
        <div className="mb-3 flex items-center justify-between text-sm font-black text-slate-500">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#eefafd] px-3 py-1 text-[#19add6]">
            <Grid2x2 size={15} />
            {gridSize} x {gridSize}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
            كشف {revealedCells.length} / {Math.min(totalCells, revealCount)}
          </span>
        </div>

        <div className="mx-auto w-full max-w-[620px]">
          <div className="relative aspect-square overflow-hidden rounded-[1.6rem] border-4 border-white bg-white shadow-[0_16px_36px_-18px_rgba(15,111,166,0.2)]">
            <img
              src={image}
              alt={game?.titleAr || 'صورة اللعبة'}
              className={`h-full w-full object-contain ${visibleImageClassName}`}
            />

            <div
              className="absolute inset-0 grid"
              style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: totalCells }, (_, cellIndex) => {
                const row = Math.floor(cellIndex / gridSize);
                const col = cellIndex % gridSize;
                const isRevealed = revealedCells.includes(cellIndex);

                return (
                  <button
                    key={`${row}-${col}`}
                    type="button"
                    onClick={() => handleCellClick(cellIndex)}
                    className={`border border-white/80 transition-all duration-300 ${
                      isRevealed
                        ? 'pointer-events-none bg-transparent'
                        : 'bg-[linear-gradient(135deg,_rgba(18,126,166,0.9),_rgba(32,183,181,0.9))] hover:opacity-80 active:scale-[0.98]'
                    }`}
                    aria-label={`كشف الجزء ${cellIndex + 1}`}
                  >
                    {!isRevealed && (
                      <span className="flex h-full w-full items-center justify-center text-base font-black text-white md:text-xl">
                        {cellIndex + 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm font-bold text-slate-500">
          <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-sky-700">
            <Sparkles size={15} />
            اضغط على المربعات لكشف الصورة
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
            <Eye size={15} />
            ثم اختر الإجابة الصحيحة
          </span>
        </div>
      </div>

      {answeredEnough && (
        <div className="rounded-[2rem] border border-[#dbe7f3] bg-white/90 p-4 shadow-[0_16px_32px_-24px_rgba(71,85,105,0.18)] md:p-5">
          <div className="mb-3 text-center text-lg font-black text-slate-800">ما هي الصورة؟</div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            {options.map((option, index) => (
              <button
                key={option.id || index}
                type="button"
                onClick={() => handleSelectOption(option)}
                className={`rounded-[1.35rem] border-2 p-3 text-right transition-all hover:-translate-y-1 hover:shadow-lg active:scale-95 ${
                  selectedOption?.id === option.id
                    ? isCorrect
                      ? 'border-emerald-400 bg-emerald-50'
                      : 'border-rose-400 bg-rose-50'
                    : 'border-slate-200 bg-white hover:border-sky-200'
                }`}
              >
                <div className="text-base font-black text-slate-800 md:text-lg">{option.textAr || option.label || `اختيار ${index + 1}`}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <FeedbackModal
        show={showFeedback}
        isCorrect={isCorrect}
        onNext={handleNext}
        successSound={content.successSound || game?.successSound}
        failSound={content.failSound || game?.failSound}
      />
    </div>
  );
};

export default PictureRevealGame;
