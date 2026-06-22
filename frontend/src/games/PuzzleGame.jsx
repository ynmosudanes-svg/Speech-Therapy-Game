import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import confetti from 'canvas-confetti';
import { Sparkles } from 'lucide-react';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import { playAudioUrl, playErrorSound, playMoveSound, playSuccessSound } from '../utils/soundEffects';
import GameHeader from '../components/game/GameHeader';
import BirdHint from '../components/game/BirdHint';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop';
const PIECE_VIEWBOX = 140;
const TILE_SIZE = 100;
const PIECE_PAD = 20;

const buildPuzzlePath = (row, col, gridSize, joints) => {
  let d = 'M 20 20 ';

  if (row === 0) {
    d += 'L 120 20 ';
  } else {
    const joint = joints.bottom[row - 1][col];
    d += joint === 1
      ? 'L 60 20 C 50 20, 50 38, 70 38 C 90 38, 90 20, 80 20 L 120 20 '
      : 'L 60 20 C 50 20, 50 2, 70 2 C 90 2, 90 20, 80 20 L 120 20 ';
  }

  if (col === gridSize - 1) {
    d += 'L 120 120 ';
  } else {
    const joint = joints.right[row][col];
    d += joint === 1
      ? 'L 120 60 C 120 50, 138 50, 138 70 C 138 90, 120 90, 120 80 L 120 120 '
      : 'L 120 60 C 120 50, 102 50, 102 70 C 102 90, 120 90, 120 80 L 120 120 ';
  }

  if (row === gridSize - 1) {
    d += 'L 20 120 ';
  } else {
    const joint = joints.bottom[row][col];
    d += joint === 1
      ? 'L 80 120 C 90 120, 90 138, 70 138 C 50 138, 50 120, 60 120 L 20 120 '
      : 'L 80 120 C 90 120, 90 102, 70 102 C 50 102, 50 120, 60 120 L 20 120 ';
  }

  if (col === 0) {
    d += 'L 20 20 ';
  } else {
    const joint = joints.right[row][col - 1];
    d += joint === 1
      ? 'L 20 80 C 20 90, 38 90, 38 70 C 38 50, 20 50, 20 60 L 20 20 '
      : 'L 20 80 C 20 90, 2 90, 2 70 C 2 50, 20 50, 20 60 L 20 20 ';
  }

  return `${d}Z`;
};

const translatePath = (path, dx, dy) => {
  let numberIndex = 0;
  return path.replace(/-?\d+(?:\.\d+)?/g, (value) => {
    const translated = Number(value) + (numberIndex % 2 === 0 ? dx : dy);
    numberIndex += 1;
    return Number(translated.toFixed(4)).toString();
  });
};
const makePuzzlePieces = (gridSize) => {
  const joints = { right: [], bottom: [] };

  for (let row = 0; row < gridSize; row += 1) {
    joints.right[row] = [];
    joints.bottom[row] = [];
    for (let col = 0; col < gridSize; col += 1) {
      joints.right[row][col] = Math.random() > 0.5 ? 1 : -1;
      joints.bottom[row][col] = Math.random() > 0.5 ? 1 : -1;
    }
  }

  return Array.from({ length: gridSize * gridSize }, (_, index) => {
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;

    const path = buildPuzzlePath(row, col, gridSize, joints);

    return {
      id: index,
      originalPos: index,
      row,
      col,
      path,
      boardPath: translatePath(path, col * TILE_SIZE - PIECE_PAD, row * TILE_SIZE - PIECE_PAD),
    };
  });
};

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

function BoardReferenceImage({ imageSrc, gridSize, className = '', opacity = 1 }) {
  const boardImageSize = gridSize * TILE_SIZE;

  return (
    <svg
      viewBox={`0 0 ${boardImageSize} ${boardImageSize}`}
      className={className}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <image
        href={imageSrc}
        x="0"
        y="0"
        width={boardImageSize}
        height={boardImageSize}
        preserveAspectRatio="xMidYMin slice"
        opacity={opacity}
      />
    </svg>
  );
}

