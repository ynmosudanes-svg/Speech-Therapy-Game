import React, { useEffect, useState } from 'react';
import { Volume2 } from 'lucide-react';
import Card from '../components/Card';
import FeedbackModal from '../components/FeedbackModal';
import { playAudioUrl } from '../utils/soundEffects';

const preventKeyboardAudioTrigger = (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    event.stopPropagation();
  }
};

const ListenChooseGame = ({
  game,
  onComplete,
  therapistControlsEnabled = false,
  therapistPromptLevel = 'none',
}) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [startTime] = useState(Date.now());
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (game.questionAudio) {
      playAudioUrl(game.questionAudio);
    }
  }, [game]);

  const handleOptionSelect = (option) => {
    setAttempts((prev) => prev + 1);
    setSelectedOption(option);
    setIsCorrect(option.isCorrect);
    setShowFeedback(true);
  };

  const handleNext = () => {
    setShowFeedback(false);

    if (isCorrect) {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      onComplete({
        correctAnswers: 1,
        wrongAnswers: attempts - 1,
        attempts: [attempts],
        prompts: [therapistControlsEnabled ? therapistPromptLevel : 'none'],
        timeSpent,
      });
      return;
    }

    setSelectedOption(null);
  };

  return (
    <div className="flex flex-col items-center">
      <Card className="w-full mb-4 md:mb-5 p-4 md:p-6 text-center bg-[#f7fbff] border-[#dbe7f3] rounded-[1.4rem] md:rounded-[2rem]">
        <button
          type="button"
          onClick={() => {
            if (game.questionAudio) {
              playAudioUrl(game.questionAudio);
            } else if (game.questionTextAr) {
              const utterance = new SpeechSynthesisUtterance(game.questionTextAr);
              utterance.lang = 'ar-SA';
              window.speechSynthesis.speak(utterance);
            }
          }}
          onKeyDown={preventKeyboardAudioTrigger}
          onKeyUp={preventKeyboardAudioTrigger}
          className="w-16 h-16 md:w-20 md:h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 hover:scale-105 transition-transform shadow-lg shadow-blue-200"
        >
          <Volume2 size={32} className="text-white" />
        </button>
        <h2 className="text-xl md:text-3xl font-black text-slate-900 leading-relaxed">
          {game.questionTextAr}
        </h2>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:gap-5 w-full max-w-3xl">
        {game.options.map((option) => (
          <Card
            key={option.id}
            onClick={() => handleOptionSelect(option)}
            className={`p-3 md:p-5 cursor-pointer rounded-[1.2rem] md:rounded-[2rem] border-2 md:border-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
              selectedOption?.id === option.id ? 'border-blue-300' : 'border-transparent'
            }`}
          >
            <img
              src={option.image}
              alt={option.textAr}
              className="w-full h-32 md:h-52 object-contain bg-white rounded-[1rem] md:rounded-[1.5rem] mb-2 md:mb-3 pointer-events-none"
            />
            <h3 className="text-xl md:text-3xl font-black text-center text-slate-900 pointer-events-none">
              {option.textAr}
            </h3>
          </Card>
        ))}
      </div>

      <FeedbackModal
        show={showFeedback}
        isCorrect={isCorrect}
        onNext={handleNext}
        successSound={game.successSound}
        failSound={game.failSound}
      />
    </div>
  );
};

export default ListenChooseGame;
