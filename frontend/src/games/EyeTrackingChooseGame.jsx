import React, { useState, useEffect, useRef } from 'react';
import FeedbackModal from '../components/FeedbackModal';
import GameHeader from '../components/game/GameHeader';
import { GameContainer, GameSection } from '../components/game/GameUI';
import { playAudioUrl } from '../utils/soundEffects';
import ChildGameBackdrop from './ChildGameBackdrop';
import { useWebGazer } from '../hooks/useWebGazer';
import GazeCalibration from './components/GazeCalibration';
import GazeCursor from './components/GazeCursor';

const DWELL_TIME_MS = 2000; // 2 seconds to select

const EyeTrackingChooseGame = ({
  game,
  onComplete,
  previewMode = false,
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [startTime] = useState(() => Date.now());
  const [attempts, setAttempts] = useState(0);
  
  const [isCalibrated, setIsCalibrated] = useState(previewMode); // Skip calibration in preview mode
  const [dwellProgress, setDwellProgress] = useState({ index: null, progress: 0 });
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const optionsRef = useRef([]);
  const dwellTimerRef = useRef(null);
  const hoverStartTimeRef = useRef(0);

  const { isReady, isTracking, gazeData, startTracking, stopTracking } = useWebGazer();

  const content = game?.config?.content;
  const options = content?.options || [];

  useEffect(() => {
    if (content?.questionAudio) {
      playAudioUrl(content.questionAudio);
    }
  }, [content]);

  // Start webgazer when calibrated
  useEffect(() => {
    if (isCalibrated && !isTracking && !previewMode) {
      startTracking(false); // hide video during gameplay
    }
  }, [isCalibrated, isTracking, startTracking, previewMode]);

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  // Dwell Selection Logic
  useEffect(() => {
    if (!isTracking || showFeedback || previewMode) return;

    let targetIndex = null;
    const { x, y } = gazeData;

    // Check which option the gaze is over
    for (let i = 0; i < optionsRef.current.length; i++) {
      const el = optionsRef.current[i];
      if (el) {
        const rect = el.getBoundingClientRect();
        // Add a bit of padding to make it easier for kids
        const padding = 20;
        if (
          x >= rect.left - padding &&
          x <= rect.right + padding &&
          y >= rect.top - padding &&
          y <= rect.bottom + padding
        ) {
          targetIndex = i;
          break;
        }
      }
    }

    if (targetIndex !== null) {
      if (hoveredIndex !== targetIndex) {
        // New target focused
        setHoveredIndex(targetIndex);
        hoverStartTimeRef.current = Date.now();
      } else {
        // Continue dwelling
        const elapsed = Date.now() - hoverStartTimeRef.current;
        const progress = Math.min((elapsed / DWELL_TIME_MS) * 100, 100);
        setDwellProgress({ index: targetIndex, progress });

        if (elapsed >= DWELL_TIME_MS) {
          handleSelect(targetIndex);
        }
      }
    } else {
      // Looked away
      setHoveredIndex(null);
      setDwellProgress({ index: null, progress: 0 });
    }
  }, [gazeData, isTracking, hoveredIndex, showFeedback, previewMode]);

  const handleSelect = (index) => {
    if (showFeedback) return;
    
    // Stop tracking progress to avoid multiple triggers
    setHoveredIndex(null);
    setDwellProgress({ index: null, progress: 0 });
    
    setAttempts((prev) => prev + 1);
    const selectedOption = options[index];
    const correct = selectedOption?.isCorrect === true;
    
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
        prompts: ['none'],
        timeSpent,
      });
    }
  };

  const handleRestart = () => {
    setShowFeedback(false);
    setAttempts(0);
  };

  if (!content) return null;

  return (
    <>
      {!isCalibrated && !previewMode && (
        <GazeCalibration onComplete={() => setIsCalibrated(true)} />
      )}

      {!previewMode && isTracking && (
        <GazeCursor 
          x={gazeData.x} 
          y={gazeData.y} 
          isVisible={true} 
          progress={dwellProgress.progress} 
        />
      )}

      <GameContainer className="max-w-4xl" dir="rtl">
        <ChildGameBackdrop previewMode={previewMode} />
        <GameHeader
          instruction={content.instructionAr || 'انظر للصورة الصحيحة'}
          avatarState={showFeedback ? (isCorrect ? 'celebration' : 'error') : 'learning'}
          onPlayAudio={() => {
            if (content?.questionAudio) playAudioUrl(content.questionAudio);
          }}
          onRestart={handleRestart}
        />

        <GameSection className="mx-auto w-full max-w-3xl mt-8">
          <div className={`grid gap-8 ${options.length >= 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {options.map((opt, idx) => {
              const isHovered = hoveredIndex === idx;
              const progress = dwellProgress.index === idx ? dwellProgress.progress : 0;
              
              return (
                <button
                  key={opt.id || idx}
                  ref={(el) => (optionsRef.current[idx] = el)}
                  onClick={() => handleSelect(idx)}
                  className={`relative group flex flex-col items-center justify-center p-6 rounded-[2rem] border-b-[8px] transition-all bg-white
                    ${isHovered ? 'ring-8 ring-blue-400 scale-105 border-blue-500' : 'border-slate-200 shadow-xl'}`}
                >
                  <div className="w-full aspect-square relative rounded-2xl overflow-hidden bg-slate-50 mb-4">
                    {opt.image ? (
                      <img src={opt.image} alt={opt.textAr || `خيار ${idx + 1}`} className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-black text-slate-300">؟</div>
                    )}
                    
                    {/* Visual Progress Overlay */}
                    {isHovered && (
                      <div 
                        className="absolute bottom-0 left-0 h-2 bg-green-500 transition-all duration-75"
                        style={{ width: `${progress}%` }}
                      />
                    )}
                  </div>
                  
                  {opt.textAr && (
                    <span className={`text-2xl font-black ${isHovered ? 'text-blue-600' : 'text-slate-700'}`}>
                      {opt.textAr}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </GameSection>

        <FeedbackModal
          show={showFeedback}
          isCorrect={isCorrect}
          onNext={handleNext}
          successSound={game?.config?.feedback?.successSound}
          failSound={game?.config?.feedback?.failSound}
        />
      </GameContainer>
    </>
  );
};

export default EyeTrackingChooseGame;
