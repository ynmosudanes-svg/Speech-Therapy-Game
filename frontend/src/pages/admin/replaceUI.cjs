const fs = require('fs');
const file = 'c:\\React Course - (Udmey)\\Speech-Therapy-Games\\frontend\\src\\pages\\admin\\GameForm.jsx';
let content = fs.readFileSync(file, 'utf8');

const targetRegex = /<div className="rounded-2xl border border-\[#D9EAF2\] bg-\[#EAF7FD\] px-4 py-4 space-y-4">[\s\S]*?<div className="text-sm font-bold text-\[#0F6FA6\]">.*?<\/div>[\s\S]*?<\/div>\s*<\/div>\s*\)\s*:\s*\([\s\S]*?ارفع الصورة أولاً ثم اسحب الجزء الناقص على الشبكة لتحديده.[\s\S]*?<\/div>\s*<\/div>\s*\)/;

const replacement = `<div className="rounded-2xl border border-[#D9EAF2] bg-[#EAF7FD] px-4 py-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-bold text-[#0F6FA6]">إعداد تقسيم الصورة</div>
                            <div className="flex bg-white rounded-lg p-1 border border-[#D9EAF2]">
                              <button
                                type="button"
                                onClick={() => updateCurrentActivity((activity) => ({ ...activity, cropMode: 'grid' }))}
                                className={\`px-3 py-1.5 text-xs font-bold rounded-md transition-all \${currentActivity?.cropMode !== 'free' ? 'bg-[#19add6] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}\`}
                              >
                                تقسيم شبكي
                              </button>
                              <button
                                type="button"
                                onClick={() => updateCurrentActivity((activity) => ({ ...activity, cropMode: 'free', missingPartCount: 1, cropRect: activity.cropRect || { x: 25, y: 25, width: 50, height: 50 } }))}
                                className={\`px-3 py-1.5 text-xs font-bold rounded-md transition-all \${currentActivity?.cropMode === 'free' ? 'bg-[#19add6] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}\`}
                              >
                                قص حر
                              </button>
                            </div>
                          </div>

                          {currentActivity?.cropMode === 'free' ? (
                            <div className="space-y-4">
                              {currentActivity.image ? (
                                <div className="space-y-3">
                                  <div className="text-sm font-bold text-slate-700">
                                    اسحب الماوس فوق الصورة لرسم مربع يحدد الجزء الناقص
                                  </div>
                                  <div
                                    dir="ltr"
                                    className="relative mx-auto overflow-hidden rounded-[1.5rem] border-4 border-white bg-white shadow-[0_12px_28px_-18px_rgba(15,111,166,0.18)] select-none touch-none"
                                    style={{ maxWidth: '320px', cursor: 'crosshair' }}
                                    onPointerDown={handleCropMouseDown}
                                    onPointerMove={handleCropMouseMove}
                                    onPointerUp={handleCropMouseUp}
                                    onPointerLeave={handleCropMouseUp}
                                  >
                                    <img
                                      src={currentActivity.image}
                                      alt="المعاينة"
                                      className="w-full h-auto object-contain pointer-events-none"
                                      draggable={false}
                                    />
                                    {(currentActivity.cropRect || isDrawingCrop) && (
                                      <div
                                        className="absolute border-2 border-dashed border-sky-400 bg-sky-300/30 pointer-events-none"
                                        style={{
                                          left: \`\${currentActivity.cropRect?.x || 0}%\`,
                                          top: \`\${currentActivity.cropRect?.y || 0}%\`,
                                          width: \`\${currentActivity.cropRect?.width || 0}%\`,
                                          height: \`\${currentActivity.cropRect?.height || 0}%\`,
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-4 py-6 text-center text-sm font-bold text-slate-500">
                                  ارفع الصورة أولاً ثم ارسم الجزء الناقص.
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-3">
                                {[
                                  { rows: 2, cols: 2, label: '2x2' },
                                  { rows: 3, cols: 3, label: '3x3' },
                                ].map((gridOption) => {
                                  const isActive =
                                    Number(currentActivity.gridRows || 2) === gridOption.rows &&
                                    Number(currentActivity.gridCols || 2) === gridOption.cols;

                                  return (
                                    <button
                                      key={gridOption.label}
                                      type="button"
                                      onClick={() =>
                                        updateCurrentActivity((activity) => ({
                                          ...activity,
                                          gridRows: gridOption.rows,
                                          gridCols: gridOption.cols,
                                          missingCellIds: ['0'],
                                        }))
                                      }
                                      className={\`rounded-xl border-2 px-4 py-3 font-black transition-all \${
                                        isActive
                                          ? 'border-[#19add6] bg-white text-[#0F6FA6] shadow-sm'
                                          : 'border-slate-200 bg-white/70 text-slate-500'
                                      }\`}
                                    >
                                      {gridOption.label}
                                    </button>
                                  );
                                })}
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                {[1, 2].map((count) => (
                                  <button
                                    key={count}
                                    type="button"
                                    onClick={() =>
                                      updateCurrentActivity((activity) => ({
                                        ...activity,
                                        missingPartCount: count,
                                        missingCellIds: (Array.isArray(activity?.missingCellIds) ? activity.missingCellIds : ['0']).slice(0, count),
                                      }))
                                    }
                                    className={\`rounded-xl border-2 px-4 py-3 font-black transition-all \${
                                      Number(currentActivity.missingPartCount || 1) === count
                                        ? 'border-[#19add6] bg-white text-[#0F6FA6] shadow-sm'
                                        : 'border-slate-200 bg-white/70 text-slate-500'
                                    }\`}
                                  >
                                    {count === 1 ? 'جزء واحد ناقص' : 'جزئين ناقصين'}
                                  </button>
                                ))}
                              </div>

                              {currentActivity.image ? (
                                <div className="space-y-3">
                                  <div className="text-sm font-bold text-slate-700">
                                    اسحب القطعة الصحيحة إلى الخانة أو الخانتين اللي عاوزهم يبقوا الجزء الناقص
                                  </div>
                                  <div
                                    dir="ltr"
                                    className="relative mx-auto overflow-hidden rounded-[1.5rem] border-4 border-white bg-white shadow-[0_12px_28px_-18px_rgba(15,111,166,0.18)]"
                                    style={{
                                      aspectRatio: \`\${Number(currentActivity.gridCols || 2)} / \${Number(currentActivity.gridRows || 2)}\`,
                                      maxWidth: '320px',
                                    }}
                                  >
                                    <img
                                      src={currentActivity.image}
                                      alt="المعاينة"
                                      className="absolute inset-0 h-full w-full object-cover pointer-events-none"
                                    />

                                    <div
                                      className="absolute inset-0 grid"
                                      style={{
                                        gridTemplateColumns: \`repeat(\${Number(currentActivity.gridCols || 2)}, minmax(0, 1fr))\`,
                                        gridTemplateRows: \`repeat(\${Number(currentActivity.gridRows || 2)}, minmax(0, 1fr))\`,
                                      }}
                                    >
                                      {Array.from(
                                        {
                                          length:
                                            Number(currentActivity.gridRows || 2) *
                                            Number(currentActivity.gridCols || 2),
                                        },
                                        (_, cellIndex) => {
                                          const cellId = String(cellIndex);
                                          const isSelected = (currentActivity.missingCellIds || []).map((id) => String(id)).includes(cellId);

                                          return (
                                            <button
                                              key={cellId}
                                              type="button"
                                              onClick={() => toggleCompletePartCell(cellId)}
                                              className={\`relative border border-white/40 transition-all \${
                                                isSelected
                                                  ? 'bg-amber-300/12 ring-4 ring-amber-300/80'
                                                  : 'bg-transparent hover:bg-white/8'
                                              }\`}
                                            >
                                              {isSelected && (
                                                <div className="absolute inset-0 border-2 border-dashed border-amber-300/90 pointer-events-none" />
                                              )}
                                            </button>
                                          );
                                        }
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-4 py-6 text-center text-sm font-bold text-slate-500">
                                  ارفع الصورة أولاً ثم اسحب الجزء الناقص على الشبكة لتحديده.
                                </div>
                              )}
                            </div>
                          )`;

if (targetRegex.test(content)) {
  content = content.replace(targetRegex, replacement);
  fs.writeFileSync(file, content);
  console.log('Success');
} else {
  console.log('Target not found');
}
