import React, { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw, Volume2 } from 'lucide-react';
import { playAudioUrl, playBoundarySound, playMoveSound, playSuccessSound } from '../utils/soundEffects';
import FeedbackModal from '../components/FeedbackModal';

const CELL_SIZE = 52;
const PREVIEW_CELL_SIZE = 26;

const parseGrid = (grid) =>
  Array.isArray(grid) && grid.length
    ? grid.map((row) => (Array.isArray(row) ? row.map((cell) => (Number(cell) === 1 ? 1 : 0)) : []))
    : [];

const speakArabic = (text) => {
  if (!text || typeof window === 'undefined') return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ar-SA';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
};

const ControlButton = ({ icon: Icon, onClick, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] bg-sky-500 text-white shadow-[0_6px_0_#0284c7] hover:bg-sky-400 active:translate-y-2 active:shadow-none transition-all flex items-center justify-center ${className}`}
  >
    <Icon size={32} />
  </button>
);

const MazeGame = ({
  game,
  config,
  onComplete,
  therapistControlsEnabled = false,
  therapistPromptLevel = 'none',
  previewMode = false,
  onAssistantInteraction,
  registerAssistantActions,
}) => {
  const content = config?.content || {};
  const feedback = config?.feedback || {};
  const maze = content?.maze || {};
  const grid = useMemo(() => parseGrid(maze.grid), [maze.grid]);
  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  const startX = Math.min(Math.max(Number(maze.startX ?? 2), 1), cols || 1);
  const startY = Math.min(Math.max(Number(maze.startY ?? 2), 1), rows || 1);
  const goalX = Math.min(Math.max(Number(maze.goalX ?? cols), 1), cols || 1);
  const goalY = Math.min(Math.max(Number(maze.goalY ?? rows), 1), rows || 1);

  const [position, setPosition] = useState({ x: startX, y: startY });
  const [attempts, setAttempts] = useState(0);
  const [won, setWon] = useState(false);
  const [startTime] = useState(Date.now());

  /* ── Hint states ── */
  const [visualPulse, setVisualPulse] = useState(false);
  const [gestureDirection, setGestureDirection] = useState(null);
  const [physicalPath, setPhysicalPath] = useState(false);

  /* ── Modal states ── */
  const [showModal, setShowModal] = useState(false);
  const [isCorrectModal, setIsCorrectModal] = useState(false);
  const [pendingCompleteData, setPendingCompleteData] = useState(null);

  useEffect(() => {
    setPosition({ x: startX, y: startY });
    setAttempts(0);
    setWon(false);
    setShowModal(false);
  }, [game?.id, startX, startY, goalX, goalY]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (won || showModal) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
      }
      if (event.key === 'ArrowUp') moveBy(0, -1);
      if (event.key === 'ArrowDown') moveBy(0, 1);
      if (event.key === 'ArrowLeft') moveBy(-1, 0);
      if (event.key === 'ArrowRight') moveBy(1, 0);
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const isValidCell = (x, y) => {
    if (x < 1 || x > cols || y < 1 || y > rows) return false;
    return grid[y - 1][x - 1] === 0;
  };

  /* ── Compute best direction toward goal (simple BFS-like hint) ── */
  const computeDirectionHint = () => {
    const dx = goalX - position.x;
    const dy = goalY - position.y;

    // Try horizontal first, then vertical
    const candidates = [];
    if (dx > 0 && isValidCell(position.x + 1, position.y)) candidates.push('right');
    if (dx < 0 && isValidCell(position.x - 1, position.y)) candidates.push('left');
    if (dy > 0 && isValidCell(position.x, position.y + 1)) candidates.push('down');
    if (dy < 0 && isValidCell(position.x, position.y - 1)) candidates.push('up');

    // Fallback to any valid direction
    if (!candidates.length) {
      if (isValidCell(position.x, position.y - 1)) candidates.push('up');
      if (isValidCell(position.x, position.y + 1)) candidates.push('down');
      if (isValidCell(position.x - 1, position.y)) candidates.push('left');
      if (isValidCell(position.x + 1, position.y)) candidates.push('right');
    }

    return candidates[0] || 'up';
  };

  const directionArrow = { up: '↑', down: '↓', left: '←', right: '→' };

  /* ── Register 4 assistant callbacks ── */
  useEffect(() => {
    if (!registerAssistantActions) {
      return undefined;
    }

    registerAssistantActions({
      onVisualHint: () => {
        setVisualPulse(true);
        window.setTimeout(() => setVisualPulse(false), 2500);
      },
      onGestureHint: () => {
        const dir = computeDirectionHint();
        setGestureDirection(dir);
        window.setTimeout(() => setGestureDirection(null), 3000);
      },
      onVerbalHint: () => {
        const dir = computeDirectionHint();
        const dirNames = { up: 'فوق', down: 'تحت', left: 'شمال', right: 'يمين' };
        speakArabic(`جرّب تمشي ${dirNames[dir] || ''} عشان تقرب من الهدف.`);
      },
      onPhysicalPrompt: () => {
        setPhysicalPath(true);
        window.setTimeout(() => setPhysicalPath(false), 4000);
        setTimeout(() => setPhysicalPath(false), 2500);
      },
    });

    return () => registerAssistantActions({});
  }, [
    registerAssistantActions,
    position.x,
    position.y,
    goalX,
    goalY,
    content?.instructionAudio,
    content?.instructionAr,
  ]);


  const finishGame = (nextAttempts) => {
    if (feedback.successSound) playAudioUrl(feedback.successSound);
    else playSuccessSound();

    setWon(true);
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.5 } });
    
    setIsCorrectModal(true);
    setShowModal(true);
    
    const responseTime = Date.now() - startTime;
    setPendingCompleteData({
      correctAnswers: 1,
      wrongAnswers: Math.max(nextAttempts - 1, 0),
      attempts: [nextAttempts],
      prompts: [therapistControlsEnabled ? therapistPromptLevel : 'none'],
      timeSpent: Math.floor(responseTime / 1000),
      responseTime,
      isCorrect: true,
    });
  };

  const moveBy = (dx, dy) => {
    if (won || showModal) return;
    onAssistantInteraction?.();

    const nextX = position.x + dx;
    const nextY = position.y + dy;

    if (!isValidCell(nextX, nextY)) {
      if (feedback.boundarySound) playAudioUrl(feedback.boundarySound);
      else playBoundarySound();
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      return;
    }

    if (feedback.moveSound) playAudioUrl(feedback.moveSound);
    else playMoveSound();

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setPosition({ x: nextX, y: nextY });

    if (nextX === goalX && nextY === goalY) {
      finishGame(nextAttempts);
    }
  };

  const handleModalNext = () => {
    setShowModal(false);
    if (isCorrectModal) {
      if (previewMode) {
        setPosition({ x: startX, y: startY });
        setAttempts(0);
        setWon(false);
      } else if (pendingCompleteData) {
        onComplete(pendingCompleteData);
      }
    }
  };

  if (!rows || !cols) {
    return (
      <div className="bg-white rounded-[2rem] border border-[#dbe7f3] p-8 text-center text-slate-600">
        هذه المتاهة غير مكتملة الإعداد.
      </div>
    );
  }

  const showGoalHighlight = visualPulse || physicalPath;

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-4 md:gap-6" dir="rtl">
      {/* Header */}
      <section className="bg-white rounded-2xl md:rounded-[2rem] p-4 md:p-6 shadow-sm border border-[#dbe7f3] flex items-center justify-between gap-4">
        <div className="flex-grow">
          <h2 className="text-xl md:text-3xl font-black text-slate-900 leading-tight">
            {content?.instructionAr || 'حرّك حتى تصل إلى الهدف'}
          </h2>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (content?.instructionAudio) playAudioUrl(content.instructionAudio);
              else speakArabic(content?.instructionAr || 'حرّك حتى تصل إلى الهدف');
            }}
            className="w-12 h-12 md:w-14 md:h-14 shrink-0 bg-blue-600 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
          >
            <Volume2 className="text-white w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={() => {
              setPosition({ x: startX, y: startY });
              setAttempts(0);
              setWon(false);
              setVisualPulse(false);
              setGestureDirection(null);
              setPhysicalPath(false);
            }}
            className="w-12 h-12 md:w-14 md:h-14 shrink-0 bg-rose-500 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
          >
            <RotateCcw className="text-white w-6 h-6" />
          </button>
        </div>
      </section>

      {/* Main Play Area */}
      <section className="bg-[#f8fbff] rounded-2xl md:rounded-[2.4rem] border border-[#dbe7f3] p-4 md:p-8 shadow-sm flex flex-col items-center gap-6 md:gap-10">
        
        {/* The Maze Grid */}
        <div 
          className="relative w-full flex items-center justify-center"
        >
          <div 
            className="relative bg-slate-100 rounded-2xl md:rounded-3xl p-1.5 md:p-3 border-[3px] md:border-[4px] border-slate-300 shadow-inner"
            style={{ 
              aspectRatio: `${cols} / ${rows}`,
              width: '100%',
              maxWidth: `min(100%, calc(55vh * ${cols} / ${rows}))`,
            }} 
            dir="ltr"
          >
            <div 
              className="grid w-full h-full"
              style={{ 
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                gap: cols > 7 ? '2px' : '4px'
              }} 
            >
              {grid.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const x = colIndex + 1;
                  const y = rowIndex + 1;
                  const isWall = cell === 1;
                  const isPlayer = position.x === x && position.y === y;
                  const isGoal = goalX === x && goalY === y;

                  return (
                    <div
                      key={`${x}-${y}`}
                      className={`relative rounded-lg md:rounded-xl flex items-center justify-center overflow-hidden transition-all duration-300 ${
                        isWall 
                          ? 'bg-slate-700 border-b-4 border-slate-800 shadow-sm' 
                          : 'bg-white shadow-[inset_0_0_4px_rgba(0,0,0,0.05)]'
                      }`}
                    >
                      {isGoal && !isWall && (
                        maze.goalImage ? (
                          <img
                            src={maze.goalImage}
                            alt="goal"
                            className={`w-[85%] h-[85%] object-contain drop-shadow-md ${showGoalHighlight ? 'scale-110 drop-shadow-[0_0_15px_rgba(22,143,199,0.9)] animate-pulse' : ''}`}
                          />
                        ) : (
                          <div className={`w-[80%] h-[80%] rounded-lg ${showGoalHighlight ? 'bg-sky-200 border-2 border-sky-500 animate-pulse' : 'bg-emerald-400 border-b-2 border-emerald-600 shadow-sm'}`} />
                        )
                      )}
                      {isPlayer && !isWall && (
                        maze.playerImage ? (
                          <img src={maze.playerImage} alt="player" className="w-[90%] h-[90%] object-contain relative z-10 drop-shadow-lg" />
                        ) : (
                          <div className="w-[85%] h-[85%] rounded-lg bg-blue-500 border-b-2 border-blue-700 relative z-10 shadow-sm" />
                        )
                      )}
                    </div>
                  );
                })
              )}

              {/* Gesture direction indicator above player */}
              {gestureDirection && (
                <div
                  className="absolute z-30 text-4xl drop-shadow-xl animate-bounce pointer-events-none"
                  style={{
                    left: `calc(${(position.x - 1) * 100 / cols}% + ${50 / cols}% - 16px)`,
                    top: `calc(${(position.y - 1) * 100 / rows}% - 30px)`,
                  }}
                >
                  {directionArrow[gestureDirection]}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controls Area */}
        <div className="grid grid-cols-3 gap-3 md:gap-5 max-w-[260px] mx-auto pb-4" dir="ltr">
          <div />
          <ControlButton icon={ArrowUp} onClick={() => moveBy(0, -1)} />
          <div />
          <ControlButton icon={ArrowLeft} onClick={() => moveBy(-1, 0)} />
          <ControlButton icon={ArrowDown} onClick={() => moveBy(0, 1)} />
          <ControlButton icon={ArrowRight} onClick={() => moveBy(1, 0)} />
        </div>
      </section>

      <FeedbackModal
        show={showModal}
        isCorrect={isCorrectModal}
        onNext={handleModalNext}
        successSound={feedback?.successSound}
        failSound={feedback?.failSound}
      />
    </div>
  );
};

export default MazeGame;
