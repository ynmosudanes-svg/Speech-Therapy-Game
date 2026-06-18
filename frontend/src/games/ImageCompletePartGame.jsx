import React, { useEffect, useMemo, useState } from 'react';
import { Crop, Grid2x2, Sparkles } from 'lucide-react';
import FeedbackModal from '../components/FeedbackModal';
import GameHeader from '../components/game/GameHeader';
import { playAudioUrl } from '../utils/soundEffects';

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
  if (!context) {
    return '';
  }

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
    [content.missingCellIds]
  );
  const distractorCount = Math.max(1, Math.min(4, Number(content.distractorCount || 3)));

  const [tileImages, setTileImages] = useState([]);
  const [filledCells, setFilledCells] = useState({});
  const [activeCellId, setActiveCellId] = useState(null);
  const [optionTiles, setOptionTiles] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());

  const totalCells = gridRows * gridCols;
  const missingCellIds = configuredMissingCellIds.slice(0, missingPartCount).filter((id) => Number(id) < totalCells);

  useEffect(() => {
    setFilledCells({});
    setActiveCellId(missingCellIds[0] || null);
    setShowFeedback(false);
    setIsCorrect(false);
    setAttempts(0);
  }, [game?.id, gridRows, gridCols, missingPartCount, configuredMissingCellIds.join(',')]);

  useEffect(() => {
    if (!questionAudio || previewMode) {
      return;
    }

    playAudioUrl(questionAudio);
  }, [previewMode, questionAudio]);

  useEffect(() => {
    if (!image || typeof window === 'undefined') {
      setTileImages([]);
      setOptionTiles([]);
      return undefined;
    }

    let cancelled = false;
    const sourceImage = new window.Image();
    sourceImage.crossOrigin = 'anonymous';

    sourceImage.onload = () => {
      if (cancelled) {
        return;
      }

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
            cellHeight
          ),
        };
      });

      const missingSet = new Set(missingCellIds);
      const correctTiles = tiles.filter((tile) => missingSet.has(tile.id));
      const distractorTiles = shuffleArray(tiles.filter((tile) => !missingSet.has(tile.id))).slice(0, distractorCount);
      setTileImages(tiles);
      setOptionTiles(shuffleArray([...correctTiles, ...distractorTiles]));
    };

    sourceImage.onerror = () => {
      if (!cancelled) {
        setTileImages([]);
        setOptionTiles([]);
      }
    };

    sourceImage.src = image;

    return () => {
      cancelled = true;
    };
  }, [distractorCount, gridCols, gridRows, image, missingCellIds.join(','), totalCells]);

  useEffect(() => {
    if (!registerAssistantActions) {
      return undefined;
    }

    registerAssistantActions({
      onVisualHint: () => {
        const firstOpenCell = missingCellIds.find((id) => !filledCells[id]);
        if (firstOpenCell) {
          setActiveCellId(firstOpenCell);
        }
      },
      onGestureHint: () => {
        const firstOpenCell = missingCellIds.find((id) => !filledCells[id]);
        if (firstOpenCell) {
          setActiveCellId(firstOpenCell);
        }
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
          }, {})
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
    [filledCells, missingCellIds, tileImages, totalCells]
  );

  const handleCellSelect = (cellId) => {
    if (!missingCellIds.includes(cellId)) {
      return;
    }

    if (filledCells[cellId]) {
      return;
    }

    onAssistantInteraction?.();
    setActiveCellId(cellId);
  };

  const handleOptionSelect = (tile) => {
    const targetCellId = activeCellId || missingCellIds.find((id) => !filledCells[id]) || null;
    if (!targetCellId) {
      return;
    }

    onAssistantInteraction?.();
    setAttempts((current) => current + 1);

    if (tile.id !== targetCellId) {
      setIsCorrect(false);
      setShowFeedback(true);
      return;
    }

    const nextFilledCells = {
      ...filledCells,
      [targetCellId]: tile.id,
    };

    setFilledCells(nextFilledCells);
    const nextOpenCell = missingCellIds.find((id) => !nextFilledCells[id]) || null;
    setActiveCellId(nextOpenCell);

    if (nextOpenCell) {
      return;
    }

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
    if (!isCorrect) {
      return;
    }

    if (previewMode) {
      return;
    }

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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5" dir="rtl">
      <GameHeader
        instruction={instructionAr}
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

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.95fr]">
        <section className="rounded-[2rem] border border-[#dbe7f3] bg-white/92 p-4 shadow-[0_16px_36px_-26px_rgba(71,85,105,0.18)]">
          <div className="mb-4 flex items-center justify-between text-sm font-black text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#eefafd] px-3 py-1 text-[#19add6]">
              <Grid2x2 size={15} />
              {gridRows} x {gridCols}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-amber-700">
              <Crop size={15} />
              أجزاء ناقصة: {missingCellIds.length}
            </span>
          </div>

          <div
            dir="ltr"
            className="grid overflow-hidden rounded-[1.5rem] border-4 border-white bg-[#f8fbff] shadow-[0_12px_28px_-22px_rgba(15,111,166,0.25)]"
            style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
          >
            {boardTiles.map((tile) => {
              const tileToRender = tile.filledWith
                ? tileImages.find((item) => item.id === tile.filledWith)
                : tile;
              const isActive = activeCellId === tile.id && tile.isMissing && !tile.filledWith;

              return (
                <button
                  key={tile.id}
                  type="button"
                  onClick={() => handleCellSelect(tile.id)}
                  className={`relative aspect-square overflow-hidden border border-white/90 transition-all ${
                    tile.isMissing && !tile.filledWith
                      ? isActive
                        ? 'bg-amber-50 ring-4 ring-amber-200'
                        : 'bg-slate-50 hover:bg-slate-100'
                      : 'bg-white'
                  }`}
                >
                  {tile.isMissing && !tile.filledWith ? (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400">
                      <Crop size={24} />
                      <span className="text-xs font-black md:text-sm">الجزء الناقص</span>
                    </div>
                  ) : (
                    <img
                      src={tileToRender?.image}
                      alt={`tile-${tile.id}`}
                      className="h-full w-full object-cover"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#dbe7f3] bg-white/92 p-4 shadow-[0_16px_36px_-26px_rgba(71,85,105,0.18)]">
          <div className="mb-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700">
              <Sparkles size={15} />
              اختر الجزء الصحيح
            </div>
          </div>

          <div dir="ltr" className="grid grid-cols-2 gap-3">
            {optionTiles.map((tile) => (
              <button
                key={`option-${tile.id}`}
                type="button"
                onClick={() => handleOptionSelect(tile)}
                className="aspect-square overflow-hidden rounded-[1.25rem] border-2 border-slate-200 bg-white transition-all hover:-translate-y-1 hover:border-sky-200 hover:shadow-lg active:scale-95"
              >
                <img
                  src={tile.image}
                  alt={`option-${tile.id}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </section>
      </div>

      <FeedbackModal
        show={showFeedback}
        isCorrect={isCorrect}
        onNext={handleNext}
        successSound={config?.feedback?.successSound || game?.successSound}
        failSound={config?.feedback?.failSound || game?.failSound}
      />
    </div>
  );
};

export default ImageCompletePartGame;
