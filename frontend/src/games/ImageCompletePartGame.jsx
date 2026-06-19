import React, { useEffect, useMemo, useState } from 'react';
import { Crop, Grid2x2 } from 'lucide-react';
import FeedbackModal from '../components/FeedbackModal';
import GameHeader from '../components/game/GameHeader';
import {
  GameChoice,
  GameContainer,
  GameImage,
  GameSection,
} from '../components/game/GameUI';
import { playAudioUrl } from '../utils/soundEffects';
import ChildGameBackdrop from './ChildGameBackdrop';
import {
  CHILD_GAME_BOARD_MAX_WIDTH,
  CHILD_GAME_OPTIONS_MAX_WIDTH,
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
  const content = config?.content || {};
  const instructionAr = content.instructionAr || game?.questionTextAr || 'اختر الجزء الناقص لإكمال الصورة';
  const questionAudio = content.questionAudio || game?.questionAudio || '';
  const image = content.image || '';
  const gridRows = Math.max(2, Math.min(3, Number(content.gridRows || 2)));
  const gridCols = Math.max(2, Math.min(3, Number(content.gridCols || 2)));
  const missingPartCount = Math.max(1, Math.min(2, Number(content.missingPartCount || 1)));
  const configuredMissingCellIds = useMemo(
    () => (Array.isArray(content.missingCellIds) ? content.missingCellIds.map((id) => String(id)) : ['0']),
    [content.missingCellIds],
  );
  const distractorCount = Math.max(1, Math.min(4, Number(content.distractorCount || 3)));

  const [tileImages, setTileImages] = useState([]);
  const [sourceAspectRatio, setSourceAspectRatio] = useState(1);
  const [filledCells, setFilledCells] = useState({});
  const [activeCellId, setActiveCellId] = useState(null);
  const [optionTiles, setOptionTiles] = useState([]);
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
      setTileImages([]);
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

      const missingSet = new Set(missingCellIds);
      const correctTiles = tiles.filter((tile) => missingSet.has(tile.id));
      const distractorTiles = shuffleArray(tiles.filter((tile) => !missingSet.has(tile.id))).slice(
        0,
        distractorCount,
      );

      setTileImages(tiles);
      setOptionTiles(shuffleArray([...correctTiles, ...distractorTiles]));
    };

    sourceImage.onerror = () => {
      if (!cancelled) {
        setTileImages([]);
        setOptionTiles([]);
        setSourceAspectRatio(1);
      }
    };

    sourceImage.src = image;

    return () => {
      cancelled = true;
    };
  }, [distractorCount, gridCols, gridRows, image, missingCellIds.join(','), totalCells]);

  useEffect(() => {
    if (!registerAssistantActions) return undefined;

    registerAssistantActions({
      onVisualHint: () => {
        const firstOpenCell = missingCellIds.find((id) => !filledCells[id]);
        if (firstOpenCell) setActiveCellId(firstOpenCell);
      },
      onGestureHint: () => {
        const firstOpenCell = missingCellIds.find((id) => !filledCells[id]);
        if (firstOpenCell) setActiveCellId(firstOpenCell);
      },
      onVerbalHint: () => {
        if (helpVoiceEnabled) {
          const utterance = new SpeechSynthesisUtterance('اختر الجزء الذي يكمل الصورة.');
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

  const boardTiles = useMemo(
    () =>
      Array.from({ length: totalCells }, (_, index) => {
        const id = String(index);
        const tile = tileImages.find((item) => item.id === id);
        return {
          id,
          image: tile?.image || '',
          isMissing: missingCellIds.includes(id),
          filledWith: filledCells[id] || null,
        };
      }),
    [filledCells, missingCellIds, tileImages, totalCells],
  );

  const boardAspectRatio = useMemo(() => {
    if (!Number.isFinite(sourceAspectRatio) || sourceAspectRatio <= 0) return '1 / 1';
    return `${sourceAspectRatio} / 1`;
  }, [sourceAspectRatio]);

  const tileAspectRatio = useMemo(() => {
    const ratio = sourceAspectRatio * (gridRows / gridCols);
    if (!Number.isFinite(ratio) || ratio <= 0) return '1 / 1';
    return `${ratio} / 1`;
  }, [gridCols, gridRows, sourceAspectRatio]);

  const boardWidth = useMemo(() => {
    const ratio = Number.isFinite(sourceAspectRatio) && sourceAspectRatio > 0 ? sourceAspectRatio : 1;
    return getChildBoardWidth(ratio, { base: 200, min: 155, max: CHILD_GAME_BOARD_MAX_WIDTH });
  }, [sourceAspectRatio]);

  const handleCellSelect = (cellId) => {
    if (!missingCellIds.includes(cellId) || filledCells[cellId]) return;
    onAssistantInteraction?.();
    setActiveCellId(cellId);
  };

  const handleOptionSelect = (tile) => {
    const targetCellId = activeCellId || missingCellIds.find((id) => !filledCells[id]) || null;
    if (!targetCellId) return;

    onAssistantInteraction?.();
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
        أضف صورة اللعبة أولا.
      </div>
    );
  }

  return (
    <GameContainer className={CHILD_GAME_SHELL_CLASS} dir="rtl">
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm font-black text-slate-500">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#eefafd] px-3 py-1 text-[#19add6]">
            <Grid2x2 size={15} />
            {gridRows} x {gridCols}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-amber-700">
            <Crop size={15} />
            أجزاء ناقصة: {missingCellIds.length}
          </span>
        </div>

        <div className="mx-auto w-full" style={{ maxWidth: boardWidth }}>
          <div
            className="grid overflow-hidden rounded-[clamp(20px,2vw,24px)] border border-[#dbe7f3] bg-white/95"
            dir="ltr"
            style={{
              aspectRatio: boardAspectRatio,
              gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
              boxShadow: '0 18px 38px -28px rgba(71, 85, 105, 0.22)',
            }}
          >
            {boardTiles.map((tile) => {
              const tileToRender = tile.filledWith ? tileImages.find((item) => item.id === tile.filledWith) : tile;
              const isActive = activeCellId === tile.id && tile.isMissing && !tile.filledWith;

              return (
                <button
                  key={tile.id}
                  type="button"
                  onClick={() => handleCellSelect(tile.id)}
                  className={`relative overflow-hidden border border-slate-100/90 transition-all ${
                    tile.isMissing && !tile.filledWith
                      ? isActive
                        ? 'bg-sky-50 ring-2 ring-inset ring-sky-300'
                        : 'bg-slate-50'
                      : 'bg-white'
                  }`}
                >
                  {tile.isMissing && !tile.filledWith ? (
                    <div className="absolute inset-[5%] rounded-[clamp(12px,1.5vw,16px)] border-2 border-dashed border-sky-300/70 bg-sky-50/35" />
                  ) : (
                    <img src={tileToRender?.image} alt={`tile-${tile.id}`} className="h-full w-full object-cover" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </GameSection>

      <GameSection>
        <div className="mb-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700">
            اختر الجزء الصحيح
          </div>
        </div>

        <div
          className={`mx-auto grid ${
            optionTiles.length <= 2
              ? 'grid-cols-1 sm:grid-cols-2'
              : optionTiles.length === 3
                ? 'grid-cols-2 md:grid-cols-3'
                : 'grid-cols-2 md:grid-cols-4'
          }`}
          dir="ltr"
          style={{ gap: 'clamp(7px, 1.1vw, 10px)', maxWidth: `${Math.min(CHILD_GAME_OPTIONS_MAX_WIDTH, 300)}px` }}
        >
          {optionTiles.map((tile) => (
            <GameChoice
              key={`option-${tile.id}`}
              onClick={() => handleOptionSelect(tile)}
              className="overflow-hidden p-0"
              style={{ aspectRatio: tileAspectRatio }}
            >
              <img src={tile.image} alt={`option-${tile.id}`} className="h-full w-full object-cover" />
            </GameChoice>
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
