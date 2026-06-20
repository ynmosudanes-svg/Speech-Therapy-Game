import React, { useEffect, useMemo, useState } from 'react';
import FeedbackModal from '../components/FeedbackModal';
import GameHeader from '../components/game/GameHeader';
import {
  GAME_ASSISTANT_HINT_CLASS,
  GameChoice,
  GameContainer,
  GameSection,
} from '../components/game/GameUI';
import BirdHint from '../components/game/BirdHint';
import { playAudioUrl } from '../utils/soundEffects';
import ChildGameBackdrop from './ChildGameBackdrop';
import {
  CHILD_GAME_BOARD_MAX_WIDTH,
  CHILD_GAME_SHELL_CLASS,
  getChildBoardWidth,
} from './childGameLayout';

const shuffleArray = (items) => {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
};

const cropImageToDataUrl = (image, sx, sy, sw, sh) => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sw));
  canvas.height = Math.max(1, Math.round(sh));
  const context = canvas.getContext('2d');
  if (!context) return '';
  context.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
};

const normalizeOptionTiles = (options = []) =>
  (Array.isArray(options) ? options : [])
    .filter((option) => option?.image?.trim())
    .map((option, index) => ({
      id: option.id || `manual_${index}`,
      image: option.image.trim(),
      textAr: option.textAr || '',
    }));

