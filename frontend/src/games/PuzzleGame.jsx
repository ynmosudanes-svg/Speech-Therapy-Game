import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RefreshCw, Trophy, CheckCircle2, Hand, Image as ImageIcon } from 'lucide-react';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import { playAudioUrl } from '../utils/soundEffects';
import GameHeader from '../components/game/GameHeader';

// ==========================================
// خوارزمية رسم مسارات البازل (Jigsaw Shapes)
// ==========================================
const generatePiecePath = (row, col, gridSize, joints) => {
  let d = `M 20 20 `;

  if (row === 0) d += `L 120 20 `; 
  else {
    const joint = joints.bottom[row - 1][col];
    if (joint === 1) d += `L 60 20 C 50 20, 50 40, 70 40 C 90 40, 90 20, 80 20 L 120 20 `; 
    else d += `L 60 20 C 50 20, 50 0, 70 0 C 90 0, 90 20, 80 20 L 120 20 `; 
  }

  if (col === gridSize - 1) d += `L 120 120 `; 
  else {
    const joint = joints.right[row][col];
    if (joint === 1) d += `L 120 60 C 120 50, 140 50, 140 70 C 140 90, 120 90, 120 80 L 120 120 `; 
    else d += `L 120 60 C 120 50, 100 50, 100 70 C 100 90, 120 90, 120 80 L 120 120 `; 
  }

  if (row === gridSize - 1) d += `L 20 120 `; 
  else {
    const joint = joints.bottom[row][col];
    if (joint === 1) d += `L 80 120 C 90 120, 90 140, 70 140 C 50 140, 50 120, 60 120 L 20 120 `; 
    else d += `L 80 120 C 90 120, 90 100, 70 100 C 50 100, 50 120, 60 120 L 20 120 `; 
  }

  if (col === 0) d += `L 20 20 `; 
  else {
    const joint = joints.right[row][col - 1]; 
    if (joint === 1) d += `L 20 80 C 20 90, 40 90, 40 70 C 40 50, 20 50, 20 60 L 20 20 `; 
    else d += `L 20 80 C 20 90, 0 90, 0 70 C 0 50, 20 50, 20 60 L 20 20 `; 
  }

  d += `Z`;
  return d.replace(/\d+(\.\d+)?/g, (match) => (parseFloat(match) / 140).toFixed(5));
};

