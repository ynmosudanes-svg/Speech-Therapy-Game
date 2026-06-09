import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import Card from '../components/Card';
import FeedbackModal from '../components/FeedbackModal';
import { playSuccessSound, playErrorSound, playAudioUrl } from '../utils/soundEffects';

/**
 * Find the Similar Game (Visual Matching)
 * 
 * Config JSON example:
 * {
 *   "questionTextAr": "وريني الصورة الزي دي",
 *   "questionAudio": "/audio/find-similar.mp3",
 *   "targetImage": "/images/frog.png",
 *   "options": [
 *     { "id": 1, "image": "/images/frog.png", "isCorrect": true },
 *     { "id": 2, "image": "/images/bird.png", "isCorrect": false },
 *     { "id": 3, "image": "/images/fish.png", "isCorrect": false }
 *   ],
 *   "successSound": "/audio/yay.mp3",
 *   "failSound": "/audio/oops.mp3"
 * }
 */
const FindSimilarGame = ({
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
  const [shuffledOptions, setShuffledOptions] = useState([]);

  useEffect(() => {
    if (game?.options) {
      setShuffledOptions([...game.options].sort(() => Math.random() - 0.5));
    }
    if (game?.questionAudio) {
      playAudioUrl(game.questionAudio);
    }
  }, [game]);

  const handleSelect = (option) => {
    if (showFeedback) return;
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

  if (!game) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Target Image */}
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-5">
          {game.questionTextAr || 'وريني الصورة الزي دي'}
        </h2>
        <div className="inline-block p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[2rem] border-4 border-blue-200 shadow-lg">
          <img
            src={game.targetImage}
            alt="الصورة المطلوبة"
            className="w-44 h-44 md:w-56 md:h-56 object-contain rounded-[1.5rem] bg-white"
          />
        </div>
        <div className="mt-4 text-lg font-bold text-blue-600 animate-pulse">
          ⬇️ اختار الصورة الزي دي ⬇️
        </div>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {shuffledOptions.map((option) => (
          <Card
            key={option.id}
            onClick={() => handleSelect(option)}
            className={`p-3 md:p-4 cursor-pointer rounded-[2rem] border-4 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl active:scale-95 ${
              selectedOption?.id === option.id
                ? isCorrect
                  ? 'border-green-400 bg-green-50 shadow-green-100'
                  : 'border-red-400 bg-red-50 shadow-red-100'
                : 'border-transparent hover:border-blue-200'
            }`}
          >
            <img
              src={option.image}
              alt={`خيار ${option.id}`}
              className="w-full h-32 md:h-44 object-contain bg-white rounded-[1.4rem] pointer-events-none"
            />
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

export default FindSimilarGame;
