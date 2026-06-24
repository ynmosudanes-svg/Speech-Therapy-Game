import { useEffect, useState } from 'react';
import FeedbackModal from '../components/FeedbackModal';
import GameHeader from '../components/game/GameHeader';
import { GameContainer, GameSection } from '../components/game/GameUI';
import { playAudioUrl } from '../utils/soundEffects';
import ChildGameBackdrop from './ChildGameBackdrop';
import { CheckCircle2, XCircle } from 'lucide-react';

const TrueFalseGame = ({
  game,
  onComplete,
  therapistControlsEnabled = false,
  therapistPromptLevel = 'none',
  registerAssistantActions,
  previewMode = false,
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [startTime] = useState(() => Date.now());
  const [attempts, setAttempts] = useState(0);
  const [visualPulse, setVisualPulse] = useState(false);

  const avatarState = showFeedback ? (isCorrect ? 'celebration' : 'error') : 'learning';
  const content = game?.config?.content;

  useEffect(() => {
    if (content?.questionAudio) {
      playAudioUrl(content.questionAudio);
    }
  }, [content]);

  useEffect(() => {
    if (!registerAssistantActions) return undefined;
    registerAssistantActions({
      onVisualHint: () => {
        setVisualPulse(true);
      },
    });
    return () => registerAssistantActions({});
  }, [registerAssistantActions]);

  const handleSelect = (selectedAnswer) => {
    if (showFeedback) return;
    setAttempts((prev) => prev + 1);
    setIsCorrect(selectedAnswer === content?.correctAnswer);
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
  };

  const handleRestart = () => {
    setShowFeedback(false);
    setAttempts(0);
  };

  if (!content) return null;

  const images = (content.options || []).filter(opt => opt.image).map(opt => opt.image);

  return (
    <GameContainer
      className="max-w-4xl"
      dir="rtl"
      style={{ maxWidth: 'min(100%, clamp(18rem, 46vw, 34rem))' }}
    >
      <ChildGameBackdrop previewMode={previewMode} />
      <GameHeader
        instruction={content.instructionAr || 'استمع وحدد الإجابة الصحيحة'}
        avatarState={avatarState}
        onPlayAudio={() => {
          if (content?.questionAudio) playAudioUrl(content.questionAudio);
        }}
        onRestart={handleRestart}
      />

      <GameSection className="mx-auto w-full max-w-[clamp(250px,45vw,400px)]">
        {images.length > 0 ? (
          <div className={`grid gap-4 ${images.length >= 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {images.slice(0, 2).map((img, idx) => (
              <div key={idx} className="rounded-3xl overflow-hidden border-4 border-white/50 shadow-sm bg-white/40 backdrop-blur-sm aspect-square flex items-center justify-center p-2">
                 <img src={img} alt={`صورة ${idx + 1}`} className="w-full h-full object-contain rounded-2xl" />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border-4 border-dashed border-white/50 bg-white/20 aspect-video flex items-center justify-center p-4">
            <span className="text-white font-bold text-xl drop-shadow-md text-center">استمع جيداً ثم أجب</span>
          </div>
        )}
      </GameSection>

      <div className="mx-auto mt-6 max-w-sm grid grid-cols-2 gap-4 sm:gap-6 px-4">
        <button
          onClick={() => handleSelect(true)}
          className={`relative group flex flex-col items-center justify-center py-4 px-3 rounded-[1.5rem] border-b-[6px] transition-all focus:outline-none focus:ring-4 focus:ring-emerald-300
            ${visualPulse && content?.correctAnswer === true ? 'animate-pulse ring-4 ring-emerald-300' : ''}
            bg-emerald-500 border-emerald-700 hover:bg-emerald-400 hover:-translate-y-1 active:translate-y-1 active:border-b-0`}
        >
          <div className="bg-white/20 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
            <CheckCircle2 size={36} className="text-white drop-shadow-sm" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-white drop-shadow-md">صح</span>
        </button>

        <button
          onClick={() => handleSelect(false)}
          className={`relative group flex flex-col items-center justify-center py-4 px-3 rounded-[1.5rem] border-b-[6px] transition-all focus:outline-none focus:ring-4 focus:ring-red-300
            ${visualPulse && content?.correctAnswer === false ? 'animate-pulse ring-4 ring-red-300' : ''}
            bg-red-500 border-red-700 hover:bg-red-400 hover:-translate-y-1 active:translate-y-1 active:border-b-0`}
        >
          <div className="bg-white/20 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
            <XCircle size={36} className="text-white drop-shadow-sm" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-white drop-shadow-md">خطأ</span>
        </button>
      </div>

      <FeedbackModal
        show={showFeedback}
        isCorrect={isCorrect}
        onNext={handleNext}
        successSound={game?.config?.feedback?.successSound}
        failSound={game?.config?.feedback?.failSound}
      />
    </GameContainer>
  );
};

export default TrueFalseGame;
