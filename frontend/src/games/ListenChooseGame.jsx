import React, { useEffect, useState } from 'react';
import FeedbackModal from '../components/FeedbackModal';
import GameHeader from '../components/game/GameHeader';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import {
  GameChoice,
  GameContainer,
  GameGrid,
  GameImage,
} from '../components/game/GameUI';
import { playAudioUrl } from '../utils/soundEffects';
import ChildGameBackdrop from './ChildGameBackdrop';

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
  const { speak } = useSpeechSynthesis();

  const avatarState = showFeedback ? (isCorrect ? 'celebration' : 'error') : 'learning';

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

  const handleRestart = () => {
    setSelectedOption(null);
    setShowFeedback(false);
    setAttempts(0);
  };

  return (
    <GameContainer className="max-w-3xl" dir="rtl">
      <ChildGameBackdrop />
      <GameHeader
        instruction={game.questionTextAr}
        avatarState={avatarState}
        onPlayAudio={() => {
          if (game.questionAudio) {
            playAudioUrl(game.questionAudio);
          } else if (game.questionTextAr) {
            speak(game.questionTextAr);
          }
        }}
        onRestart={handleRestart}
      />

      <GameGrid className="mx-auto w-full max-w-3xl" minWidth="clamp(150px, 42vw, 180px)">
        {game.options.map((option) => (
          <GameChoice
            key={option.id}
            onClick={() => handleOptionSelect(option)}
            state={
              selectedOption?.id === option.id
                ? isCorrect
                  ? 'correct'
                  : 'wrong'
                : 'idle'
            }
            className="min-h-[clamp(170px,42vw,208px)]"
          >
            <GameImage src={option.image} alt={option.textAr} className="flex-1" emptyLabel="صورة الاختيار" />
            <h3 className="mt-2 text-center text-lg font-black text-slate-900 md:text-2xl">
              {option.textAr}
            </h3>
          </GameChoice>
        ))}
      </GameGrid>

      <FeedbackModal
        show={showFeedback}
        isCorrect={isCorrect}
        onNext={handleNext}
        successSound={game.successSound}
        failSound={game.failSound}
      />
    </GameContainer>
  );
};

export default ListenChooseGame;
