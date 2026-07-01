const fs = require('fs');
const file = 'c:\\React Course - (Udmey)\\Speech-Therapy-Games\\frontend\\src\\games\\ImageCompletePartGame.jsx';
let content = fs.readFileSync(file, 'utf8');

const oldImageLoad = `    const sourceImage = new window.Image();
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

    sourceImage.src = image;`;

const newImageLoad = `    let objectUrl = null;

    const loadImg = async () => {
      let finalSrc = image;
      try {
        const res = await fetch(image);
        if (res.ok) {
          const blob = await res.blob();
          objectUrl = URL.createObjectURL(blob);
          finalSrc = objectUrl;
        }
      } catch (e) {
        console.warn('Image fetch fallback failed', e);
      }

      if (cancelled) return;

      const sourceImage = new window.Image();
      if (finalSrc.startsWith('http')) {
        sourceImage.crossOrigin = 'anonymous';
      }

      sourceImage.onload = () => {
        if (cancelled) return;

        setSourceAspectRatio(
          sourceImage.naturalWidth > 0 && sourceImage.naturalHeight > 0
            ? sourceImage.naturalWidth / sourceImage.naturalHeight
            : 1,
        );

        if (content.cropMode === 'free') {
          const rect = content.cropRect || { x: 25, y: 25, width: 50, height: 50 };
          const sx = (rect.x / 100) * sourceImage.naturalWidth;
          const sy = (rect.y / 100) * sourceImage.naturalHeight;
          const sw = (rect.width / 100) * sourceImage.naturalWidth;
          const sh = (rect.height / 100) * sourceImage.naturalHeight;

          const croppedImage = cropImageToDataUrl(sourceImage, sx, sy, sw, sh);

          setBoardTiles([{ id: 'full', image: finalSrc }]);

          const correctTile = { id: 'free_crop_0', image: croppedImage };
          
          let nextOptions = manualOptions;
          if (nextOptions.length === 0) {
            nextOptions = Array.from({ length: distractorCount }, (_, i) => {
              const rX = Math.random() * (sourceImage.naturalWidth - sw);
              const rY = Math.random() * (sourceImage.naturalHeight - sh);
              return {
                id: \`distractor_\${i}\`,
                image: cropImageToDataUrl(sourceImage, rX, rY, sw, sh)
              };
            });
          }
          
          setOptionTiles(shuffleArray([correctTile, ...nextOptions]));
        } else {
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
        }
      };

      sourceImage.onerror = () => {
        if (!cancelled) {
          setBoardTiles([]);
          setOptionTiles([]);
          setSourceAspectRatio(1);
        }
      };

      sourceImage.src = finalSrc;
    };

    loadImg();`;

content = content.replace(oldImageLoad, newImageLoad);

const oldReturn = `    return () => {
      cancelled = true;
    };`;

const newReturn = `    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };`;

content = content.replace(oldReturn, newReturn);


const oldBoardUI = `            {boardTiles.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm font-black text-slate-500">
                جاري تجهيز الصورة...
              </div>
            ) : (
              <div
                className="absolute inset-0 grid"
                style={{
                  gridTemplateColumns: \`repeat(\${gridCols}, minmax(0, 1fr))\`,
                  gridTemplateRows: \`repeat(\${gridRows}, minmax(0, 1fr))\`,
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
                      className={\`relative overflow-hidden border border-white/35 transition-all \${
                        isMissing
                          ? isFilled
                            ? 'bg-transparent'
                            : isActive
                              ? 'bg-sky-50/10 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.18)]'
                              : 'bg-transparent'
                          : 'pointer-events-none bg-transparent'
                      }\`}
                      onDragOver={(event) => handleCellDragOver(event, id)}
                      onDragEnter={(event) => handleCellDragOver(event, id)}
                      onDragLeave={() => handleCellDragLeave(id)}
                      onDrop={(event) => handleCellDrop(event, id)}
                    >
                      {showTileImage ? (
                        <img src={tile.image} alt={\`cell-\${id}\`} className="h-full w-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 bg-white/65" />
                      )}

                      {isMissing && !isFilled ? (
                        <div
                          className={\`absolute inset-[12%] rounded-[clamp(10px,1.2vw,14px)] border-2 border-dashed transition-all \${
                            dropTargetCellId === id
                              ? 'border-emerald-300/90 bg-emerald-100/15'
                              : isHintedCell
                                ? 'border-sky-300 bg-sky-50/70 ring-2 ring-sky-300/40'
                              : 'border-sky-300/80 bg-white/55'
                          }\`}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}`;