const ImageCompletePartGame = ({
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
  const content = config?.content || config || {};
  const instructionAr =
    content.instructionAr ||
    game?.questionTextAr ||
    'اختر الجزء الناقص لإكمال الصورة';
  const questionAudio = content.questionAudio || game?.questionAudio || '';
  const image = content.image || '';
  const manualOptions = useMemo(() => normalizeOptionTiles(content.options), [content.options]);
  const puzzleGridSize = Math.max(2, Math.min(4, Number(content.gridSize || 0)));
  const gridRows = Math.max(
    2,
    Math.min(4, Number(content.gridRows || (content.puzzleMode === 'missing-piece' ? puzzleGridSize : 2))),
  );
  const gridCols = Math.max(
    2,
    Math.min(4, Number(content.gridCols || (content.puzzleMode === 'missing-piece' ? puzzleGridSize : 2))),
  );
  const missingPartCount = Math.max(
    1,
    Math.min(2, Number(content.missingPartCount || (content.puzzleMode === 'missing-piece' ? 1 : 1))),
  );
  const configuredMissingCellIds = useMemo(
    () => (Array.isArray(content.missingCellIds) ? content.missingCellIds.map((id) => String(id)) : ['0']),
    [content.missingCellIds],
  );
  const distractorCount = Math.max(1, Math.min(4, Number(content.distractorCount || 3)));

  const [sourceAspectRatio, setSourceAspectRatio] = useState(1);
  const [filledCells, setFilledCells] = useState({});
  const [boardTiles, setBoardTiles] = useState([]);
  const [activeCellId, setActiveCellId] = useState(null);
  const [optionTiles, setOptionTiles] = useState([]);
  const [draggedTileId, setDraggedTileId] = useState(null);
  const [dropTargetCellId, setDropTargetCellId] = useState(null);
  const [hintedTileId, setHintedTileId] = useState(null);
  const [gestureHintTileId, setGestureHintTileId] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());

  const totalCells = gridRows * gridCols;
  const missingCellIds = configuredMissingCellIds
    .slice(0, missingPartCount)
    .filter((id) => Number(id) < totalCells);
  const avatarState = showFeedback ? (isCorrect ? 'celebration' : 'error') : 'learning';

  useEffect(() => {
    setFilledCells({});
    setActiveCellId(missingCellIds[0] || null);
    setDraggedTileId(null);
    setDropTargetCellId(null);
    setHintedTileId(null);
    setGestureHintTileId(null);
    setShowFeedback(false);
    setIsCorrect(false);
    setAttempts(0);
  }, [game?.id, gridRows, gridCols, missingPartCount, configuredMissingCellIds.join(',')]);

  useEffect(() => {
    if (!questionAudio || previewMode) return;
    playAudioUrl(questionAudio);
  }, [previewMode, questionAudio]);

  useEffect(() => {
    if (!image || typeof window === 'undefined') {
      setBoardTiles([]);
      setOptionTiles([]);
      setSourceAspectRatio(1);
      return undefined;
    }

    let cancelled = false;
    const sourceImage = new window.Image();
    sourceImage.crossOrigin = 'anonymous';

    sourceImage.onload = () => {
      if (cancelled) return;

      setSourceAspectRatio(
        sourceImage.naturalWidth > 0 && sourceImage.naturalHeight > 0
          ? sourceImage.naturalWidth / sourceImage.naturalHeight
          : 1,
      );

      const cellWidth = sourceImage.naturalWidth / gridCols;
      const cellHeight = sourceImage.naturalHeight / gridRows;
      const tiles = Array.from({ length: totalCells }, (_, index) => {
        const row = Math.floor(index / gridCols);
        const col = index % gridCols;
        return {
          id: String(index),
          row,
          col,
          image: cropImageToDataUrl(
            sourceImage,
            col * cellWidth,
            row * cellHeight,
            cellWidth,
            cellHeight,
          ),
        };
      });

      setBoardTiles(tiles);

      const missingSet = new Set(missingCellIds);
      const correctTiles = tiles.filter((tile) => missingSet.has(tile.id));
      const generatedDistractors = shuffleArray(
        tiles.filter((tile) => !missingSet.has(tile.id)),
      ).slice(0, distractorCount);

      const nextOptions = manualOptions.length ? manualOptions : generatedDistractors;
      setOptionTiles(shuffleArray([...correctTiles, ...nextOptions]));
    };

    sourceImage.onerror = () => {
      if (!cancelled) {
        setBoardTiles([]);
        setOptionTiles([]);
        setSourceAspectRatio(1);
      }
    };

    sourceImage.src = image;

    return () => {
      cancelled = true;
    };
  }, [distractorCount, gridCols, gridRows, image, manualOptions, missingCellIds.join(','), totalCells]);

  useEffect(() => {
    if (!registerAssistantActions) return undefined;

    const showMissingPieceHint = ({ gesture = false } = {}) => {
      const firstOpenCell = missingCellIds.find((id) => !filledCells[id]);
      if (!firstOpenCell) return;

      setActiveCellId(firstOpenCell);
      setHintedTileId(firstOpenCell);
      setGestureHintTileId(gesture ? firstOpenCell : null);
    };

    registerAssistantActions({
      onVisualHint: () => {
        showMissingPieceHint();
      },
      onGestureHint: () => {
        showMissingPieceHint({ gesture: true });
      },
      onVerbalHint: () => {
        if (helpVoiceEnabled) {
          const utterance = new SpeechSynthesisUtterance('اختر الجزء الصحيح لإكمال الصورة.');
          utterance.lang = 'ar-SA';
          window.speechSynthesis.speak(utterance);
        }
      },
      onPhysicalPrompt: () => {
        setFilledCells(
          missingCellIds.reduce((accumulator, id) => {
            accumulator[id] = id;
            return accumulator;
          }, {}),
        );
      },
    });

    return () => registerAssistantActions({});
  }, [filledCells, helpVoiceEnabled, missingCellIds, registerAssistantActions]);

  const boardAspectRatio = useMemo(() => {
    if (!Number.isFinite(sourceAspectRatio) || sourceAspectRatio <= 0) return '1 / 1';
    return `${sourceAspectRatio} / 1`;
  }, [sourceAspectRatio]);

  const tileAspectRatio = useMemo(() => {
    const ratio = sourceAspectRatio * (gridRows / gridCols);
    if (!Number.isFinite(ratio) || ratio <= 0) return '1 / 1';
    const clampedRatio = Math.max(0.78, Math.min(1.18, ratio));
    return `${clampedRatio} / 1`;
  }, [gridCols, gridRows, sourceAspectRatio]);

  const boardWidth = useMemo(() => {
    const ratio = Number.isFinite(sourceAspectRatio) && sourceAspectRatio > 0 ? sourceAspectRatio : 1;
    return getChildBoardWidth(ratio, { base: 164, min: 132, max: CHILD_GAME_BOARD_MAX_WIDTH });
  }, [sourceAspectRatio]);

  const handleCellSelect = (cellId) => {
    if (!missingCellIds.includes(cellId) || filledCells[cellId]) return;
    onAssistantInteraction?.();
    setActiveCellId(cellId);
    setHintedTileId(null);
    setGestureHintTileId(null);
  };

  const handleTileDragStart = (event, tile) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', tile.id);
    setDraggedTileId(tile.id);
    setDropTargetCellId(null);
    setHintedTileId(null);
    setGestureHintTileId(null);
  };

  const handleTileDragEnd = () => {
    setDraggedTileId(null);
    setDropTargetCellId(null);
  };

  const handleCellDragOver = (event, cellId) => {
    if (!missingCellIds.includes(cellId) || filledCells[cellId]) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropTargetCellId(cellId);
  };

  const handleCellDragLeave = (cellId) => {
    if (dropTargetCellId === cellId) {
      setDropTargetCellId(null);
    }
  };

  const handleCellDrop = (event, cellId) => {
    event.preventDefault();
    event.stopPropagation();
    const tileId = event.dataTransfer.getData('text/plain');
    const tile = optionTiles.find((candidate) => candidate.id === tileId);
    setDropTargetCellId(null);
    if (tile) {
      handleOptionSelect(tile, cellId);
    }
  };

  const handleOptionSelect = (
    tile,
    targetCellId = activeCellId || missingCellIds.find((id) => !filledCells[id]) || null,
  ) => {
    if (!targetCellId) return;

    onAssistantInteraction?.();
    setHintedTileId(null);
    setGestureHintTileId(null);
    setAttempts((current) => current + 1);

    if (tile.id !== targetCellId) {
      setIsCorrect(false);
      setShowFeedback(true);
      return;
    }

    const nextFilledCells = { ...filledCells, [targetCellId]: tile.id };
    setFilledCells(nextFilledCells);
    const nextOpenCell = missingCellIds.find((id) => !nextFilledCells[id]) || null;
    setActiveCellId(nextOpenCell);

    if (nextOpenCell) return;

    setIsCorrect(true);
    setShowFeedback(true);
  };

  const handleRestart = () => {
    setFilledCells({});
    setActiveCellId(missingCellIds[0] || null);
    setDraggedTileId(null);
    setDropTargetCellId(null);
    setHintedTileId(null);
    setGestureHintTileId(null);
    setShowFeedback(false);
    setIsCorrect(false);
    setAttempts(0);
  };

  const handleNext = () => {
    setShowFeedback(false);
    if (!isCorrect) return;
    if (previewMode) return;

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    onComplete({
      correctAnswers: 1,
      wrongAnswers: Math.max(attempts - 1, 0),
      attempts: [Math.max(attempts, 1)],
      prompts: [therapistControlsEnabled ? therapistPromptLevel : 'none'],
      timeSpent,
      isCorrect: true,
    });
  };

  if (!image) {
    return (
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-[#dbe7f3] bg-white p-8 text-center font-black text-slate-600">
        أضف صورة اللعبة أولاً.
      </div>
    );
  }

  return (
    <GameContainer className={CHILD_GAME_SHELL_CLASS} dir="rtl" style={{ gap: 'clamp(10px, 1.2vw, 16px)' }}>
      <ChildGameBackdrop previewMode={previewMode} />

      <GameHeader
        instruction={instructionAr}
        avatarState={avatarState}
        onPlayAudio={() => {
          if (questionAudio) {
            playAudioUrl(questionAudio);
            return;
          }

          if (helpVoiceEnabled) {
            const utterance = new SpeechSynthesisUtterance(instructionAr);
            utterance.lang = 'ar-SA';
            window.speechSynthesis.speak(utterance);
          }
        }}
        onRestart={handleRestart}
      />

      <GameSection>
        <div className="mx-auto w-full" style={{ maxWidth: boardWidth }}>
          <div
            className="relative overflow-hidden rounded-[clamp(20px,2vw,24px)] border border-[#dbe7f3] bg-white/95"
            dir="ltr"
            style={{
              aspectRatio: boardAspectRatio,
              boxShadow: '0 18px 38px -28px rgba(71, 85, 105, 0.22)',
            }}
          >
            {boardTiles.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm font-black text-slate-500">
                جاري تجهيز الصورة...
              </div>
            ) : (
              <div
                className="absolute inset-0 grid"
                style={{
                  gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${gridRows}, minmax(0, 1fr))`,
                }}
              >
                {boardTiles.map((tile) => {
                  const id = tile.id;
                  const isMissing = missingCellIds.includes(id);
                  const isFilled = Boolean(filledCells[id]);
                  const isActive = activeCellId === id && isMissing && !isFilled;
                  const isHintedCell = hintedTileId === id && isMissing && !isFilled;
                  const showTileImage = !isMissing || isFilled;

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleCellSelect(id)}
                      className={`relative overflow-hidden border border-white/35 transition-all ${
                        isMissing
                          ? isFilled
                            ? 'bg-transparent'
                            : isActive
                              ? 'bg-sky-50/10 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.18)]'
                              : 'bg-transparent'
                          : 'pointer-events-none bg-transparent'
                      }`}
                      onDragOver={(event) => handleCellDragOver(event, id)}
                      onDragEnter={(event) => handleCellDragOver(event, id)}
                      onDragLeave={() => handleCellDragLeave(id)}
                      onDrop={(event) => handleCellDrop(event, id)}
                    >
                      {showTileImage ? (
                        <img src={tile.image} alt={`cell-${id}`} className="h-full w-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 bg-white/65" />
                      )}

                      {isMissing && !isFilled ? (
                        <div
                          className={`absolute inset-[12%] rounded-[clamp(10px,1.2vw,14px)] border-2 border-dashed transition-all ${
                            dropTargetCellId === id
                              ? 'border-emerald-300/90 bg-emerald-100/15'
                              : isHintedCell
                                ? 'border-sky-300 bg-sky-50/70 ring-2 ring-sky-300/40'
                              : 'border-sky-300/80 bg-white/55'
                          }`}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </GameSection>

      <GameSection>
        <div
          className={`mx-auto grid ${
            optionTiles.length <= 2
              ? 'grid-cols-1 sm:grid-cols-2'
              : optionTiles.length === 3
                ? 'grid-cols-2 md:grid-cols-3'
                : 'grid-cols-2 md:grid-cols-4'
          }`}
          dir="ltr"
          style={{ gap: 'clamp(6px, 0.9vw, 12px)', maxWidth: 'min(100%, 28rem)' }}
        >
          {optionTiles.map((tile) => (
            <div
              key={`option-wrap-${tile.id}`}
              className={`relative mx-auto w-full max-w-[116px] rounded-[clamp(16px,1.6vw,20px)] transition-all duration-200 sm:max-w-[126px] md:max-w-[140px] ${
                hintedTileId === tile.id ? 'scale-[1.01]' : ''
              }`}
            >
              {hintedTileId === tile.id && (
                <div className="pointer-events-none absolute -top-16 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center">
                  <BirdHint className="h-16 w-16 drop-shadow-[0_10px_18px_rgba(6,182,212,0.28)]" />
                  {gestureHintTileId === tile.id && (
                    <span className="-mt-2 whitespace-nowrap rounded-full bg-amber-400 px-3 py-1 text-[11px] font-black text-white shadow-lg">
                      اسحب هذه القطعة
                    </span>
                  )}
                </div>
              )}
              <GameChoice
                draggable
                onDragStart={(event) => handleTileDragStart(event, tile)}
                onDragEnd={handleTileDragEnd}
                onClick={() => handleOptionSelect(tile)}
                className={`mx-auto w-full overflow-hidden p-0 ${
                  draggedTileId === tile.id ? 'opacity-60 scale-[0.98]' : ''
                } ${
                  hintedTileId === tile.id
                    ? GAME_ASSISTANT_HINT_CLASS
                    : ''
                }`}
                style={{ aspectRatio: tileAspectRatio }}
              >
                <img src={tile.image} alt={`option-${tile.id}`} className="h-full w-full object-cover" />
              </GameChoice>
            </div>
          ))}
        </div>
      </GameSection>

      <FeedbackModal
        show={showFeedback}
        isCorrect={isCorrect}
        onNext={handleNext}
        successSound={config?.feedback?.successSound || game?.successSound}
        failSound={config?.feedback?.failSound || game?.failSound}
      />
    </GameContainer>
  );
};

export default ImageCompletePartGame;
