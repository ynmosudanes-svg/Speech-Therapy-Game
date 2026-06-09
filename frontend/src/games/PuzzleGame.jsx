import React, { useState, useEffect } from 'react';
import { Play, RefreshCw, Trophy, CheckCircle2, Hand, Image as ImageIcon } from 'lucide-react';

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
  registerAssistantActions 
}) {
  // --- إعدادات اللعبة القادمة من السيرفر ---
  const config = game?.config || {};
  const imageSrc = config.image || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop';
  const gridSize = Number(config.gridSize) || 3;

  // --- حالة اللعبة ---
  const [gameState, setGameState] = useState('playing');
  const [trayPieces, setTrayPieces] = useState([]);
  const [boardPieces, setBoardPieces] = useState([]);
  const [selectedPieceId, setSelectedPieceId] = useState(null);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState(null);
  
  // --- Assistant Hint States ---
  const [hintPieceId, setHintPieceId] = useState(null);
  const [hintSlotIndex, setHintSlotIndex] = useState(null);

  // Register Assistant Actions
  useEffect(() => {
    if (registerAssistantActions) {
      registerAssistantActions({
        onVisualHint: () => {
          // Level 1: Only highlight the piece in the tray, NOT the destination slot
          const unplaced = trayPieces[0];
          if (unplaced) {
            setHintPieceId(unplaced.id);
            setHintSlotIndex(null); // No slot hint yet!
            setTimeout(() => {
              setHintPieceId(null);
            }, 3000);
          }
        },
        onGestureHint: () => {
          // Level 2: Highlight BOTH the piece and its destination slot
          const unplaced = trayPieces[0];
          if (unplaced) {
            setHintPieceId(unplaced.id);
            setHintSlotIndex(unplaced.originalPos);
            setTimeout(() => {
              setHintPieceId(null);
              setHintSlotIndex(null);
            }, 4000);
          }
        },
        onVerbalHint: () => {
          // Level 3: Verbal hint (assistant speaks), but we also keep the gesture hint active
          const unplaced = trayPieces[0];
          if (unplaced) {
            setHintPieceId(unplaced.id);
            setHintSlotIndex(unplaced.originalPos);
            setTimeout(() => {
              setHintPieceId(null);
              setHintSlotIndex(null);
            }, 4000);
          }
        },
        onPhysicalPrompt: () => {
          // Level 4: Auto solve one piece
          const unplaced = trayPieces[0];
          if (unplaced) {
            movePieceToBoard(unplaced.id, unplaced.originalPos);
          }
        }
      });
    }
  }, [registerAssistantActions, trayPieces]);

  useEffect(() => {
    startGame();
  }, [game?.id, gridSize, imageSrc]);

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

    setTrayPieces([...initialPieces].sort(() => Math.random() - 0.5));
    setBoardPieces(Array(totalPieces).fill(null));
    setSelectedPieceId(null);
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
        attempts: moves,
        timeSpent,
        prompts: []
      });
    }
  };

  const movePieceToBoard = (pieceId, targetSlotIndex) => {
    let piece = trayPieces.find(p => p.id === pieceId) || boardPieces.find(p => p && p.id === pieceId);
    if (!piece) return;

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
    const currentMoves = moves + 1;
    setMoves(currentMoves);
    onAssistantInteraction?.();

    if (newBoard.every((p, i) => p && p.originalPos === i)) {
      handleWin();
    }
  };

  const returnPieceToTray = (pieceId) => {
    const slotIndex = boardPieces.findIndex(p => p && p.id === pieceId);
    if (slotIndex === -1) return;
    
    const piece = boardPieces[slotIndex];
    if (piece.originalPos === slotIndex) return; 

    const newBoard = [...boardPieces];
    newBoard[slotIndex] = null;

    setBoardPieces(newBoard);
    setTrayPieces([...trayPieces, piece]);
    setSelectedPieceId(null);
    onAssistantInteraction?.();
  };

  const handleDragStart = (e, pieceId) => {
    e.dataTransfer.setData('pieceId', pieceId);
    setSelectedPieceId(pieceId);
  };

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
    
    const imgWidth = (gridSize / 1.4) * 100;
    const imgLeft = -((originalCol - 0.2) / 1.4) * 100;
    const imgTop = -((originalRow - 0.2) / 1.4) * 100;

    const isSelected = selectedPieceId === piece.id;
    const isCorrect = isPlacedOnBoard && piece.originalPos === slotIndex;

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
        className={`relative w-full aspect-square transition-all duration-300 ease-in-out ${!isCorrect && 'cursor-grab active:cursor-grabbing hover:z-50'} ${(isSelected || hintPieceId === piece.id) ? 'z-50' : 'z-10'}`}
      >
        <div
          className={`absolute transition-all duration-300 ${hintPieceId === piece.id ? 'animate-pulse' : ''}`}
          style={{
            width: '140%',
            height: '140%',
            top: '-20%',
            left: '-20%',
            filter: hintPieceId === piece.id 
              ? 'drop-shadow(0 0 15px rgba(74,222,128,1)) brightness(1.2)' 
              : (isCorrect ? 'none' : (isSelected ? 'drop-shadow(0 0 12px rgba(6, 182, 212, 1))' : 'drop-shadow(2px 4px 6px rgba(0,0,0,0.4))')),
            transform: (isSelected || hintPieceId === piece.id) ? 'scale(1.15)' : 'scale(1)',
          }}
        >
          <div className="w-full h-full absolute" style={{ clipPath: `url(#piece-${piece.id})`, WebkitClipPath: `url(#piece-${piece.id})` }}>
            <img
              src={imageSrc}
              alt="piece"
              className="absolute max-w-none pointer-events-none"
              style={{ width: `${imgWidth}%`, height: `${imgWidth}%`, left: `${imgLeft}%`, top: `${imgTop}%` }}
            />
          </div>
        </div>
        {isCorrect && gameState === 'playing' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/95 rounded-full text-emerald-500 shadow-lg pointer-events-none z-50 animate-bounce-short p-1">
            <CheckCircle2 size={24} strokeWidth={3} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div dir="rtl" className="w-full flex flex-col items-center animate-fade-in space-y-6 h-full pb-10">
      
      <div className="w-full flex items-center justify-between bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex gap-2">
          <button onClick={startGame} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg" title="إعادة اللعب"><RefreshCw size={22} /></button>
        </div>
        {gameState === 'won' ? (
          <div className="flex items-center text-emerald-600 font-bold bg-emerald-50 px-4 py-1.5 rounded-lg gap-2 animate-bounce-short">
            <Trophy size={20} /> ممتاز!
          </div>
        ) : (
           <div className="text-center bg-slate-50 px-4 py-1.5 rounded-lg">
            <span className="text-xs font-bold text-slate-400 ml-2">الحركات:</span>
            <span className="text-lg font-black text-slate-700">{moves}</span>
          </div>
        )}
      </div>

      <div className="w-full max-w-[500px] bg-white p-3 rounded-[2rem] shadow-lg border border-slate-200">
        <div 
          dir="ltr"
          className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-inner border-2 border-slate-100 bg-slate-50"
        >
          <svg width="0" height="0" className="absolute pointer-events-none">
            <defs>
              {[...trayPieces, ...boardPieces.filter(Boolean)].map(p => (
                <clipPath id={`piece-${p.id}`} clipPathUnits="objectBoundingBox" key={p.id}><path d={p.path} /></clipPath>
              ))}
            </defs>
          </svg>

          {gameState !== 'won' && (
            <img src={imageSrc} className="absolute inset-0 w-full h-full blur-[5px] opacity-40" alt="Hint" />
          )}

          <div 
            className="absolute inset-0 grid"
            style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)`, gridTemplateRows: `repeat(${gridSize}, 1fr)` }}
          >
            {boardPieces.map((piece, index) => (
              <div 
                key={index}
                className={`relative w-full h-full border-[0.5px] transition-all duration-300
                  ${selectedPieceId !== null && !piece 
                    ? 'bg-white/30 border-yellow-400 border-2 border-dashed shadow-[inset_0_0_15px_rgba(250,204,21,0.6)] animate-pulse z-10 cursor-pointer backdrop-brightness-110' 
                    : (hintSlotIndex === index && !piece ? 'bg-green-400/40 border-green-400 border-4 animate-pulse shadow-[inset_0_0_30px_rgba(74,222,128,0.8)] z-20' : 'border-white/20')
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
          
          {gameState === 'won' && (
            <img src={imageSrc} className="absolute inset-0 w-full h-full animate-fade-in" alt="Won" />
          )}
        </div>
      </div>

      {gameState === 'playing' && (
        <div 
          className="w-full bg-white p-6 rounded-3xl shadow-md border-2 border-dashed border-slate-200 min-h-[180px]"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropOnTray}
        >
          <div className="flex items-center justify-center gap-2 mb-4 text-slate-500">
            <Hand size={18} />
            <p className="text-sm font-semibold">اسحب القطع من هنا وركبها في اللوحة</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {trayPieces.length === 0 ? (
              <p className="text-slate-400 text-sm mt-4">تم استخدام كل القطع!</p>
            ) : (
              trayPieces.map(piece => (
                <div key={piece.id} className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0">
                  {renderPiece(piece, false)}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .animate-fade-in { animation: fadeIn 0.5s ease-out; }
        .animate-bounce-short { animation: bounceShort 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes bounceShort { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; } 50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; } }
      `}} />
    </div>
  );
}