const newBoardUI = `            {boardTiles.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm font-black text-slate-500">
                جاري تجهيز الصورة...
              </div>
            ) : content.cropMode === 'free' ? (
              <div className="absolute inset-0">
                 <img src={boardTiles[0].image} alt="board" className="absolute inset-0 w-full h-full object-cover" />
                 {(() => {
                   const isFilled = Boolean(filledCells['free_crop_0']);
                   const isActive = activeCellId === 'free_crop_0' && !isFilled;
                   const isHintedCell = hintedTileId === 'free_crop_0' && !isFilled;
                   const rect = content.cropRect || { x: 25, y: 25, width: 50, height: 50 };
                   
                   return (
                     <button
                       type="button"
                       onClick={() => handleCellSelect('free_crop_0')}
                       className={\`absolute transition-all \${
                         isFilled
                           ? 'bg-transparent'
                           : isActive
                             ? 'bg-sky-50/10 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.18)]'
                             : 'bg-white/65'
                       }\`}
                       style={{
                         left: \`\${rect.x}%\`,
                         top: \`\${rect.y}%\`,
                         width: \`\${rect.width}%\`,
                         height: \`\${rect.height}%\`,
                       }}
                       onDragOver={(event) => handleCellDragOver(event, 'free_crop_0')}
                       onDragEnter={(event) => handleCellDragOver(event, 'free_crop_0')}
                       onDragLeave={() => handleCellDragLeave('free_crop_0')}
                       onDrop={(event) => handleCellDrop(event, 'free_crop_0')}
                     >
                       {isFilled ? (
                         <img src={optionTiles.find(t => t.id === 'free_crop_0')?.image} alt="filled" className="w-full h-full object-cover" />
                       ) : (
                         <div
                           className={\`absolute inset-[8%] rounded-[clamp(8px,1vw,12px)] border-2 border-dashed transition-all \${
                             dropTargetCellId === 'free_crop_0'
                               ? 'border-emerald-300/90 bg-emerald-100/15'
                               : isHintedCell
                                 ? 'border-sky-300 bg-sky-50/70 ring-2 ring-sky-300/40'
                               : 'border-sky-300/80 bg-white/55'
                           }\`}
                         />
                       )}
                     </button>
                   );
                 })()}
              </div>
            ) : (
              <div
                className="absolute inset-0 grid"
                style={{
                  gridTemplateColumns: \`repeat(\${gridCols}, minmax(0, 1fr))\`,
                  gridTemplateRows: \`repeat(\${gridRows}, minmax(0, 1fr))\`,
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
                      className={\`relative overflow-hidden border border-white/35 transition-all \${
                        isMissing
                          ? isFilled
                            ? 'bg-transparent'
                            : isActive
                              ? 'bg-sky-50/10 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.18)]'
                              : 'bg-transparent'
                          : 'pointer-events-none bg-transparent'
                      }\`}
                      onDragOver={(event) => handleCellDragOver(event, id)}
                      onDragEnter={(event) => handleCellDragOver(event, id)}
                      onDragLeave={() => handleCellDragLeave(id)}
                      onDrop={(event) => handleCellDrop(event, id)}
                    >
                      {showTileImage ? (
                        <img src={tile.image} alt={\`cell-\${id}\`} className="h-full w-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 bg-white/65" />
                      )}

                      {isMissing && !isFilled ? (
                        <div
                          className={\`absolute inset-[12%] rounded-[clamp(10px,1.2vw,14px)] border-2 border-dashed transition-all \${
                            dropTargetCellId === id
                              ? 'border-emerald-300/90 bg-emerald-100/15'
                              : isHintedCell
                                ? 'border-sky-300 bg-sky-50/70 ring-2 ring-sky-300/40'
                              : 'border-sky-300/80 bg-white/55'
                          }\`}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}`;

content = content.replace(oldBoardUI, newBoardUI);

// Update initial state of activeCellId
const oldInitialState = `    setActiveCellId(missingCellIds[0] || null);`;
const newInitialState = `    setActiveCellId(content.cropMode === 'free' ? 'free_crop_0' : (missingCellIds[0] || null));`;

content = content.replace(oldInitialState, newInitialState);

// Update showMissingPieceHint for free mode
const oldHint = `    const showMissingPieceHint = ({ gesture = false } = {}) => {
      const firstOpenCell = missingCellIds.find((id) => !filledCells[id]);
      if (!firstOpenCell) return;`;
const newHint = `    const showMissingPieceHint = ({ gesture = false } = {}) => {
      let firstOpenCell = null;
      if (content.cropMode === 'free') {
         firstOpenCell = filledCells['free_crop_0'] ? null : 'free_crop_0';
      } else {
         firstOpenCell = missingCellIds.find((id) => !filledCells[id]);
      }
      if (!firstOpenCell) return;`;

content = content.replace(oldHint, newHint);

fs.writeFileSync(file, content);
console.log('Update finished successfully');