function PuzzlePiece({
  piece,
  imageSrc,
  gridSize,
  size = '100%',
  disabled = false,
  isActive = false,
  isHinted = false,
  isWrong = false,
}) {
  const reactId = useId();
  const clipId = 'puzzle-piece-' + reactId.replace(/:/g, '') + '-' + piece.id;
  const boardUnits = gridSize * TILE_SIZE;
  const imageX = PIECE_PAD - piece.col * TILE_SIZE;
  const imageY = PIECE_PAD - piece.row * TILE_SIZE;

  return (
    <div
      className={`relative touch-none select-none transition-transform duration-200 ${disabled ? '' : 'cursor-grab active:cursor-grabbing'} ${isActive ? 'scale-105' : ''}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={`0 0 ${PIECE_VIEWBOX} ${PIECE_VIEWBOX}`}
        className="h-full w-full overflow-visible drop-shadow-[0_10px_16px_rgba(15,23,42,0.15)]"
        aria-hidden="true"
      >
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <path d={piece.path} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <image
            href={imageSrc}
            x={imageX}
            y={imageY}
            width={boardUnits}
            height={boardUnits}
            preserveAspectRatio="xMidYMin slice"
          />
          <rect x="0" y="0" width={PIECE_VIEWBOX} height={PIECE_VIEWBOX} fill="rgba(255,255,255,0.04)" />
        </g>
        <path
          d={piece.path}
          fill="none"
          stroke={isWrong ? '#fb7185' : isHinted ? '#22d3ee' : 'rgba(255,255,255,0.95)'}
          strokeWidth={isHinted || isWrong ? '4' : '2.4'}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function BoardPlacedLayer({ placedPieces, pieceById, imageSrc, gridSize, successSlotIndex }) {
  const reactId = useId();
  const imageClipId = 'board-placed-image-' + reactId.replace(/:/g, '');
  const boardUnits = gridSize * TILE_SIZE;
  const placedItems = placedPieces
    .map((pieceId, slotIndex) => {
      if (pieceId === null) return null;
      const piece = pieceById.get(pieceId);
      return piece ? { piece, slotIndex } : null;
    })
    .filter(Boolean);

  return (
    <svg
      viewBox={`0 0 ${boardUnits} ${boardUnits}`}
      className="absolute inset-0 h-full w-full overflow-visible drop-shadow-[0_8px_14px_rgba(15,23,42,0.14)]"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <defs>
        <clipPath id={imageClipId} clipPathUnits="userSpaceOnUse">
          {placedItems.map(({ piece }) => (
            <path key={piece.id} d={piece.boardPath} />
          ))}
        </clipPath>
      </defs>
      <g clipPath={`url(#${imageClipId})`}>
        <image
          href={imageSrc}
          x="0"
          y="0"
          width={boardUnits}
          height={boardUnits}
          preserveAspectRatio="xMidYMin slice"
        />
        <rect x="0" y="0" width={boardUnits} height={boardUnits} fill="rgba(255,255,255,0.04)" />
      </g>
      {placedItems.map(({ piece, slotIndex }) => {
        const isSuccess = successSlotIndex === slotIndex;

        return (
          <path
            key={piece.id}
            d={piece.boardPath}
            fill="none"
            stroke={isSuccess ? '#22c55e' : 'rgba(255,255,255,0.95)'}
            strokeWidth={isSuccess ? '4' : '2.4'}
            strokeLinejoin="round"
          />
        );
      })}
    </svg>
  );
}
function DraggablePiece({ piece, imageSrc, gridSize, pieceSize, isHinted, isWrong }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `piece-${piece.id}`,
    data: { pieceId: piece.id },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`relative flex items-center justify-center rounded-[1.35rem] bg-white/80 p-1.5 shadow-[0_12px_28px_-22px_rgba(15,23,42,0.45)] ring-1 ring-sky-100 transition-all duration-200 ${isDragging ? 'opacity-25' : 'opacity-100'} ${isHinted ? 'z-20 ring-4 ring-cyan-200' : ''}`}
      style={{
        width: pieceSize,
        height: pieceSize,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      }}
    >
      {isHinted && (
        <BirdHint className="pointer-events-none absolute -top-9 left-1/2 z-30 h-11 w-11 -translate-x-1/2 drop-shadow-[0_10px_18px_rgba(6,182,212,0.28)]" />
      )}
      <PuzzlePiece piece={piece} imageSrc={imageSrc} gridSize={gridSize} size="100%" isHinted={isHinted} isWrong={isWrong} />
    </div>
  );
}

