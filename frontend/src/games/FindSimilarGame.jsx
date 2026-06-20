import React, { useEffect, useState } from 'react';
import FeedbackModal from '../components/FeedbackModal';
import GameHeader from '../components/game/GameHeader';
import {
  GameChoice,
  GameContainer,
  GameGrid,
  GameImage,
  GameSection,
  GameQuestion,
} from '../components/game/GameUI';
import { playAudioUrl } from '../utils/soundEffects';
import ChildGameBackdrop from './ChildGameBackdrop';

const FindSimilarGame = ({
  game,
  onComplete,
  therapistControlsEnabled = false,
  therapistPromptLevel = 'none',
  registerAssistantActions,
}) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [startTime] = useState(Date.now());
  const [attempts, setAttempts] = useState(0);
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const [visualPulse, setVisualPulse] = useState(false);

  const avatarState = showFeedback ? (isCorrect ? 'celebration' : 'error') : 'learning';

  useEffect(() => {
    if (game?.options) {
      setShuffledOptions([...game.options].sort(() => Math.random() - 0.5));
    }
    if (game?.questionAudio) {
      playAudioUrl(game.questionAudio);
    }
  }, [game]);

  useEffect(() => {
    if (!registerAssistantActions) return undefined;

    registerAssistantActions({
      onVisualHint: () => {
        setVisualPulse(true);
      },
    });

    return () => registerAssistantActions({});
  }, [registerAssistantActions]);

  const handleSelect = (option) => {
    if (showFeedback) return;
    setAttempts((prev) => prev + 1);
    setSelectedOption(option);
    setIsCorrect(Boolean(option.isCorrect));
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
    <GameContainer
      className="max-w-4xl"
      dir="rtl"
      style={{ maxWidth: 'min(100%, clamp(18rem, 46vw, 34rem))' }}
    >
      <ChildGameBackdrop />
      <GameHeader
        instruction={game.questionTextAr || 'ورّيني الصورة اللي زي دي'}
        avatarState={avatarState}
        onPlayAudio={() => {
          if (game?.questionAudio) playAudioUrl(game.questionAudio);
        }}
        onRestart={handleRestart}
      />

      <GameSection className="mx-auto w-full max-w-[clamp(200px,38vw,280px)]">
        <GameQuestion className="mb-2 text-sky-700">اختر الصورة المطابقة</GameQuestion>
        <GameImage
          src={game.targetImage}
          alt="الصورة المطلوبة"
          className="mx-auto"
          emptyLabel="الصورة المطلوبة"
        />
      </GameSection>

      <GameGrid className="mx-auto mt-8 max-w-xl" minWidth="clamp(104px, 18vw, 156px)">
        {shuffledOptions.map((option) => {
          const isActive = selectedOption?.id === option.id;
          const isHintedCorrect = visualPulse && option.isCorrect;
          const choiceState = isActive ? (isCorrect ? 'correct' : 'wrong') : isHintedCorrect ? 'hint' : 'idle';

          return (
            <GameChoice
              key={option.id}
              onClick={() => handleSelect(option)}
              state={choiceState}
              className="min-h-[clamp(104px,26vw,144px)] sm:min-h-[clamp(114px,20vw,150px)] lg:min-h-[clamp(108px,14vw,132px)]"
            >
              <GameImage
                src={option.image}
                alt={`خيار ${option.id}`}
                className="flex-1"
                emptyLabel="صورة الاختيار"
              />
            </GameChoice>
          );
        })}
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

export default FindSimilarGame;