export default function PuzzleGame({ 
  game, 
  onComplete, 
  previewMode,
  onAssistantInteraction,
  registerAssistantActions,
  helpVoiceEnabled = false,
}) {
  // --- إعدادات اللعبة القادمة من السيرفر ---
  const config = game?.config || {};
  const imageSrc = config.image || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop';
  const gridSize = Number(config.gridSize) || 3;
  const puzzleMode = config.puzzleMode || 'jigsaw';
  const instructionAr = config.instructionAr || 'قم بتركيب قطع البازل لتكوين الصورة الصحيحة';
  const instructionAudio = config.instructionAudio || '';

  const { speak } = useSpeechSynthesis();

  const playInstruction = () => {
    if (instructionAudio) {
      playAudioUrl(instructionAudio);
    }
  };

  // --- حالة اللعبة ---
  const [gameState, setGameState] = useState('playing');
  const [trayPieces, setTrayPieces] = useState([]);
  const [boardPieces, setBoardPieces] = useState([]);
  const [selectedPieceId, setSelectedPieceId] = useState(null);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [missingSlotIndex, setMissingSlotIndex] = useState(null);
  const [wrongPieceId, setWrongPieceId] = useState(null);
  const [snappedPieceId, setSnappedPieceId] = useState(null);
  const [boardSize, setBoardSize] = useState(0);
  
  // --- Assistant Hint States ---
  const [hintPieceId, setHintPieceId] = useState(null);
  const [hintSlotIndex, setHintSlotIndex] = useState(null);
  const [gestureHint, setGestureHint] = useState(false);

  const boardRef = useRef(null);
  const hintTimersRef = useRef([]);

  useEffect(() => {
    if (!boardRef.current || typeof ResizeObserver === 'undefined') return undefined;

    const resizeObserver = new ResizeObserver(([entry]) => {
      setBoardSize(entry.contentRect.width);
    });

    resizeObserver.observe(boardRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const clearHintTimers = () => {
    hintTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    hintTimersRef.current = [];
  };

  const clearHints = () => {
    clearHintTimers();
    setHintPieceId(null);
    setHintSlotIndex(null);
    setGestureHint(false);
  };

  const scheduleHintClear = (delay = 3000) => {
    clearHintTimers();
    const timer = window.setTimeout(() => clearHints(), delay);
    hintTimersRef.current.push(timer);
  };

  const getNextHintPiece = useCallback(() => {
    if (puzzleMode === 'missing-piece' && missingSlotIndex !== null) {
      return trayPieces.find((piece) => piece.originalPos === missingSlotIndex) || null;
    }

    if (trayPieces.length > 0) {
      return trayPieces[0];
    }

    const misplacedIndex = boardPieces.findIndex((piece, index) => piece && piece.originalPos !== index);
    if (misplacedIndex !== -1) {
      return boardPieces[misplacedIndex];
    }

    return null;
  }, [trayPieces, boardPieces, puzzleMode, missingSlotIndex]);

  const getNextHintPieceRef = useRef(getNextHintPiece);
  getNextHintPieceRef.current = getNextHintPiece;

  useEffect(() => {
    startGame();
  }, [game?.id, gridSize, imageSrc, puzzleMode]);

  const startGame = () => {
    const newJoints = { right: [], bottom: [] };
    for (let r = 0; r < gridSize; r++) {
      newJoints.right[r] = [];
      newJoints.bottom[r] = [];
      for (let c = 0; c < gridSize; c++) {
        newJoints.right[r][c] = Math.random() > 0.5 ? 1 : -1;
        newJoints.bottom[r][c] = Math.random() > 0.5 ? 1 : -1;
      }
    }

    const totalPieces = gridSize * gridSize;
    let initialPieces = [];
    
    for (let i = 0; i < totalPieces; i++) {
      const r = Math.floor(i / gridSize);
      const c = i % gridSize;
      initialPieces.push({
        id: i,
        originalPos: i,
        path: generatePiecePath(r, c, gridSize, newJoints)
      });
    }

    if (puzzleMode === 'missing-piece') {
      const randomMissingIndex = Math.floor(Math.random() * totalPieces);
      const correctPiece = initialPieces[randomMissingIndex];
      const distractors = [...initialPieces]
        .filter((piece) => piece.id !== correctPiece.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(2, totalPieces - 1));

      setMissingSlotIndex(randomMissingIndex);
      setBoardPieces(initialPieces.map((piece, index) => (index === randomMissingIndex ? null : piece)));
      setTrayPieces([correctPiece, ...distractors].sort(() => Math.random() - 0.5));
    } else {
      setMissingSlotIndex(null);
      setTrayPieces([...initialPieces].sort(() => Math.random() - 0.5));
      setBoardPieces(Array(totalPieces).fill(null));
    }
    setSelectedPieceId(null);
    setWrongPieceId(null);
    setSnappedPieceId(null);
    setMoves(0);
    setGameState('playing');
    setStartTime(Date.now());
  };

  const handleWin = () => {
    setGameState('won');
    if (onComplete && !previewMode) {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      onComplete({
        correctAnswers: 1,
        wrongAnswers: 0,
        attempts: [Math.max(moves, 1)],
        timeSpent,
        prompts: []
      });
    }
  };

  const movePieceToBoard = useCallback((pieceId, targetSlotIndex, fromAssistant = false) => {
    let piece = trayPieces.find(p => p.id === pieceId) || boardPieces.find(p => p && p.id === pieceId);
    if (!piece) return;

    if (puzzleMode === 'missing-piece') {
      if (targetSlotIndex !== missingSlotIndex) return;

      const currentMoves = moves + 1;
      setMoves(currentMoves);
      clearHints();
      if (!fromAssistant) {
        onAssistantInteraction?.();
      }

      if (piece.originalPos !== missingSlotIndex) {
        setWrongPieceId(piece.id);
        window.setTimeout(() => setWrongPieceId(null), 900);
        setSelectedPieceId(null);
        return;
      }

      const newBoard = [...boardPieces];
      newBoard[targetSlotIndex] = piece;
      setBoardPieces(newBoard);
      setTrayPieces([]);
      setSelectedPieceId(null);
      setSnappedPieceId(piece.id);
      window.setTimeout(() => setSnappedPieceId(null), 280);
      handleWin();
      return;
    }

    const currentBoardIndex = boardPieces.findIndex(p => p && p.id === pieceId);
    if (currentBoardIndex !== -1 && piece.originalPos === currentBoardIndex) return;

    const newBoard = [...boardPieces];
    const newTray = trayPieces.filter(p => p.id !== pieceId);

    if (currentBoardIndex !== -1) {
      newBoard[currentBoardIndex] = null;
    }

    if (newBoard[targetSlotIndex] !== null) {
      if (newBoard[targetSlotIndex].originalPos !== targetSlotIndex) {
        newTray.push(newBoard[targetSlotIndex]);
      } else {
        return; 
      }
    }

    newBoard[targetSlotIndex] = piece;

    setBoardPieces(newBoard);
    setTrayPieces(newTray);
    setSelectedPieceId(null);
    if (piece.originalPos === targetSlotIndex) {
      setSnappedPieceId(piece.id);
      window.setTimeout(() => setSnappedPieceId(null), 280);
    }
    const currentMoves = moves + 1;
    setMoves(currentMoves);
    clearHints();
    if (!fromAssistant) {
      onAssistantInteraction?.();
    }

    if (newBoard.every((p, i) => p && p.originalPos === i)) {
      handleWin();
    }
  }, [boardPieces, trayPieces, moves, onAssistantInteraction, puzzleMode, missingSlotIndex]);

  const movePieceToBoardRef = useRef(movePieceToBoard);
  movePieceToBoardRef.current = movePieceToBoard;

  useEffect(() => {
    if (!registerAssistantActions) return undefined;

    registerAssistantActions({
      onVisualHint: () => {
        const piece = getNextHintPieceRef.current();
        if (!piece) return;
        setHintPieceId(piece.id);
        setHintSlotIndex(null);
        setGestureHint(false);
        scheduleHintClear(3000);
      },
      onGestureHint: () => {
        const piece = getNextHintPieceRef.current();
        if (!piece) return;
        setHintPieceId(piece.id);
        setHintSlotIndex(piece.originalPos);
        setGestureHint(true);
        scheduleHintClear(4000);
      },
      onVerbalHint: () => {
        const piece = getNextHintPieceRef.current();
        if (!piece) return;
        setHintPieceId(piece.id);
        setHintSlotIndex(piece.originalPos);
        setGestureHint(true);
        if (helpVoiceEnabled) {
          speak('شوف القطعة اللي بتلمع واركبها في المكان الأخضر على اللوحة.');
        }
        scheduleHintClear(4000);
      },
      onPhysicalPrompt: () => {
        const piece = getNextHintPieceRef.current();
        if (!piece) return;
        setHintPieceId(piece.id);
        setHintSlotIndex(piece.originalPos);
        if (helpVoiceEnabled) {
          speak('هيا نركّب القطعة سوا في مكانها الصح.');
        }
        window.setTimeout(() => {
          movePieceToBoardRef.current?.(piece.id, piece.originalPos, true);
        }, 800);
      },
    });

    return () => {
      registerAssistantActions({});
      clearHintTimers();
    };
  }, [helpVoiceEnabled, registerAssistantActions, speak]);

  const returnPieceToTray = (pieceId) => {
    if (puzzleMode === 'missing-piece') return;
    const slotIndex = boardPieces.findIndex(p => p && p.id === pieceId);
    if (slotIndex === -1) return;
    
    const piece = boardPieces[slotIndex];
    if (piece.originalPos === slotIndex) return; 

    const newBoard = [...boardPieces];
    newBoard[slotIndex] = null;

    setBoardPieces(newBoard);
    setTrayPieces([...trayPieces, piece]);
    setSelectedPieceId(null);
    clearHints();
    onAssistantInteraction?.();
  };

  const handleDragStart = (e, pieceId) => {
    e.dataTransfer.setData('pieceId', pieceId);
    setSelectedPieceId(pieceId);

    const boardRect = boardRef.current?.getBoundingClientRect();
    if (!boardRect?.width) return;

    const slotSize = boardRect.width / gridSize;
    const dragPreview = e.currentTarget.cloneNode(true);
    dragPreview.style.position = 'fixed';
    dragPreview.style.top = '-1000px';
    dragPreview.style.left = '-1000px';
    dragPreview.style.width = `${slotSize}px`;
    dragPreview.style.height = `${slotSize}px`;
    dragPreview.style.pointerEvents = 'none';
    dragPreview.style.zIndex = '-1';
    document.body.appendChild(dragPreview);
    e.dataTransfer.setDragImage(dragPreview, slotSize / 2, slotSize / 2);
    window.setTimeout(() => dragPreview.remove(), 0);
  };

  const boardSlotSize = boardSize ? boardSize / gridSize : 0;
  const trayPieceSize = boardSlotSize
    ? Math.max(36, Math.min(56, boardSlotSize * 0.3))
    : 44;

  const handleDropOnBoard = (e, slotIndex) => {
    e.preventDefault();
    const pieceId = parseInt(e.dataTransfer.getData('pieceId'));
    if (!isNaN(pieceId)) movePieceToBoard(pieceId, slotIndex);
  };

  const handleDropOnTray = (e) => {
    e.preventDefault();
    const pieceId = parseInt(e.dataTransfer.getData('pieceId'));
    if (!isNaN(pieceId)) returnPieceToTray(pieceId);
  };

  const renderPiece = (piece, isPlacedOnBoard = false, slotIndex = -1) => {
    const originalCol = piece.originalPos % gridSize;
    const originalRow = Math.floor(piece.originalPos / gridSize);
    const pieceScale = 1.4;
    const imageWidth = (gridSize * 100) / pieceScale;
    const imageLeft = ((0.2 - originalCol) * 100) / pieceScale;
    const imageTop = ((0.2 - originalRow) * 100) / pieceScale;

    const isSelected = selectedPieceId === piece.id;
    const isCorrect = isPlacedOnBoard && piece.originalPos === slotIndex;
    const isWrongCandidate = wrongPieceId === piece.id;
    const isSnapping = snappedPieceId === piece.id;

    return (
      <div
        draggable={!isCorrect}
        onDragStart={(e) => handleDragStart(e, piece.id)}
        onClick={(e) => {
          e.stopPropagation();
          if (isCorrect) return;
          if (isPlacedOnBoard && selectedPieceId === null) {
            returnPieceToTray(piece.id); 
          } else {
            setSelectedPieceId(isSelected ? null : piece.id); 
          }
        }}
        className={`relative h-full w-full ${!isCorrect ? 'cursor-grab active:cursor-grabbing' : ''} ${(isSelected || hintPieceId === piece.id) ? 'z-50 ring-4 ring-amber-400 rounded-lg' : 'z-10'} ${isWrongCandidate ? 'ring-4 ring-rose-400 rounded-lg' : ''}`}
      >
        <div
          className="absolute"
          style={{
            width: '140%',
            height: '140%',
            top: '-20%',
            left: '-20%',
            filter: isWrongCandidate
              ? 'drop-shadow(0 0 10px rgba(248,113,113,0.35))'
              : hintPieceId === piece.id 
              ? 'drop-shadow(0 0 10px rgba(74,222,128,0.4))' 
              : (isCorrect ? 'drop-shadow(0 8px 14px rgba(15,23,42,0.14))' : (isSelected ? 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.6))' : 'drop-shadow(0 8px 18px rgba(15,23,42,0.2))')),
            transform: isSnapping ? 'scale(1.035)' : 'scale(1)',
            transformOrigin: 'center',
            transition: isPlacedOnBoard ? 'transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1), filter 240ms ease' : 'filter 160ms ease',
          }}
        >
          <div className="absolute h-full w-full overflow-hidden" style={{ clipPath: `url(#piece-${piece.id})`, WebkitClipPath: `url(#piece-${piece.id})` }}>
            <img
              src={imageSrc}
              alt="piece"
              className="absolute max-w-none pointer-events-none"
              style={{
                width: `${imageWidth}%`,
                height: `${imageWidth}%`,
                left: `${imageLeft}%`,
                top: `${imageTop}%`,
                objectFit: 'cover',
                objectPosition: 'center',
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: isPlacedOnBoard
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03) 45%, rgba(15,23,42,0.04) 100%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.04) 45%, rgba(15,23,42,0.08) 100%)',
                mixBlendMode: 'soft-light',
                opacity: 0.9,
              }}
            />
          </div>
        </div>
        {isCorrect && gameState === 'playing' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/95 rounded-full text-emerald-500 shadow-lg pointer-events-none z-50 p-1">
            <CheckCircle2 size={24} strokeWidth={3} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div dir="rtl" className="mx-auto flex h-full w-full max-w-none flex-col items-center space-y-2.5 px-2 pb-4 sm:px-0 md:space-y-4 md:pb-7">
      
      {/* Header مع زر الصوت وإعادة اللعب */}
      <GameHeader
        instruction={instructionAr}
        instructionAudio={instructionAudio}
        onPlayAudio={playInstruction}
        onRestart={startGame}
      />


      <div className="w-full rounded-[1.1rem] border border-slate-200 bg-white p-1 shadow-md sm:rounded-[1.25rem] sm:p-1.5 md:rounded-[2rem] md:p-3" style={{ maxWidth: 'clamp(15.5rem, 72vw, 19rem)' }}>
        <div 
          ref={boardRef}
          dir="ltr"
          className="relative aspect-square w-full overflow-hidden rounded-[0.9rem] border-2 border-slate-100 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),rgba(241,245,249,0.92)_44%,rgba(226,232,240,0.95))] shadow-inner md:rounded-2xl"
        >
          <svg width="0" height="0" className="absolute pointer-events-none">
            <defs>
              {[...trayPieces, ...boardPieces.filter(Boolean)].map(p => (
                <clipPath id={`piece-${p.id}`} clipPathUnits="objectBoundingBox" key={p.id}><path d={p.path} /></clipPath>
              ))}
            </defs>
          </svg>

          {gameState !== 'won' && (
            <img
              src={imageSrc}
              className="absolute inset-0 h-full w-full object-fill pointer-events-none"
              style={{
                opacity: 0.34,
                mixBlendMode: 'multiply',
              }}
              alt="Hint"
            />
          )}

          <div 
            className="absolute inset-0 grid"
            style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)`, gridTemplateRows: `repeat(${gridSize}, 1fr)` }}
          >
            {boardPieces.map((piece, index) => (
              <div 
                key={index}
                className={`relative h-full w-full overflow-visible transition-colors duration-150
                  ${hintSlotIndex === index
                    ? 'z-20 bg-emerald-100/70 outline outline-2 outline-emerald-400 shadow-[inset_0_0_12px_rgba(74,222,128,0.3)] ring-2 ring-emerald-200'
                    : selectedPieceId !== null && !piece && (puzzleMode !== 'missing-piece' || index === missingSlotIndex)
                      ? 'z-10 cursor-pointer bg-white/20 outline outline-2 outline-dashed outline-yellow-400 shadow-[inset_0_0_10px_rgba(250,204,21,0.28)]'
                      : 'bg-transparent outline outline-[0.5px] outline-white/35 shadow-[inset_0_1px_3px_rgba(255,255,255,0.35),inset_0_-1px_2px_rgba(15,23,42,0.035)]'
                  }
                `}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDropOnBoard(e, index)}
                onClick={() => {
                  if (selectedPieceId !== null) movePieceToBoard(selectedPieceId, index);
                }}
              >
                {piece && renderPiece(piece, true, index)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {gameState === 'playing' && (
        <div 
          className="w-full min-h-[104px] rounded-[1.35rem] border-2 border-dashed border-slate-200 bg-white p-3 shadow-sm sm:min-h-[116px] sm:p-3.5 md:min-h-[148px] md:rounded-3xl md:p-5"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropOnTray}
        >
          <div className="mb-2.5 flex items-center justify-center gap-2 text-slate-500 md:mb-4">
            <Hand size={16} />
            <p className="text-xs font-semibold sm:text-sm">اسحب القطع من هنا وركبها في اللوحة</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 md:gap-4">
            {trayPieces.length === 0 ? (
              <p className="text-slate-400 text-sm mt-4">تم استخدام كل القطع!</p>
            ) : (
              trayPieces.map(piece => (
                <div
                  key={piece.id}
                  className={`relative flex-shrink-0 rounded-lg bg-white/70 shadow-[0_10px_18px_-14px_rgba(15,23,42,0.45)] ring-1 ring-white/80 sm:rounded-xl ${
                    hintPieceId === piece.id
                      ? 'ring-4 ring-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.35)] z-20'
                      : ''
                  }`}
                  style={{
                    width: `${trayPieceSize}px`,
                    height: `${trayPieceSize}px`,
                  }}
                >
                  {hintPieceId === piece.id && gestureHint && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-2xl pointer-events-none z-30 animate-none">
                      👆
                    </span>
                  )}
                  {renderPiece(piece, false)}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .animate-fade-in { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}} />
    </div>
  );
}

