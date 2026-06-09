import React, { useEffect, useMemo, useState } from 'react';
import { Volume2 } from 'lucide-react';
import Card from '../components/Card';
import FeedbackModal from '../components/FeedbackModal';
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
}) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);
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
  const isDifferentMode = config?.gameType === 'matching.different';
  const isFindMode = config?.gameType === 'matching.find';
  const gridClassName = isDifferentMode
    ? 'grid-cols-2 max-w-2xl mx-auto'
    : isFindMode
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
        speakArabic(hint);
      },

      /* Level 4: Physical — full obvious highlight + speak answer */
      onPhysicalPrompt: () => {
        setPhysicalHighlight(true);
        window.setTimeout(() => setPhysicalHighlight(false), 4000);
        const correctOption = options.find((o) => o.isCorrect);
        const hint = correctOption?.textAr
          ? `الإجابة الصحيحة هي "${correctOption.textAr}"!`
          : 'بص على الصورة اللي بتلمع دي!';
        speakArabic(hint);
      },
    });

    return () => registerAssistantActions({});
  }, [instructionAr, questionAudio, options, registerAssistantActions]);

  const handleOptionSelect = (option) => {
    onAssistantInteraction?.();
    setAttempts((current) => current + 1);
    setSelectedOption(option);
    setIsCorrect(Boolean(option.isCorrect));
    setShowFeedback(true);

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
      return 'border-blue-200 ring-4 ring-blue-400 shadow-blue-200/50 scale-105';
    }
    if (physicalHighlight && option.isCorrect) {
      return 'border-emerald-200 ring-4 ring-emerald-400 shadow-emerald-200/50 scale-105';
    }
    if (gestureArrow && option.isCorrect) {
      return 'border-amber-200 ring-4 ring-amber-400 shadow-[0_0_40px_rgba(217,119,6,0.4)]';
    }
    if (visualPulse && option.isCorrect) {
      return 'border-yellow-200 ring-8 ring-yellow-400 animate-pulse shadow-[0_0_40px_rgba(250,204,21,0.5)]';
    }
    return 'border-slate-200 shadow-lg';
  };

  return (
    <div className="space-y-8 md:space-y-12 pb-4" dir="rtl">
      {/* ── منطقة الكلمة / السؤال (الصندوق العلوي) ── */}
      <div className="relative group w-full max-w-3xl mx-auto mt-6 md:mt-8">
        <button
          type="button"
          onClick={playInstruction}
          onKeyDown={preventKeyboardAudioTrigger}
          onKeyUp={preventKeyboardAudioTrigger}
          className="absolute -top-6 -right-4 md:-top-8 md:-right-6 z-10 w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-cyan-400 to-blue-500 text-white rounded-full flex items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.15)] border-4 border-white transition-transform hover:scale-110 active:scale-95"
        >
          <Volume2 className="w-8 h-8 md:w-10 md:h-10" />
        </button>

        <div className="bg-[#FEFBFB] backdrop-blur-sm rounded-[2.5rem] p-6 md:p-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] border-8 border-white relative flex flex-col items-center justify-center">
          <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-blue-400 to-transparent pointer-events-none rounded-[2rem]"></div>
          
          <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-wide mb-2 leading-tight text-center relative z-10">
            {instructionAr}
          </h2>

          {!isFindMode && (
            <div className="mt-6 w-full max-w-sm relative z-10">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt={game?.titleAr || game?.name || 'Hero'}
                  className="w-full h-40 md:h-56 object-contain rounded-[1.5rem] drop-shadow-md mix-blend-multiply"
                />
              ) : (
                <div className="w-full h-40 md:h-56 rounded-[1.5rem] bg-slate-100/60 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 font-black text-center px-4 leading-7">
                  الصورة الرئيسية
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── منطقة الخيارات (البطاقات ثلاثية الأبعاد) ── */}
      <div className={`grid gap-6 md:gap-8 w-full ${gridClassName}`}>
        {options.map((option, index) => (
          <button
            key={option.id || index}
            type="button"
            onClick={() => handleOptionSelect(option)}
            className={`
              relative overflow-visible bg-[#FEFBFB] rounded-3xl p-5 md:p-8 flex flex-col items-center justify-center
              border-[4px] transition-all duration-200 group
              hover:-translate-y-2 hover:shadow-2xl
              active:scale-95
              ${getOptionBorderClass(option)}
            `}
          >
            {/* Gesture arrow indicator */}
            {gestureArrow && option.isCorrect && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-amber-500 text-5xl animate-bounce z-20 drop-shadow-md">
                👇
              </div>
            )}

            <div className="w-full relative transition-transform duration-300 group-hover:scale-105">
              {option.image ? (
                <img
                  src={option.image}
                  alt={option.textAr || `option-${index + 1}`}
                  className="w-full h-32 md:h-48 object-contain drop-shadow-md mb-3 pointer-events-none mix-blend-multiply"
                />
              ) : (
                <div className="w-full h-32 md:h-48 bg-slate-50/80 rounded-[1.5rem] mb-3 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 font-black pointer-events-none text-center px-4 leading-7">
                  صورة الاختيار
                </div>
              )}
            </div>

            {!!option.textAr && (
              <h3 className="text-xl md:text-3xl font-black text-center text-slate-800 pointer-events-none mt-2 transition-colors group-hover:text-blue-600">
                {option.textAr}
              </h3>
            )}
          </button>
        ))}
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
