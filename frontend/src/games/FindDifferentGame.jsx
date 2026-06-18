import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import FeedbackModal from '../components/FeedbackModal';
import GameImage from '../components/game/GameImage';
import GameHeader from '../components/game/GameHeader';
import { playAudioUrl } from '../utils/soundEffects';

/**
 * Find the Different Game
 * 
 * Config JSON example:
 * {
 *   "questionTextAr": "وريني الصورة المختلفة",
 *   "questionAudio": "/audio/find-different.mp3",
 *   "options": [
 *     { "id": 1, "image": "/images/apple.png", "isDifferent": false },
 *     { "id": 2, "image": "/images/apple.png", "isDifferent": false },
 *     { "id": 3, "image": "/images/apple.png", "isDifferent": false },
 *     { "id": 4, "image": "/images/banana.png", "isDifferent": true }
 *   ],
 *   "successSound": "/audio/yay.mp3",
 *   "failSound": "/audio/oops.mp3"
 * }
 */
const FindDifferentGame = ({
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
    const correct = option.isDifferent === true || option.isCorrect === true;
    setIsCorrect(correct);
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

  const handleRestart = () => {
    setSelectedOption(null);
    setShowFeedback(false);
    setAttempts(0);
  };

  if (!game) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <GameHeader
        instruction={game.questionTextAr || 'وريني الصورة المختلفة'}
        onPlayAudio={() => {
          if (game?.questionAudio) playAudioUrl(game.questionAudio);
        }}
        onRestart={handleRestart}
      />

      <div className="grid grid-cols-2 gap-4 md:gap-6 max-w-2xl mx-auto">
        {shuffledOptions.map((option) => {
          const isDiff = option.isDifferent || option.isCorrect;
          return (
            <Card
              key={option.id}
              onClick={() => handleSelect(option)}
              className={`p-3 md:p-4 cursor-pointer rounded-[2rem] border-4 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl active:scale-95 ${
                selectedOption?.id === option.id
                  ? isCorrect
                    ? 'border-green-400 bg-green-50'
                    : 'border-red-400 bg-red-50'
                  : 'border-transparent hover:border-amber-200'
              }`}
            >
              <div className="relative">
                <GameImage
                  src={option.image}
                  alt={`خيار ${option.id}`}
                  className="w-full h-32 md:h-44 object-contain bg-white rounded-[1.4rem] pointer-events-none"
                />
                {selectedOption?.id === option.id && isCorrect && isDiff && (
                  <div className="absolute inset-0 bg-green-400/20 rounded-[1.4rem] flex items-center justify-center">
                    <span className="text-5xl">⭐</span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
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

export default FindDifferentGame;
