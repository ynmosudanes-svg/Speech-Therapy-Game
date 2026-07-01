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

      <div className="mx-auto mt-6 grid w-full max-w-[18rem] grid-cols-2 gap-5 px-4 sm:max-w-xs sm:gap-6">
        <button
          type="button"
          onClick={() => handleSelect(true)}
          className={`group relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-full border-[3px] border-white/80 bg-[linear-gradient(145deg,#20B7B5,#0B7FBD)] p-3 text-white shadow-[0_18px_34px_rgba(32,183,181,0.26)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_42px_rgba(11,127,189,0.34)] active:translate-y-0 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#20B7B5]/30
            ${visualPulse && content?.correctAnswer === true ? 'animate-pulse ring-4 ring-[#20B7B5]/35' : ''}`}
        >
          <span className="pointer-events-none absolute inset-2 rounded-full border border-white/24 bg-white/10" />
          <div className="relative mb-2 rounded-full bg-white/24 p-2.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22)] transition-transform group-hover:scale-110">
            <CheckCircle2 size={34} className="drop-shadow-sm" />
          </div>
          <span className="relative text-xl font-black leading-none drop-shadow-md sm:text-2xl">صح</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelect(false)}
          className={`group relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-full border-[3px] border-white/80 bg-[linear-gradient(145deg,#0B7FBD,#20B7B5)] p-3 text-white shadow-[0_18px_34px_rgba(11,127,189,0.26)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_42px_rgba(32,183,181,0.32)] active:translate-y-0 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#0B7FBD]/28
            ${visualPulse && content?.correctAnswer === false ? 'animate-pulse ring-4 ring-[#0B7FBD]/35' : ''}`}
        >
          <span className="pointer-events-none absolute inset-2 rounded-full border border-white/24 bg-white/10" />
          <div className="relative mb-2 rounded-full bg-white/24 p-2.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22)] transition-transform group-hover:scale-110">
            <XCircle size={34} className="drop-shadow-sm" />
          </div>
          <span className="relative text-xl font-black leading-none drop-shadow-md sm:text-2xl">خطأ</span>
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
