import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Volume2 } from 'lucide-react';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import FeedbackModal from '../components/FeedbackModal';
import GameHeader from '../components/game/GameHeader';
import {
  playAudioUrl,
  playSuccessSound,
  playErrorSound,
} from '../utils/soundEffects';

// Hardcoded speakArabic removed, using useSpeechSynthesis hook instead

const MissingWordGame = ({
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
  const feedbackConfig = config?.feedback || {};
  const instructionAr = content?.instructionAr || '';
  const questionAudio = content?.questionAudio || '';
  const image = content?.image || '';
  const wordWithBlank = content?.wordWithBlank || '';
  const options = content?.options || [];

  const { speak } = useSpeechSynthesis();

  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null); // 'success' | 'error' | null
  const [showModal, setShowModal] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());
  const [shakingOptionId, setShakingOptionId] = useState(null);

  /* ── Hint states ── */
  const [visualPulse, setVisualPulse] = useState(false);
  const [gestureArrow, setGestureArrow] = useState(false);
  const [physicalHighlight, setPhysicalHighlight] = useState(false);

  const correctOption = options.find((o) => o.isCorrect);

  const clearHints = () => {
    setVisualPulse(false);
    setGestureArrow(false);
    setPhysicalHighlight(false);
  };

  // Play audio when loaded
  useEffect(() => {
    if (!previewMode && questionAudio) {
      playAudioUrl(questionAudio);
    }
  }, [questionAudio, previewMode]);

  const playInstruction = () => {
    if (questionAudio) {
      playAudioUrl(questionAudio);
    } else {
      speak(instructionAr || 'أكمل الكلمة الناقصة');
    }
  };

  const handleOptionClick = (option) => {
    if (feedback === 'success') return;

    onAssistantInteraction?.();
    clearHints();
    const currentAttempts = attempts + 1;
    setAttempts(currentAttempts);

    if (option.isCorrect) {
      setFeedback('success');
      setSelectedOption(option);
      setShowModal(true);
    } else {
      setFeedback('error');
      setShowModal(true);
      setShakingOptionId(option.id);
      window.setTimeout(() => setShakingOptionId(null), 500);
    }
  };

  const handleOptionClickRef = useRef(handleOptionClick);
  handleOptionClickRef.current = handleOptionClick;

  /* ── Register 4 assistant callbacks ── */
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
        const hint = correctOption?.textAr
          ? `الحرف الناقص يبدأ بـ "${correctOption.textAr.charAt(0)}"… فكّر في الكلمة كاملة!`
          : instructionAr || 'ابحث عن الحرف الناقص';
        if (helpVoiceEnabled) speak(hint);
      },
      onPhysicalPrompt: () => {
        if (!correctOption) return;
        setPhysicalHighlight(true);
        if (helpVoiceEnabled) {
          speak(
            correctOption.textAr
              ? `الإجابة الصحيحة هي "${correctOption.textAr}"!`
              : 'بص على الحرف اللي بيلمع!'
          );
        }
        window.setTimeout(() => {
          setPhysicalHighlight(false);
          handleOptionClickRef.current?.(correctOption);
        }, 1500);
      },
    });

    return () => registerAssistantActions({});
  }, [helpVoiceEnabled, registerAssistantActions, instructionAr, correctOption, speak]);

  const handleModalNext = () => {
    setShowModal(false);

    if (feedback === 'error') {
      setFeedback(null);
      return;
    }

    if (previewMode) {
      setFeedback(null);
      setSelectedOption(null);
      setAttempts(0);
    } else {
      const responseTime = Date.now() - startTime;
      onComplete({
        correctAnswers: 1,
        wrongAnswers: Math.max(attempts - 1, 0),
        attempts: [attempts],
        prompts: [therapistControlsEnabled ? therapistPromptLevel : 'none'],
        timeSpent: Math.floor(responseTime / 1000),
        responseTime,
        isCorrect: true,
      });
    }
  };

  const getOptionClass = (option) => {
    if (shakingOptionId === option.id) {
      return 'animate-[shake_0.5s_ease-in-out] bg-red-100 border-red-500 text-red-600';
    }
    if (feedback === 'success' && option.isCorrect) {
      return 'bg-emerald-500 border-emerald-600 text-white scale-110 shadow-emerald-500/50';
    }
    if (feedback === 'success') {
      return 'bg-white border-slate-200 text-slate-300 opacity-50 cursor-not-allowed';
    }
    if (physicalHighlight && option.isCorrect) {
      return 'bg-emerald-50 border-emerald-400 text-emerald-700 ring-4 ring-emerald-400 shadow-emerald-200/50 scale-110';
    }
    if (gestureArrow && option.isCorrect) {
      return 'bg-amber-50 border-amber-400 text-amber-700 ring-4 ring-amber-400 shadow-[0_0_40px_rgba(217,119,6,0.4)]';
    }
    if (visualPulse && option.isCorrect) {
      return 'bg-yellow-50 border-yellow-400 text-yellow-700 ring-8 ring-yellow-400 animate-pulse shadow-[0_0_40px_rgba(250,204,21,0.5)]';
    }
    return 'bg-white border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-400 hover:scale-105 active:scale-95';
  };

  const renderWord = () => {
    if (!wordWithBlank) return null;
    const parts = wordWithBlank.split('_');

    return (
      <div className="flex flex-wrap items-center justify-center gap-y-4 md:gap-y-6 text-3xl md:text-5xl font-black text-slate-800 dir-rtl tracking-wide leading-relaxed text-center" dir="rtl">
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            <span>{part}</span>
            {index < parts.length - 1 && (
              <span
                className={`mx-2 pb-1 border-b-4 md:border-b-8 px-4 transition-colors duration-300 ${
                  feedback === 'success'
                    ? 'border-emerald-500 text-emerald-500 scale-110'
                    : 'border-slate-300 text-transparent min-w-[3rem] md:min-w-[4rem]'
                }`}
              >
                {feedback === 'success' ? selectedOption?.textAr : '\u00A0'}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const handleRestart = () => {
    setSelectedOption(null);
    setFeedback(null);
    setShowModal(false);
    setAttempts(0);
    setShakingOptionId(null);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-4 md:gap-6" dir="rtl">
      <GameHeader 
        instruction={instructionAr || 'أكمل الكلمة الناقصة'} 
        onPlayAudio={playInstruction} 
        onRestart={handleRestart}
      />

      {/* Main Play Area */}
      <section className="bg-[#f8fbff] rounded-2xl md:rounded-[2.4rem] border border-[#dbe7f3] p-6 md:p-10 shadow-sm flex flex-col items-center gap-8 md:gap-12 min-h-[50vh]">
        {/* Optional Image */}
        {image && (
        <div className="w-48 h-48 md:w-64 md:h-64 rounded-3xl overflow-hidden shadow-md border-4 border-white bg-white">
            <img src={image} alt="word visual" className="w-full h-full object-contain" />
        </div>
        )}

        {/* Word Display */}
        <div className="py-8">
          {renderWord()}
        </div>

        {/* Options Grid */}
        <div className="flex flex-wrap justify-center gap-4 w-full max-w-2xl">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option)}
              className={`relative px-6 py-3 md:px-10 md:py-4 rounded-xl md:rounded-2xl shadow-md border-2 font-black text-xl md:text-3xl transition-all ${getOptionClass(option)}`}
            >
              {gestureArrow && option.isCorrect && (
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 text-4xl animate-bounce z-20 drop-shadow-md pointer-events-none">
                  👇
                </span>
              )}
              {option.textAr || option.text}
            </button>
          ))}
        </div>
      </section>

      <FeedbackModal
        show={showModal}
        isCorrect={feedback === 'success'}
        onNext={handleModalNext}
        successSound={feedbackConfig.successSound}
        failSound={feedbackConfig.failSound}
      />
    </div>
  );
};

export default MissingWordGame;
