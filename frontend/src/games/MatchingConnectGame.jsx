import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameHeader from '../components/game/GameHeader';

export default function MatchingConnectGame({ 
  game, 
  onComplete, 
  onAssistantInteraction,
  registerAssistantActions,
  helpVoiceEnabled 
}) {
  const content = game?.config?.content || {};
  const pairs = content.pairs || [];
  const feedback = game?.config?.feedback || {};

  // --- Game State ---
  const [activePairs, setActivePairs] = useState([]);
  const [columnA, setColumnA] = useState([]); // Visual Right (Source)
  const [columnB, setColumnB] = useState([]); // Visual Left (Target)
  
  // Interaction State
  const [selectedSource, setSelectedSource] = useState(null); // ID
  const [selectedTarget, setSelectedTarget] = useState(null); // ID
  const [matchedIds, setMatchedIds] = useState([]); // Array of IDs
  const [wrongAttempt, setWrongAttempt] = useState(false);
  const [tempWrongLine, setTempWrongLine] = useState(null); // { sourceId, targetId }
  
  // SVG Lines State
  const [lines, setLines] = useState([]);
  const [wrongLineSvg, setWrongLineSvg] = useState(null);
  
  // Scoring
  const [attempts, setAttempts] = useState(0);
  const [errors, setErrors] = useState(0);

  // Refs for DOM measurements
  const containerRef = useRef(null);
  const sourceRefs = useRef({});
  const targetRefs = useRef({});

  // Fisher-Yates Shuffle
  const shuffleArray = (array) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const handleRestart = useCallback(() => {
    if (!pairs || pairs.length === 0) return;
    
    // Create shuffled arrays for both columns
    const colAData = shuffleArray(pairs.map(p => ({ 
      id: p.id, 
      image: p.sourceImage, 
      label: p.sourceLabel 
    })));
    
    let colBData = shuffleArray(pairs.map(p => ({ 
      id: p.id, 
      image: p.targetImage, 
      label: p.targetLabel 
    })));
    
    // Guarantee that items don't align horizontally (Derangement)
    if (pairs.length > 1) {
      let isDerangement = false;
      let attemptsToShuffle = 10;
      while (!isDerangement && attemptsToShuffle > 0) {
        isDerangement = true;
        for (let i = 0; i < pairs.length; i++) {
          if (colAData[i].id === colBData[i].id) {
            isDerangement = false;
            break;
          }
        }
        if (!isDerangement) {
          colBData = shuffleArray(colBData);
          attemptsToShuffle--;
        }
      }
    }
    
    setColumnA(colAData);
    setColumnB(colBData);
    
    // Reset interaction state
    setSelectedSource(null);
    setSelectedTarget(null);
    setMatchedIds([]);
    setLines([]);
    setWrongAttempt(false);
    setTempWrongLine(null);
    setWrongLineSvg(null);
    setAttempts(0);
    setErrors(0);
  }, [pairs]);

  // Initialize a new game
  useEffect(() => {
    handleRestart();
  }, [handleRestart]);

  // Register Assistant Actions
  useEffect(() => {
    if (registerAssistantActions) {
      registerAssistantActions({
        highlightCorrect: () => {
          // Find an unmatched pair
          const unmatchedId = pairs.find(p => !matchedIds.includes(p.id))?.id;
          if (unmatchedId) {
            setSelectedSource(unmatchedId);
            setTimeout(() => {
              setSelectedTarget(unmatchedId);
              checkMatch(unmatchedId, unmatchedId);
            }, 1000);
          }
        }
      });
    }
  }, [registerAssistantActions, pairs, matchedIds]);

  // Calculate SVG Lines based on matched items
  const updateLines = useCallback(() => {
    if (!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newLines = [];

    matchedIds.forEach(id => {
      const sourceEl = sourceRefs.current[id];
      const targetEl = targetRefs.current[id];

      if (sourceEl && targetEl) {
        const sourceRect = sourceEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();

        // RTL Layout: columnA is RIGHT, columnB is LEFT.
        const x1 = sourceRect.left - containerRect.left - 4; 
        const y1 = sourceRect.top - containerRect.top + (sourceRect.height / 2);
        
        const x2 = targetRect.right - containerRect.left + 4;
        const y2 = targetRect.top - containerRect.top + (targetRect.height / 2);

        // Distance to stretch the curve horizontally. 
        // We use Math.max to ensure there's a nice curve even if x1 and x2 are close.
        const offset = Math.max(Math.abs(x1 - x2) * 0.5, 40);
        const pathData = `M ${x1} ${y1} C ${x1 - offset} ${y1}, ${x2 + offset} ${y2}, ${x2} ${y2}`;

        newLines.push({ id, x1, y1, x2, y2, pathData });
      }
    });

    setLines(newLines);

    // Also update wrong line if exists
    if (tempWrongLine) {
      const sourceEl = sourceRefs.current[tempWrongLine.sourceId];
      const targetEl = targetRefs.current[tempWrongLine.targetId];
      if (sourceEl && targetEl) {
        const sourceRect = sourceEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        const x1 = sourceRect.left - containerRect.left - 4; 
        const y1 = sourceRect.top - containerRect.top + (sourceRect.height / 2);
        
        const x2 = targetRect.right - containerRect.left + 4;
        const y2 = targetRect.top - containerRect.top + (targetRect.height / 2);
        
        const offset = Math.max(Math.abs(x1 - x2) * 0.5, 40);
        const pathData = `M ${x1} ${y1} C ${x1 - offset} ${y1}, ${x2 + offset} ${y2}, ${x2} ${y2}`;
        setWrongLineSvg({ x1, y1, x2, y2, pathData });
      }
    } else {
      setWrongLineSvg(null);
    }
  }, [matchedIds, tempWrongLine]);

  // Recalculate lines on window resize
  useEffect(() => {
    window.addEventListener('resize', updateLines);
    return () => window.removeEventListener('resize', updateLines);
  }, [updateLines]);

  // Draw lines whenever matchedIds change
  useEffect(() => {
    const timeout = setTimeout(() => updateLines(), 50);
    return () => clearTimeout(timeout);
  }, [matchedIds, tempWrongLine, updateLines]);

  const handleItemClick = (column, id) => {
    if (matchedIds.includes(id)) return; // Already matched
    if (wrongAttempt) return; // Block input during error animation

    if (onAssistantInteraction) onAssistantInteraction();

    if (column === 'source') {
        if (selectedSource === id) {
            setSelectedSource(null);
        } else {
            setSelectedSource(id);
            if (selectedTarget) checkMatch(id, selectedTarget);
        }
    } else if (column === 'target') {
        if (selectedTarget === id) {
            setSelectedTarget(null);
        } else {
            setSelectedTarget(id);
            if (selectedSource) checkMatch(selectedSource, id);
        }
    }
  };

  const checkMatch = (sourceId, targetId) => {
    setAttempts(a => a + 1);
    
    if (sourceId === targetId) {
      // Match successful!
      const newMatched = [...matchedIds, sourceId];
      setMatchedIds(newMatched);
      setSelectedSource(null);
      setSelectedTarget(null);

      // Play success sound
      if (feedback?.successSound) {
        const audio = new Audio(feedback.successSound);
        audio.play().catch(() => {});
      }

      // Check win condition
      if (newMatched.length === pairs.length) {
        setTimeout(() => {
          onComplete({
            correctAnswers: pairs.length,
            wrongAnswers: errors,
            attempts: [attempts + 1], // attempts state + 1 for the current winning match
            timeSpent: 0, // Handled by GameEngine
            score: Math.max(0, 100 - (errors * 10))
          });
        }, 1500);
      }
    } else {
      // Match failed!
      setErrors(e => e + 1);
      setWrongAttempt(true);
      setTempWrongLine({ sourceId, targetId });
      
      if (feedback?.failSound) {
        const audio = new Audio(feedback.failSound);
        audio.play().catch(() => {});
      }

      setTimeout(() => {
        setSelectedSource(null);
        setSelectedTarget(null);
        setWrongAttempt(false);
        setTempWrongLine(null);
      }, 1000); // Reset after shake animation
    }
  };

  // if (!pairs || pairs.length === 0) return null; // We no longer return null to avoid blank preview

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto select-none font-sans" dir="rtl">
      <style dangerouslySetInnerHTML={{__html: `
          @keyframes shake {
              0%, 100% { transform: translateX(0); }
              25% { transform: translateX(-8px); }
              50% { transform: translateX(8px); }
              75% { transform: translateX(-8px); }
          }
          @keyframes dash {
              from { stroke-dasharray: 1000; stroke-dashoffset: 1000; }
              to { stroke-dasharray: 1000; stroke-dashoffset: 0; }
          }
      `}} />

      <div className="w-full mb-6">
        <GameHeader 
          instruction={content.instructionAr || 'قم بتوصيل كل صورة بما يطابقها'} 
          onPlayAudio={content.instructionAudio ? () => {
            const audio = new Audio(content.instructionAudio);
            audio.play().catch(() => {});
          } : undefined} 
          onRestart={handleRestart}
        />
      </div>

      {(!pairs || pairs.length === 0) ? (
        <div className="flex-1 flex flex-col items-center justify-center w-full min-h-[400px] text-center p-8 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 text-slate-400 mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="9" y1="15" x2="15" y2="15"></line></svg>
          </div>
          <h3 className="text-xl font-black text-slate-700 mb-2">النشاط فارغ</h3>
          <p className="text-slate-500 font-bold max-w-md mx-auto">يرجى إضافة "أزواج التوصيل" من لوحة التحكم (فورم النشاط) لكي تظهر اللعبة هنا.</p>
        </div>
      ) : (

      <div className="flex-1 flex items-center justify-center w-full relative">
        <div ref={containerRef} className="w-full h-full min-h-[500px] relative flex justify-between items-stretch gap-8 px-4 sm:px-10 py-6">
            
            {/* SVG Overlay for Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {lines.map((line) => (
                    <g key={`line-${line.id}`}>
                        {/* Background thick curve */}
                        <path d={line.pathData} fill="none" stroke="#e2e8f0" strokeWidth="12" strokeLinecap="round" />
                        {/* Foreground correct curve */}
                        <path d={line.pathData} fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round" className="animate-[dash_0.5s_ease-out_forwards]" />
                        <path d={line.pathData} fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round" className="animate-[dash_0.5s_ease-out_forwards]" />
                    </g>
                ))}
                
                {/* Temporary Wrong Curve */}
                {wrongLineSvg && (
                  <g>
                    <path d={wrongLineSvg.pathData} fill="none" stroke="#fecdd3" strokeWidth="12" strokeLinecap="round" />
                    <path d={wrongLineSvg.pathData} fill="none" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" className="animate-[dash_0.3s_ease-out_forwards]" />
                  </g>
                )}
            </svg>

            {/* Column A (Visually Right, Logical Source) */}
            <div className="flex flex-col justify-around w-[36%] sm:w-[40%] z-10 gap-3 sm:gap-4">
                {columnA.map((item) => {
                    const isSelected = selectedSource === item.id;
                    const isMatched = matchedIds.includes(item.id);
                    const isWrong = wrongAttempt && tempWrongLine?.sourceId === item.id;

                    return (
                        <button
                            key={`src-${item.id}`}
                            ref={el => sourceRefs.current[item.id] = el}
                            onClick={() => handleItemClick('source', item.id)}
                            disabled={isMatched}
                            className={`
                                relative w-full rounded-2xl sm:rounded-[2rem] flex flex-col items-center justify-center transition-all duration-300 p-3 sm:p-6 min-h-[100px] sm:min-h-[140px]
                                border-4 shadow-sm bg-white
                                ${isMatched ? 'bg-emerald-50/50 border-emerald-200 scale-95 opacity-50 cursor-default' : 
                                  isSelected ? 'border-sky-500 shadow-sky-200 scale-105 shadow-xl z-20 ring-4 ring-sky-100' : 
                                  'border-slate-100 hover:border-sky-300 hover:shadow-lg hover:-translate-y-1'}
                                ${isWrong ? 'animate-[shake_0.5s_ease-in-out] border-rose-500 bg-rose-50' : ''}
                            `}
                        >
                            {item.image && (
                              <img src={item.image} alt={item.label} className="w-16 h-16 sm:w-28 sm:h-28 object-contain mb-1 sm:mb-3 drop-shadow-md pointer-events-none transition-transform group-hover:scale-110" />
                            )}
                            {item.label && <span className={`text-base sm:text-2xl font-black ${item.image ? 'text-slate-700' : 'text-slate-600 text-xl sm:text-3xl'}`}>{item.label}</span>}
                            {!item.image && !item.label && (
                              <span className="text-sm sm:text-2xl font-black text-slate-300">صورة فارغة</span>
                            )}
                            
                            {/* Anchor point visual (Left side of card) */}
                            <div className={`absolute top-1/2 -left-[10px] sm:-left-[14px] -translate-y-1/2 w-4 h-4 sm:w-6 sm:h-6 rounded-full border-2 sm:border-4 border-white transition-all duration-300 z-20 shadow-sm
                                ${isMatched ? 'bg-emerald-500 border-emerald-100 scale-90' : isSelected ? 'bg-sky-500 scale-125 ring-2 ring-sky-200' : isWrong ? 'bg-rose-500' : 'bg-slate-300 hover:bg-sky-400'}
                            `} />
                        </button>
                    );
                })}
            </div>

            {/* Column B (Visually Left, Logical Target) */}
            <div className="flex flex-col justify-around w-[36%] sm:w-[40%] z-10 gap-3 sm:gap-4">
                 {columnB.map((item) => {
                    const isSelected = selectedTarget === item.id;
                    const isMatched = matchedIds.includes(item.id);
                    const isWrong = wrongAttempt && tempWrongLine?.targetId === item.id;

                    return (
                        <button
                            key={`tgt-${item.id}`}
                            ref={el => targetRefs.current[item.id] = el}
                            onClick={() => handleItemClick('target', item.id)}
                            disabled={isMatched}
                            className={`
                                relative w-full rounded-2xl sm:rounded-[2rem] flex flex-col items-center justify-center transition-all duration-300 p-3 sm:p-6 min-h-[100px] sm:min-h-[140px]
                                border-4 shadow-sm bg-white
                                ${isMatched ? 'bg-emerald-50/50 border-emerald-200 scale-95 opacity-50 cursor-default' : 
                                  isSelected ? 'border-sky-500 shadow-sky-200 scale-105 shadow-xl z-20 ring-4 ring-sky-100' : 
                                  'border-slate-100 hover:border-sky-300 hover:shadow-lg hover:-translate-y-1'}
                                ${isWrong ? 'animate-[shake_0.5s_ease-in-out] border-rose-500 bg-rose-50' : ''}
                            `}
                        >
                            {item.image && (
                              <img src={item.image} alt={item.label} className="w-16 h-16 sm:w-28 sm:h-28 object-contain mb-1 sm:mb-3 drop-shadow-md pointer-events-none transition-transform group-hover:scale-110" />
                            )}
                            {item.label && <span className={`text-base sm:text-2xl font-black ${item.image ? 'text-slate-700' : 'text-slate-600 text-xl sm:text-3xl'}`}>{item.label}</span>}
                            {!item.image && !item.label && (
                              <span className="text-sm sm:text-2xl font-black text-slate-300">صورة فارغة</span>
                            )}
                            
                            {/* Anchor point visual (Right side of card) */}
                            <div className={`absolute top-1/2 -right-[10px] sm:-right-[14px] -translate-y-1/2 w-4 h-4 sm:w-6 sm:h-6 rounded-full border-2 sm:border-4 border-white transition-all duration-300 z-20 shadow-sm
                                ${isMatched ? 'bg-emerald-500 border-emerald-100 scale-90' : isSelected ? 'bg-sky-500 scale-125 ring-2 ring-sky-200' : isWrong ? 'bg-rose-500' : 'bg-slate-300 hover:bg-sky-400'}
                            `} />
                        </button>
                    );
                })}
            </div>

        </div>
      </div>
      )}
    </div>
  );
}
