import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Volume2 } from 'lucide-react';
import FeedbackModal from '../components/FeedbackModal';
import {
  playAudioUrl,
  playSuccessSound,
  playErrorSound,
} from '../utils/soundEffects';

const speakArabic = (text) => {
  if (!text || typeof window === 'undefined') return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ar-SA';
  window.speechSynthesis.speak(utterance);
};

const MissingWordGame = ({
  game,
  config,
  onComplete,
  therapistControlsEnabled = false,
  therapistPromptLevel = 'none',
  previewMode = false,
  onAssistantInteraction,
  registerAssistantActions,
}) => {
  const content = config?.content || {};
  const feedbackConfig = config?.feedback || {};
  const instructionAr = content?.instructionAr || '';
  const questionAudio = content?.questionAudio || '';
  const image = content?.image || '';
  const wordWithBlank = content?.wordWithBlank || '';
  const options = content?.options || [];

  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null); // 'success' | 'error' | null
  const [showModal, setShowModal] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());
  const [shakingOptionId, setShakingOptionId] = useState(null);

  // Play audio when loaded
  useEffect(() => {
    if (questionAudio) {
      playAudioUrl(questionAudio);
    }
  }, [questionAudio]);

  // Assistant callbacks
  useEffect(() => {
    if (!registerAssistantActions) return;
    registerAssistantActions({
      onVisualHint: () => {
        const correct = options.find((o) => o.isCorrect);
        if (correct) {
          setShakingOptionId(correct.id);
          setTimeout(() => setShakingOptionId(null), 1500);
        }
      },
      onVerbalHint: () => {
        speakArabic(instructionAr || 'ابحث عن الحرف الناقص');
      },
    });
    return () => registerAssistantActions({});
  }, [registerAssistantActions, instructionAr, options]);

  const playInstruction = () => {
    if (questionAudio) {
      playAudioUrl(questionAudio);
    } else {
      speakArabic(instructionAr || 'أكمل الكلمة الناقصة');
    }
  };

  const handleOptionClick = (option) => {
    if (feedback === 'success') return;

    onAssistantInteraction?.();
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
      setTimeout(() => setShakingOptionId(null), 500);
    }
  };

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

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-4 md:gap-6" dir="rtl">
      {/* Header */}
      <section className="bg-white rounded-2xl md:rounded-[2rem] p-4 md:p-6 shadow-sm border border-[#dbe7f3] flex items-center justify-between gap-4">
        <div className="flex-grow">
          <h2 className="text-xl md:text-3xl font-black text-slate-900">
            {instructionAr || 'أكمل الكلمة الناقصة'}
          </h2>
        </div>
        <button
          onClick={playInstruction}
          className="w-12 h-12 md:w-14 md:h-14 shrink-0 bg-blue-600 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
        >
          <Volume2 className="text-white w-6 h-6" />
        </button>
      </section>

      {/* Main Play Area */}
      <section className="bg-[#f8fbff] rounded-2xl md:rounded-[2.4rem] border border-[#dbe7f3] p-6 md:p-10 shadow-sm flex flex-col items-center gap-8 md:gap-12 min-h-[50vh]">
        {/* Optional Image */}
        {image && (
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-3xl overflow-hidden shadow-md border-4 border-white">
            <img src={image} alt="word visual" className="w-full h-full object-cover" />
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
              className={`
                px-6 py-3 md:px-10 md:py-4 rounded-xl md:rounded-2xl shadow-md border-2 font-black text-xl md:text-3xl transition-all
                ${
                  shakingOptionId === option.id
                    ? 'animate-[shake_0.5s_ease-in-out] bg-red-100 border-red-500 text-red-600'
                    : feedback === 'success' && option.isCorrect
                    ? 'bg-emerald-500 border-emerald-600 text-white scale-110 shadow-emerald-500/50'
                    : feedback === 'success'
                    ? 'bg-white border-slate-200 text-slate-300 opacity-50 cursor-not-allowed'
                    : 'bg-white border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-400 hover:scale-105 active:scale-95'
                }
              `}
            >
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
