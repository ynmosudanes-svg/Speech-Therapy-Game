import React, { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import FeedbackModal from '../components/FeedbackModal';
import GameHeader from '../components/game/GameHeader';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import { GameChoice, GameContainer, GameGrid } from '../components/game/GameUI';
import { playAudioUrl } from '../utils/soundEffects';
import ChildGameBackdrop from './ChildGameBackdrop';

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
const getEmoji = (option) => option?.emoji || option?.textAr || option?.labelAr || '🙂';
const getOptionLabel = (option) => option?.textAr || option?.labelAr || option?.label || '';
const getQuestionLabel = (option) => {
  const label = option?.questionLabelAr || getOptionLabel(option);
  if (!label) return 'المطلوب';
  return label.startsWith('ال') ? label : `ال${label}`;
};
const getRandomOption = (items) => items[Math.floor(Math.random() * items.length)] || null;

export default function EmotionFacesGame({
  game,
  config,
  onComplete,
  previewMode = false,
  therapistControlsEnabled = false,
  therapistPromptLevel = 'none',
}) {
  const options = useMemo(() => {
    if (Array.isArray(game?.options) && game.options.length > 0) return game.options;
    if (Array.isArray(config?.options) && config.options.length > 0) return config.options;
    if (Array.isArray(config?.content?.options)) return config.content.options;
    return [];
  }, [game?.options, config]);
  const defaultTarget = useMemo(() => options.find((option) => option?.isCorrect) || options[0] || null, [options]);
  const [targetOption, setTargetOption] = useState(defaultTarget);
  const [shuffleKey, setShuffleKey] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());
  const { speak } = useSpeechSynthesis();

  const activeTarget = targetOption || defaultTarget;
  const instructionAr = activeTarget
    ? `أين الوجه ${getQuestionLabel(activeTarget)}؟`
    : config?.content?.instructionAr || game?.questionTextAr || 'أين الوجه السعيد؟';
  const questionAudio = activeTarget ? '' : config?.content?.questionAudio || game?.questionAudio || '';
  const shuffledOptions = useMemo(() => shuffle(options), [game?.id, options, shuffleKey]);
  const successSound = config?.feedback?.successSound || game?.successSound || '';
  const failSound = config?.feedback?.failSound || game?.failSound || '';
  const avatarState = showFeedback ? (isCorrect ? 'celebration' : 'error') : 'learning';

  useEffect(() => {
    setTargetOption(getRandomOption(options));
    setShuffleKey((current) => current + 1);
    setSelectedOption(null);
    setShowFeedback(false);
    setIsCorrect(false);
  }, [game?.id, options]);

  useEffect(() => {
    if (questionAudio) playAudioUrl(questionAudio);
  }, [questionAudio]);

  const playInstruction = () => {
    if (questionAudio) {
      playAudioUrl(questionAudio);
      return;
    }
    speak(instructionAr);
  };

  const handleSelect = (option) => {
    if (showFeedback) return;
    const selectedIsCorrect = Boolean(activeTarget && option?.id === activeTarget.id);
    setAttempts((current) => current + 1);
    setSelectedOption(option);
    setIsCorrect(selectedIsCorrect);
    setShowFeedback(true);
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
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.62 } });

    onComplete?.({
      correctAnswers: 1,
      wrongAnswers: Math.max(totalAttempts - 1, 0),
      attempts: [totalAttempts],
      prompts: [therapistControlsEnabled ? therapistPromptLevel : 'none'],
      timeSpent,
      selectedAnswer: selectedOption?.id || '',
      targetAnswer: activeTarget?.id || '',
      isCorrect: true,
    });
  };

  const handleRestart = () => {
    setTargetOption(getRandomOption(options));
    setShuffleKey((current) => current + 1);
    setSelectedOption(null);
    setShowFeedback(false);
    setIsCorrect(false);
    setAttempts(0);
  };

  if (!game) return null;

  return (
    <GameContainer className="max-w-4xl" dir="rtl" style={{ maxWidth: 'min(100%, clamp(20rem, 54vw, 42rem))' }}>
      <ChildGameBackdrop previewMode={previewMode} />

      <GameHeader
        instruction={instructionAr}
        instructionAudio={questionAudio}
        avatarState={avatarState}
        onPlayAudio={playInstruction}
        onRestart={handleRestart}
      />

      <GameGrid className="mx-auto w-full max-w-4xl" minWidth="140px">
        {shuffledOptions.map((option, index) => {
          const isActive = selectedOption?.id === option.id;
          const state = isActive ? (isCorrect ? 'correct' : 'wrong') : 'idle';
          const label = getOptionLabel(option);

          return (
            <GameChoice
              key={option.id || index}
              onClick={() => handleSelect(option)}
              state={state}
              className="min-h-[140px]"
            >
              <div className="flex w-full flex-col items-center justify-center gap-3 py-2">
                <div className="flex h-[4.5rem] w-[4.5rem] md:h-[5.5rem] md:w-[5.5rem] items-center justify-center rounded-full bg-sky-50 text-[3rem] md:text-[4rem] leading-none shadow-[inset_0_0_0_1px_rgba(186,230,253,0.75)] overflow-hidden shrink-0">
                  {option.image ? (
                    <img src={option.image} alt={label || 'صورة'} className="h-full w-full object-cover" />
                  ) : (
                    <span aria-hidden="true">{getEmoji(option)}</span>
                  )}
                </div>
                {label ? (
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-700 md:text-base">
                    {label}
                  </div>
                ) : null}
              </div>
            </GameChoice>
          );
        })}
      </GameGrid>

      <FeedbackModal
        show={showFeedback}
        isCorrect={isCorrect}
        onNext={handleNext}
        successSound={successSound}
        failSound={failSound}
      />
    </GameContainer>
  );
}