function BoardSlot({ index, isHinted, isCorrectFlash }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `slot-${index}`,
    data: { slotIndex: index },
  });

  return (
    <div
      ref={setNodeRef}
      className={`relative flex items-center justify-center overflow-visible border border-dashed transition-all duration-200 ${
        isCorrectFlash
          ? 'z-20 border-emerald-400 bg-emerald-50/60 shadow-[inset_0_0_18px_rgba(34,197,94,0.28)]'
          : isHinted
            ? 'z-10 border-cyan-400 bg-cyan-50/60 shadow-[inset_0_0_16px_rgba(34,211,238,0.24)]'
            : isOver
              ? 'z-10 border-sky-400 bg-sky-50/50 shadow-[inset_0_0_14px_rgba(14,165,233,0.24)]'
              : 'border-slate-300/80 bg-white/10'
      }`}
    />
  );
}

export default function PuzzleGame({
  game,
  onComplete,
  previewMode,
  onAssistantInteraction,
  registerAssistantActions,
  helpVoiceEnabled = false,
}) {
  const config = game?.config || {};
  const imageSrc = config.image || DEFAULT_IMAGE;
  const requestedGridSize = Number(config.gridSize) || 3;
  const gridSize = requestedGridSize >= 4 ? 4 : 3;
  const instructionAr = config.instructionAr || 'ركب الصورة';
  const instructionAudio = config.instructionAudio || '';
  const { speak } = useSpeechSynthesis();

  const [pieces, setPieces] = useState([]);
  const [trayPieceIds, setTrayPieceIds] = useState([]);
  const [placedPieces, setPlacedPieces] = useState([]);
  const [activePieceId, setActivePieceId] = useState(null);
  const [hintPieceId, setHintPieceId] = useState(null);
  const [hintSlotIndex, setHintSlotIndex] = useState(null);
  const [wrongPieceId, setWrongPieceId] = useState(null);
  const [successSlotIndex, setSuccessSlotIndex] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());

  const completedRef = useRef(false);
  const hintTimersRef = useRef([]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 80, tolerance: 8 } }),
  );

  const pieceById = useMemo(() => new Map(pieces.map((piece) => [piece.id, piece])), [pieces]);
  const activePiece = activePieceId !== null ? pieceById.get(activePieceId) : null;
  const remainingPieces = trayPieceIds.map((id) => pieceById.get(id)).filter(Boolean);

  const clearHintTimers = useCallback(() => {
    hintTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    hintTimersRef.current = [];
  }, []);

  const clearHints = useCallback(() => {
    clearHintTimers();
    setHintPieceId(null);
    setHintSlotIndex(null);
  }, [clearHintTimers]);

  const scheduleHintClear = useCallback((delay = 5200) => {
    clearHintTimers();
    const timer = window.setTimeout(() => clearHints(), delay);
    hintTimersRef.current.push(timer);
  }, [clearHintTimers, clearHints]);

  const startGame = useCallback(() => {
    const nextPieces = makePuzzlePieces(gridSize);
    completedRef.current = false;
    setPieces(nextPieces);
    setTrayPieceIds(shuffle(nextPieces.map((piece) => piece.id)));
    setPlacedPieces(Array(gridSize * gridSize).fill(null));
    setActivePieceId(null);
    setHintPieceId(null);
    setHintSlotIndex(null);
    setWrongPieceId(null);
    setSuccessSlotIndex(null);
    setCompleted(false);
    setMoves(0);
    setStartTime(Date.now());
  }, [gridSize]);

  useEffect(() => {
    startGame();
    return () => clearHintTimers();
  }, [startGame, clearHintTimers, game?.id, imageSrc]);

  const playInstruction = () => {
    if (instructionAudio) playAudioUrl(instructionAudio);
  };

  const finishGame = useCallback((moveCount) => {
    if (completedRef.current) return;
    completedRef.current = true;
    setCompleted(true);
    playSuccessSound();
    confetti({ particleCount: 130, spread: 75, origin: { y: 0.58 } });
    confetti({ particleCount: 70, spread: 55, origin: { x: 0.2, y: 0.65 } });
    confetti({ particleCount: 70, spread: 55, origin: { x: 0.8, y: 0.65 } });

    if (onComplete && !previewMode) {
      onComplete({
        correctAnswers: 1,
        wrongAnswers: 0,
        attempts: [Math.max(moveCount, 1)],
        timeSpent: Math.floor((Date.now() - startTime) / 1000),
        prompts: [],
      });
    }
  }, [onComplete, previewMode, startTime]);

  const placePieceIfCorrect = useCallback((pieceId, slotIndex, fromAssistant = false) => {
    const piece = pieceById.get(pieceId);
    if (!piece || placedPieces[slotIndex] !== null || completedRef.current) return;

    setMoves((currentMoves) => {
      const nextMoves = currentMoves + 1;
      if (piece.originalPos === slotIndex) {
        setPlacedPieces((currentPlaced) => {
          if (currentPlaced[slotIndex] !== null) return currentPlaced;
          const nextPlaced = [...currentPlaced];
          nextPlaced[slotIndex] = pieceId;
          if (nextPlaced.every((id) => id !== null)) {
            window.setTimeout(() => finishGame(nextMoves), 180);
          }
          return nextPlaced;
        });
      }
      return nextMoves;
    });

    clearHints();
    if (!fromAssistant) onAssistantInteraction?.();

    if (piece.originalPos !== slotIndex) {
      setWrongPieceId(pieceId);
      playErrorSound();
      window.setTimeout(() => setWrongPieceId(null), 520);
      return;
    }

    playMoveSound();
    setSuccessSlotIndex(slotIndex);
    window.setTimeout(() => setSuccessSlotIndex(null), 520);
    setTrayPieceIds((current) => current.filter((id) => id !== pieceId));
  }, [clearHints, finishGame, onAssistantInteraction, pieceById, placedPieces]);

  const getNextHintPiece = useCallback(() => {
    const nextId = trayPieceIds[0];
    return nextId === undefined ? null : pieceById.get(nextId) || null;
  }, [pieceById, trayPieceIds]);

  const getNextHintPieceRef = useRef(getNextHintPiece);
  getNextHintPieceRef.current = getNextHintPiece;
  const placePieceIfCorrectRef = useRef(placePieceIfCorrect);
  placePieceIfCorrectRef.current = placePieceIfCorrect;

  useEffect(() => {
    if (!registerAssistantActions) return undefined;

    registerAssistantActions({
      onVisualHint: () => {
        const piece = getNextHintPieceRef.current();
        if (!piece) return;
        setHintPieceId(piece.id);
        setHintSlotIndex(null);
        scheduleHintClear();
      },
      onGestureHint: () => {
        const piece = getNextHintPieceRef.current();
        if (!piece) return;
        setHintPieceId(piece.id);
        setHintSlotIndex(piece.originalPos);
        scheduleHintClear();
      },
      onVerbalHint: () => {
        const piece = getNextHintPieceRef.current();
        if (!piece) return;
        setHintPieceId(piece.id);
        setHintSlotIndex(piece.originalPos);
        if (helpVoiceEnabled) speak('ضع القطعة المضيئة في المكان المضيء على اللوحة.');
        scheduleHintClear();
      },
      onPhysicalPrompt: () => {
        const piece = getNextHintPieceRef.current();
        if (!piece) return;
        setHintPieceId(piece.id);
        setHintSlotIndex(piece.originalPos);
        window.setTimeout(() => {
          placePieceIfCorrectRef.current?.(piece.id, piece.originalPos, true);
        }, 700);
      },
    });

    return () => {
      registerAssistantActions({});
      clearHintTimers();
    };
  }, [clearHintTimers, helpVoiceEnabled, registerAssistantActions, scheduleHintClear, speak]);

  const handleDragStart = ({ active }) => {
    const pieceId = active.data.current?.pieceId;
    setActivePieceId(typeof pieceId === 'number' ? pieceId : null);
  };

  const handleDragEnd = ({ active, over }) => {
    const pieceId = active.data.current?.pieceId;
    const slotIndex = over?.data.current?.slotIndex;
    setActivePieceId(null);

    if (typeof pieceId !== 'number' || typeof slotIndex !== 'number') return;
    placePieceIfCorrect(pieceId, slotIndex);
  };

  const boardSizeClass = 'w-[min(82vw,400px)] md:w-[400px]';
  const trayColumns = gridSize === 4 ? 'grid-cols-2 md:grid-cols-2 xl:grid-cols-4' : 'grid-cols-2 md:grid-cols-2 xl:grid-cols-3';
  const pieceSize = gridSize === 4 ? 'clamp(3.1rem, 9vw, 4.45rem)' : 'clamp(3.7rem, 10.5vw, 5.25rem)';

  return (
    <div dir="rtl" className="mx-auto flex h-full w-full flex-col items-center gap-4 px-3 pb-6 sm:px-4 md:gap-5">
      <GameHeader
        instruction={instructionAr}
        instructionAudio={instructionAudio}
        onPlayAudio={playInstruction}
        onRestart={startGame}
      />

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActivePieceId(null)}>
        <div className="flex w-full max-w-5xl flex-col items-center justify-center gap-4 md:flex-row md:items-start md:gap-6 xl:flex-col xl:items-center" dir="ltr">
          <section className="order-1 flex flex-col items-center gap-3" dir="rtl">
            <div className={`relative ${boardSizeClass} aspect-square rounded-[2rem] border-[10px] border-white bg-white p-2 shadow-[0_24px_52px_-34px_rgba(15,23,42,0.45)]`}>
              <div className="absolute inset-2 overflow-hidden rounded-[1.45rem] bg-slate-50">
                <BoardReferenceImage imageSrc={imageSrc} gridSize={gridSize} className="h-full w-full" opacity={0.2} />
              </div>

              <div
                dir="ltr"
                className="relative z-10 grid h-full w-full overflow-visible rounded-[1.45rem]"
                style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))` }}
              >
                {placedPieces.map((_, index) => (
                  <BoardSlot key={index} index={index} isHinted={hintSlotIndex === index} isCorrectFlash={successSlotIndex === index} />
                ))}
              </div>

              <div className="pointer-events-none absolute inset-2 z-20 overflow-visible rounded-[1.45rem]">
                <BoardPlacedLayer
                  placedPieces={placedPieces}
                  pieceById={pieceById}
                  imageSrc={imageSrc}
                  gridSize={gridSize}
                  successSlotIndex={successSlotIndex}
                />
              </div>

              {completed && (
                <div className="absolute inset-0 z-30 flex items-center justify-center rounded-[2rem] bg-white/62 backdrop-blur-[2px]">
                  <div className="rounded-[2rem] bg-white px-8 py-5 text-center shadow-[0_22px_44px_-28px_rgba(15,23,42,0.5)] ring-1 ring-emerald-100">
                    <Sparkles className="mx-auto mb-2 h-9 w-9 text-amber-400" />
                    <p className="text-3xl font-black text-emerald-600">أحسنت!</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="order-2 w-full max-w-[min(92vw,380px)] rounded-[2rem] border-2 border-dashed border-sky-100 bg-white/88 p-4 shadow-[0_24px_52px_-38px_rgba(15,23,42,0.42)] xl:max-w-[44rem]" dir="rtl">
            <div className={`grid ${trayColumns} justify-items-center gap-2.5`} dir="ltr">
              {remainingPieces.length === 0 && !completed ? (
                <p className="col-span-full py-6 text-center text-sm font-bold text-slate-400">كل القطع على اللوحة</p>
              ) : (
                remainingPieces.map((piece) => (
                  <DraggablePiece
                    key={piece.id}
                    piece={piece}
                    imageSrc={imageSrc}
                    gridSize={gridSize}
                    pieceSize={pieceSize}
                    isHinted={hintPieceId === piece.id}
                    isWrong={wrongPieceId === piece.id}
                  />
                ))
              )}
            </div>
          </aside>
        </div>
        <DragOverlay dropAnimation={null}>
          {activePiece ? <PuzzlePiece piece={activePiece} imageSrc={imageSrc} gridSize={gridSize} size={pieceSize} isActive /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}


