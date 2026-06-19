import React, { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw, Volume2 } from 'lucide-react';
import { playAudioUrl, playBoundarySound, playMoveSound, playSuccessSound } from '../utils/soundEffects';
import FeedbackModal from '../components/FeedbackModal';
import GameHeader from '../components/game/GameHeader';

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

const ControlButton = ({ icon: Icon, onClick, className = '', highlighted = false }) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative w-12 h-12 sm:w-14 sm:h-14 md:w-20 md:h-20 rounded-2xl md:rounded-[1.5rem] bg-sky-500 text-white shadow-[0_5px_0_#0284c7] md:shadow-[0_6px_0_#0284c7] hover:bg-sky-400 active:translate-y-1 md:active:translate-y-1.5 active:shadow-none transition-all flex items-center justify-center ${
      highlighted ? 'ring-4 ring-amber-400 scale-110 animate-pulse shadow-[0_0_24px_rgba(251,191,36,0.8)] z-10' : ''
    } ${className}`}
  >
    <Icon size={24} className="md:w-8 md:h-8" />
    {highlighted && (
      <span className="absolute -top-8 text-3xl animate-bounce pointer-events-none">👇</span>
    )}
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
  helpVoiceEnabled = false,
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
  const [hintNextCell, setHintNextCell] = useState(null);
  const [hintPathCells, setHintPathCells] = useState([]);

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

  const clearHints = () => {
    setVisualPulse(false);
    setGestureDirection(null);
    setPhysicalPath(false);
    setHintNextCell(null);
    setHintPathCells([]);
  };

  /* ── BFS path from player to goal ── */
  const computeHintPath = () => {
    const queue = [{ x: position.x, y: position.y, path: [] }];
    const visited = new Set([`${position.x},${position.y}`]);
    const directions = [
      { dx: 0, dy: -1, dir: 'up' },
      { dx: 0, dy: 1, dir: 'down' },
      { dx: -1, dy: 0, dir: 'left' },
      { dx: 1, dy: 0, dir: 'right' },
    ];

    while (queue.length) {
      const current = queue.shift();
      if (current.x === goalX && current.y === goalY) {
        return current.path;
      }

      for (const { dx, dy, dir } of directions) {
        const nextX = current.x + dx;
        const nextY = current.y + dy;
        const key = `${nextX},${nextY}`;
        if (!isValidCell(nextX, nextY) || visited.has(key)) continue;
        visited.add(key);
        queue.push({
          x: nextX,
          y: nextY,
          path: [...current.path, { x: nextX, y: nextY, dir }],
        });
      }
    }

    return [];
  };

  const getFirstHintStep = () => computeHintPath()[0] || null;

  const directionArrow = { up: '↑', down: '↓', left: '←', right: '→' };
  const dirNames = { up: 'فوق', down: 'تحت', left: 'شمال', right: 'يمين' };

  const moveByRef = useRef(null);

  /* ── Register 4 assistant callbacks ── */
  useEffect(() => {
    if (!registerAssistantActions) {
      return undefined;
    }

    registerAssistantActions({
      onVisualHint: () => {
        const firstStep = getFirstHintStep();
        setHintNextCell(firstStep ? { x: firstStep.x, y: firstStep.y } : null);
        setVisualPulse(true);
        window.setTimeout(() => {
          setVisualPulse(false);
          setHintNextCell(null);
        }, 2500);
      },
      onGestureHint: () => {
        const firstStep = getFirstHintStep();
        if (!firstStep) return;
        setGestureDirection(firstStep.dir);
        setHintNextCell({ x: firstStep.x, y: firstStep.y });
        window.setTimeout(() => {
          setGestureDirection(null);
          setHintNextCell(null);
        }, 3000);
      },
      onVerbalHint: () => {
        const firstStep = getFirstHintStep();
        const dir = firstStep?.dir || 'up';
        if (helpVoiceEnabled) {
          speakArabic(`جرّب تمشي ${dirNames[dir] || ''} عشان تقرب من الهدف.`);
        }
      },
      onPhysicalPrompt: () => {
        const path = computeHintPath();
        setHintPathCells(path.map((step) => ({ x: step.x, y: step.y })));
        setPhysicalPath(true);
        if (helpVoiceEnabled) {
          speakArabic('هوريك الطريق للهدف! اتبع الخلايا اللي بتلمع.');
        }
        window.setTimeout(() => {
          setPhysicalPath(false);
          setHintPathCells([]);
        }, 4000);

        const firstStep = path[0];
        if (!firstStep) return;
        const moves = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
        const [dx, dy] = moves[firstStep.dir] || [0, 0];
        window.setTimeout(() => moveByRef.current?.(dx, dy), 1200);
      },
    });

    return () => registerAssistantActions({});
  }, [
    helpVoiceEnabled,
    registerAssistantActions,
    position.x,
    position.y,
    goalX,
    goalY,
    cols,
    rows,
    grid,
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
    clearHints();

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

  moveByRef.current = moveBy;

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
    <div className="max-w-3xl mx-auto flex flex-col gap-4 md:gap-5" dir="rtl">
      {/* Header */}
      <GameHeader
        instruction={content?.instructionAr || 'حرّك حتى تصل إلى الهدف'}
        onPlayAudio={() => {
          if (content?.instructionAudio) playAudioUrl(content.instructionAudio);
          else speakArabic(content?.instructionAr || 'حرّك حتى تصل إلى الهدف');
        }}
        onRestart={() => {
          setPosition({ x: startX, y: startY });
          setAttempts(0);
          setWon(false);
          clearHints();
        }}
      />

      {/* Main Play Area */}
      <section className="bg-[#f8fbff] rounded-2xl md:rounded-[2.4rem] border border-[#dbe7f3] p-4 md:p-7 shadow-sm flex flex-col items-center gap-5 md:gap-8">
        
        {/* The Maze Grid */}
        <div 
          className="relative w-full flex items-center justify-center"
        >
          <div 
            className="relative bg-slate-100 rounded-2xl md:rounded-3xl p-1.5 md:p-3 border-[3px] md:border-[4px] border-slate-300 shadow-inner"
            style={{ 
              aspectRatio: `${cols} / ${rows}`,
              width: '100%',
              maxWidth: `min(100%, calc(46vh * ${cols} / ${rows}))`,
            }} 
            dir="ltr"
          >
            <div 
              className="relative grid w-full h-full"
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
                  const isNextHintCell = hintNextCell?.x === x && hintNextCell?.y === y;
                  const isPathCell = hintPathCells.some((step) => step.x === x && step.y === y);

                  return (
                    <div
                      key={`${x}-${y}`}
                      className={`relative rounded-lg md:rounded-xl flex items-center justify-center overflow-visible transition-all duration-300 ${
                        isWall 
                          ? 'bg-slate-700 border-b-4 border-slate-800 shadow-sm' 
                          : isPathCell
                            ? 'bg-cyan-200 ring-4 ring-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.6)] animate-pulse z-20'
                            : isNextHintCell && (visualPulse || gestureDirection)
                              ? 'bg-amber-100 ring-4 ring-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.7)] animate-pulse z-20'
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

              {gestureDirection && hintNextCell && (
                <div
                className="absolute z-30 text-3xl md:text-4xl drop-shadow-xl animate-bounce pointer-events-none"
                  style={{
                    left: `calc((100% / ${cols}) * ${hintNextCell.x - 1} + (100% / ${cols}) / 2)`,
                    top: `calc((100% / ${rows}) * ${hintNextCell.y - 1} - 8px)`,
                    transform: 'translate(-50%, -100%)',
                  }}
                >
                  {directionArrow[gestureDirection]}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controls Area */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 w-fit mx-auto pb-2 md:pb-3" dir="ltr">
          <div />
          <ControlButton icon={ArrowUp} onClick={() => moveBy(0, -1)} highlighted={gestureDirection === 'up'} className="relative" />
          <div />
          <ControlButton icon={ArrowLeft} onClick={() => moveBy(-1, 0)} highlighted={gestureDirection === 'left'} className="relative" />
          <ControlButton icon={ArrowDown} onClick={() => moveBy(0, 1)} highlighted={gestureDirection === 'down'} className="relative" />
          <ControlButton icon={ArrowRight} onClick={() => moveBy(1, 0)} highlighted={gestureDirection === 'right'} className="relative" />
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
