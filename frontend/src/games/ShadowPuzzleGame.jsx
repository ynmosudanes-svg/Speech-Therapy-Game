import React, { useMemo, useState } from 'react';
import { CheckCircle2, Star, XCircle } from 'lucide-react';
import GameHeader from '../components/game/GameHeader';
import { playAudioUrl } from '../utils/soundEffects';

const speakArabic = (text) => {
  if (!text || typeof window === 'undefined') return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ar-SA';
  window.speechSynthesis.speak(utterance);
};

const getOptionLabel = (option, index) =>
  option?.label || option?.textAr || option?.labelAr || `اختيار ${index + 1}`;

const ShadowPuzzleGame = ({
  game,
  config,
  onComplete,
  therapistControlsEnabled = false,
  therapistPromptLevel = 'none',
  previewMode = false,
  onAssistantInteraction,
}) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [startTime] = useState(Date.now());

  const content = config?.content || {};
  const instructionAr =
    content.instructionAr || game?.questionAr || game?.questionTextAr || 'انظر إلى الظل واختر الصورة المناسبة';
  const questionAudio = content.questionAudio || content.instructionAudio || game?.questionAudio || '';
  const options = useMemo(() => (Array.isArray(content.options) ? content.options : []), [content.options]);
  const correctOption = useMemo(
    () => options.find((option) => option?.isCorrect) || options[0] || null,
    [options]
  );
  const heroImage = content.hero?.image || game?.heroImage || '';
  const shadowImage = heroImage || correctOption?.image || '';
  const successSound = config?.feedback?.successSound || game?.successSound || '';
  const failSound = config?.feedback?.failSound || game?.failSound || '';

  const playInstruction = () => {
    if (questionAudio) {
      playAudioUrl(questionAudio);
      return;
    }

    speakArabic(instructionAr);
  };

  const handleRestart = () => {
    setSelectedOption(null);
    setFeedback('');
    setAttempts(0);
    setCompleted(false);
  };

  const handleSelect = (option) => {
    if (completed) return;

    onAssistantInteraction?.();
    const nextAttempts = attempts + 1;
    const isCorrect = Boolean(option?.isCorrect);

    setAttempts(nextAttempts);
    setSelectedOption(option);

    if (!isCorrect) {
      setFeedback('حاول مرة أخرى، ركز في شكل الظل.');
      if (failSound) playAudioUrl(failSound);
      return;
    }

    setCompleted(true);
    setFeedback('أحسنت! هذه هي الصورة المطابقة للظل.');
    if (successSound) playAudioUrl(successSound);

    if (!previewMode) {
      window.setTimeout(() => {
        const responseTime = Date.now() - startTime;
        onComplete?.({
          correctAnswers: 1,
          wrongAnswers: Math.max(nextAttempts - 1, 0),
          attempts: [nextAttempts],
          prompts: [therapistControlsEnabled ? therapistPromptLevel : 'none'],
          timeSpent: Math.floor(responseTime / 1000),
          responseTime,
          selectedAnswer: option?.id || '',
          isCorrect: true,
        });
      }, 900);
    }
  };

  const renderShadowBox = () => {
    if (!shadowImage) {
      return (
        <div className="flex h-full min-h-[220px] w-full items-center justify-center rounded-[2rem] border-2 border-dashed border-[#D9EAF2] bg-[#F8FBFD] text-5xl font-black text-slate-300">
          ؟
        </div>
      );
    }

    return (
      <img
        src={completed ? correctOption?.image || shadowImage : shadowImage}
        alt={completed ? getOptionLabel(correctOption, 0) : 'ظل الصورة'}
        className={`h-full max-h-[300px] w-full object-contain transition-all duration-500 ${
          completed ? 'opacity-100 drop-shadow-xl' : 'opacity-[0.85] mix-blend-multiply grayscale contrast-125'
        }`}
      />
    );
  };

  return (
    <div
      dir="rtl"
      className={`w-full bg-white ${previewMode ? 'rounded-[2rem] p-3' : 'min-h-[calc(100dvh-8rem)] px-3 py-4 sm:px-5 md:px-8'}`}
    >
      <div className={`mx-auto flex w-full flex-col gap-4 ${previewMode ? 'max-w-full' : 'max-w-6xl gap-5'}`}>
        <GameHeader instruction={instructionAr} onPlayAudio={playInstruction} onRestart={handleRestart} />

        <section className={`grid gap-4 ${previewMode ? 'grid-cols-1' : 'gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch'}`}>
          <div className={`rounded-[2rem] border border-[#D9EAF2] bg-white p-3 shadow-[0_18px_40px_rgba(15,111,166,0.08)] ${previewMode ? 'order-1' : 'order-1 p-4 lg:order-2'}`}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="rounded-full bg-[#EAF7FD] px-3 py-1.5 text-xs font-black text-[#0F6FA6] sm:px-4 sm:py-2 sm:text-sm">
                انظر إلى الظل
              </span>
              {completed && (
                <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 sm:px-4 sm:py-2 sm:text-sm">
                  <CheckCircle2 size={18} />
                  <span>إجابة صحيحة</span>
                </div>
              )}
            </div>

            <div className={`relative flex items-center justify-center rounded-[1.7rem] bg-[radial-gradient(circle_at_center,_#ffffff_0%,_#F8FBFD_70%,_#EAF7FD_100%)] ${previewMode ? 'min-h-[160px] p-3' : 'min-h-[240px] p-5'}`}>
              {completed && (
                <Star className="absolute left-4 top-4 h-8 w-8 fill-[#F2B84B] text-[#F2B84B] drop-shadow sm:left-5 sm:top-5 sm:h-10 sm:w-10" />
              )}
              {renderShadowBox()}
            </div>

            {feedback && (
              <div
                className={`mt-3 rounded-2xl px-3 py-2 text-center text-xs font-black sm:mt-4 sm:px-4 sm:py-3 sm:text-sm ${
                  completed
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border border-red-200 bg-red-50 text-red-600'
                }`}
              >
                {feedback}
              </div>
            )}
          </div>

          <div className={`rounded-[2rem] border border-[#D9EAF2] bg-[#F8FBFD] p-3 shadow-[0_18px_40px_rgba(15,111,166,0.06)] ${previewMode ? 'order-2' : 'order-2 p-4 lg:order-1'}`}>
            <div className="mb-3">
              <h2 className={`font-black text-[#073B5C] ${previewMode ? 'text-lg' : 'text-xl sm:text-2xl'}`}>اختر الصورة المطابقة</h2>
              <p className="mt-1 text-xs font-bold text-[#64748B] sm:text-sm">اضغط على الصورة التي تشبه الظل.</p>
            </div>

            <div className={`grid grid-cols-2 gap-2 ${previewMode ? '' : 'gap-3 sm:gap-4'}`}>
              {options.map((option, index) => {
                const isSelected = selectedOption?.id === option?.id;
                const isWrong = isSelected && !option?.isCorrect;
                const isCorrectSelected = isSelected && option?.isCorrect;

                return (
                  <button
                    key={option?.id || index}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`relative flex flex-col items-center justify-between rounded-[1.5rem] border bg-white p-2 shadow-sm transition-all hover:-translate-y-1 hover:shadow-[0_16px_30px_rgba(15,111,166,0.12)] focus:outline-none focus:ring-4 focus:ring-[#1584C3]/15 active:scale-[0.98] ${previewMode ? 'min-h-28 p-2' : 'min-h-40 p-3 sm:min-h-48'} ${
                      isCorrectSelected
                        ? 'border-emerald-300 bg-emerald-50'
                        : isWrong
                          ? 'border-red-300 bg-red-50'
                          : 'border-[#D9EAF2] hover:border-[#1584C3]'
                    }`}
                  >
                    {isCorrectSelected && (
                      <CheckCircle2 className="absolute right-2 top-2 h-6 w-6 rounded-full bg-emerald-500 p-1 text-white shadow sm:right-3 sm:top-3 sm:h-7 sm:w-7" />
                    )}
                    {isWrong && (
                      <XCircle className="absolute right-2 top-2 h-6 w-6 rounded-full bg-red-500 p-1 text-white shadow sm:right-3 sm:top-3 sm:h-7 sm:w-7" />
                    )}

                    <div className={`flex w-full items-center justify-center rounded-[1.15rem] bg-[#F8FBFD] p-1.5 ${previewMode ? 'h-20' : 'h-28 p-2 sm:h-32'}`}>
                      {option?.image ? (
                        <img
                          src={option.image}
                          alt={getOptionLabel(option, index)}
                          className="h-full w-full object-contain drop-shadow-sm"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-xl border-2 border-dashed border-[#D9EAF2] text-xs font-black text-slate-400 sm:text-sm">
                          صورة
                        </div>
                      )}
                    </div>

                    <span className={`mt-2 font-black text-[#073B5C] ${previewMode ? 'text-sm' : 'mt-3 text-base'}`}>{getOptionLabel(option, index)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ShadowPuzzleGame;
