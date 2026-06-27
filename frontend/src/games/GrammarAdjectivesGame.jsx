import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import FeedbackModal from '../components/FeedbackModal';
import GameHeader from '../components/game/GameHeader';
import { GameContainer, GameSection, GameImage, GameGrid, GameChoice } from '../components/game/GameUI';
import { playAudioUrl } from '../utils/soundEffects';
import ChildGameBackdrop from './ChildGameBackdrop';

const GrammarAdjectivesGame = ({
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
  // Game phases: 'adjective' → 'noun' → done
  const [phase, setPhase] = useState('adjective');
  const [selectedAdjective, setSelectedAdjective] = useState(null);
  const [selectedNoun, setSelectedNoun] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(() => Date.now());

  const instructionAr = config?.content?.instructionAr || 'اسحب الكلمة المناسبة لتكوين الجملة';
  const questionAudio = config?.content?.questionAudio || '';
  const heroImage = config?.content?.heroImage || '';
  const sentenceText = config?.content?.sentenceText || 'هذا [     ] [     ]';
  const successSound = config?.feedback?.successSound || '';
  const failSound = config?.feedback?.failSound || '';

  const adjectives = useMemo(
    () => (Array.isArray(config?.content?.adjectives) ? config.content.adjectives : []),
    [config],
  );
  const nouns = useMemo(
    () => (Array.isArray(config?.content?.nouns) ? config.content.nouns : []),
    [config],
  );

  // Parse sentence blanks
  const sentenceParts = sentenceText.split(/\[.*?\]/g);
  const hasValidBlanks = sentenceParts.length >= 3;

  const avatarState = showFeedback ? (isCorrect ? 'celebration' : 'error') : 'learning';

  useEffect(() => {
    if (questionAudio) playAudioUrl(questionAudio);
  }, [questionAudio]);

  const playInstruction = () => {
    if (questionAudio) playAudioUrl(questionAudio);
  };

  const currentOptions = phase === 'adjective' ? adjectives : nouns;

  const handleOptionSelect = (option) => {
    onAssistantInteraction?.();
    setAttempts((c) => c + 1);

    if (phase === 'adjective') {
      setSelectedAdjective(option);
      setIsCorrect(Boolean(option.isCorrect));
      setShowFeedback(true);
    } else if (phase === 'noun') {
      setSelectedNoun(option);
      setIsCorrect(Boolean(option.isCorrect));
      setShowFeedback(true);
    }
  };

  const handleNext = () => {
    setShowFeedback(false);

    if (!isCorrect) {
      // Wrong answer - reset selection for current phase
      if (phase === 'adjective') setSelectedAdjective(null);
      else setSelectedNoun(null);
      return;
    }

    if (phase === 'adjective') {
      // Move to noun phase
      setPhase('noun');
      return;
    }

    // Both phases complete - game done!
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.62 } });

    if (previewMode) return;

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    onComplete({
      correctAnswers: 1,
      wrongAnswers: Math.max(attempts - 2, 0),
      attempts: [attempts],
      prompts: [therapistControlsEnabled ? therapistPromptLevel : 'none'],
      timeSpent,
    });
  };

  const handleRestart = () => {
    setPhase('adjective');
    setSelectedAdjective(null);
    setSelectedNoun(null);
    setShowFeedback(false);
    setIsCorrect(false);
    setAttempts(0);
  };

  return (
    <GameContainer
      className="max-w-4xl"
      dir="rtl"
      style={{ maxWidth: 'min(100%, clamp(20rem, 52vw, 46rem))' }}
    >
      <ChildGameBackdrop previewMode={previewMode} />

      <GameHeader
        instruction={phase === 'adjective' ? 'اختر الصفة المناسبة' : 'اختر الاسم المناسب'}
        avatarState={avatarState}
        onPlayAudio={playInstruction}
        onRestart={handleRestart}
      />

      {/* Hero Image */}
      {heroImage && (
        <GameSection className="mx-auto max-w-[clamp(180px,24vw,240px)]">
          <GameImage
            src={heroImage}
            alt="الصورة الرئيسية"
            fit="contain"
            emptyLabel="الصورة الرئيسية"
          />
        </GameSection>
      )}

      {/* Sentence with blanks */}
      <GameSection className="mx-auto w-full">
        <div className="flex flex-wrap items-center justify-center gap-2 text-lg font-bold text-slate-700 md:text-xl" dir="rtl">
          {hasValidBlanks ? (
            <>
              {sentenceParts[0] && <span>{sentenceParts[0]}</span>}

              {/* Blank 1 - Adjective */}
              <div className={`inline-flex min-w-[70px] items-center justify-center rounded-xl border-[3px] border-dashed px-3 py-1.5 text-base transition-all md:min-w-[90px] md:text-lg ${
                selectedAdjective
                  ? 'border-solid border-blue-400 bg-blue-50'
                  : 'border-blue-300 bg-white'
              }`}>
                {selectedAdjective ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-blue-700 font-black"
                  >
                    {selectedAdjective.textAr}
                  </motion.span>
                ) : (
                  <span className="text-blue-300">___</span>
                )}
              </div>

              {sentenceParts[1] && <span>{sentenceParts[1]}</span>}

              {/* Blank 2 - Noun */}
              <div className={`inline-flex min-w-[70px] items-center justify-center rounded-xl border-[3px] border-dashed px-3 py-1.5 text-base transition-all md:min-w-[90px] md:text-lg ${
                selectedNoun
                  ? 'border-solid border-emerald-400 bg-emerald-50'
                  : 'border-emerald-300 bg-white'
              }`}>
                {selectedNoun ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-emerald-700 font-black"
                  >
                    {selectedNoun.textAr}
                  </motion.span>
                ) : (
                  <span className="text-emerald-300">___</span>
                )}
              </div>

              {sentenceParts[2] && <span>{sentenceParts[2]}</span>}
            </>
          ) : (
            <span>{sentenceText}</span>
          )}
        </div>
      </GameSection>

      {/* Options Grid */}
      <GameGrid className="mx-auto w-full max-w-3xl justify-items-center">
        {currentOptions.map((option, index) => {
          const alreadySelected =
            (phase === 'adjective' && selectedAdjective?.id === option.id) ||
            (phase === 'noun' && selectedNoun?.id === option.id);

          return (
            <GameChoice
              key={option.id || index}
              onClick={() => handleOptionSelect(option)}
              state={alreadySelected ? (isCorrect ? 'correct' : 'wrong') : 'idle'}
              className="relative w-full max-w-[220px] min-h-[clamp(100px, 14vw, 150px)] lg:max-w-[210px]"
            >
              {option.image && (
                <GameImage
                  src={option.image}
                  alt={option.textAr || `option-${index + 1}`}
                  className="flex-1"
                  fit="contain"
                  emptyLabel=""
                />
              )}
              {!!option.textAr && (
                <div className="mt-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 md:text-sm">
                  {option.textAr}
                </div>
              )}
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
};

export default GrammarAdjectivesGame;
