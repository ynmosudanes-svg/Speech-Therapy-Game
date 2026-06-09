import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Button from '../components/Button';
import GameAssistant from '../components/game/GameAssistant';
import renderGameActivity from './renderGameActivity';
import { buildActivityRuntimeGame } from './adapters/buildActivityPreviewGame';

const GameEngine = ({
  game,
  onComplete,
  therapistControlsEnabled = false,
  therapistPromptLevel = 'none',
  onUnsupported,
  startLevel = 1,
  assistantOptions = {},
}) => {
  const [activityIndex, setActivityIndex] = useState(0);
  const [aggregateStats, setAggregateStats] = useState({
    correctAnswers: 0,
    wrongAnswers: 0,
    attempts: [],
    prompts: [],
    timeSpent: 0,
  });
  const assistantRef = useRef(null);
  const assistantActionsRef = useRef({});

  const config = game?.config || {};
  const levels = Array.isArray(config?.levels) ? config.levels : [];
  const activeLevel = useMemo(
    () => levels.find((level) => Number(level.levelNumber) === Number(startLevel)) || levels[0] || null,
    [levels, startLevel]
  );
  const activities = Array.isArray(activeLevel?.activities) ? activeLevel.activities : [];
  const currentActivity = activities[activityIndex] || null;

  useEffect(() => {
    setActivityIndex(0);
    setAggregateStats({
      correctAnswers: 0,
      wrongAnswers: 0,
      attempts: [],
      prompts: [],
      timeSpent: 0,
    });
  }, [game?.id, startLevel]);

  if (!game || !config?.version || !activeLevel) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-[#eadfbe] p-10 text-center">
        <h2 className="text-3xl font-black text-slate-800 mb-4">هذه اللعبة غير مكتملة الإعداد</h2>
        <Button variant="primary" onClick={onUnsupported}>
          العودة
        </Button>
      </div>
    );
  }

  if (!activities.length) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-[#eadfbe] p-10 text-center">
        <h2 className="text-3xl font-black text-slate-800 mb-4">هذا المستوى لا يحتوي أنشطة بعد</h2>
        <Button variant="primary" onClick={onUnsupported}>
          العودة
        </Button>
      </div>
    );
  }

  if (!currentActivity) {
    return null;
  }

  const runtimeGame = buildActivityRuntimeGame({
    nameAr: config?.nameAr || game?.titleAr || game?.name,
    templateType: game?.type,
    activity: currentActivity,
    sharedMedia: config?.media || {},
    gameId: `${game.id}-${activeLevel.levelNumber}-${currentActivity.id}`,
  });

  const idleTime = assistantOptions?.idleTime || 7000;

  const registerAssistantActions = (actions = {}) => {
    assistantActionsRef.current = actions;
  };

  const resetAssistant = () => {
    assistantRef.current?.resetAssistant?.();
  };

  /* ── 4 hint callbacks: delegate to the game via assistantActionsRef ── */
  const handleVisualHint = () => {
    assistantActionsRef.current?.onVisualHint?.();
  };

  const handleGestureHint = () => {
    assistantActionsRef.current?.onGestureHint?.();
  };

  const handleVerbalHint = () => {
    assistantActionsRef.current?.onVerbalHint?.();
  };

  const handlePhysicalPrompt = () => {
    assistantActionsRef.current?.onPhysicalPrompt?.();
  };

  const handleActivityComplete = (stats) => {
    // Gather help data from assistant
    const helpsUsed = assistantRef.current?.getHelpsUsed?.() || [];
    const helpCount = assistantRef.current?.getHelpCount?.() || 0;

    const enrichedStats = {
      ...stats,
      questionId: currentActivity?.id || '',
      helpsUsed,
      helpCount,
    };

    const nextStats = {
      correctAnswers: aggregateStats.correctAnswers + (enrichedStats?.correctAnswers || 0),
      wrongAnswers: aggregateStats.wrongAnswers + (enrichedStats?.wrongAnswers || 0),
      attempts: [...aggregateStats.attempts, ...(Array.isArray(enrichedStats?.attempts) ? enrichedStats.attempts : [])],
      prompts: [...aggregateStats.prompts, ...(Array.isArray(enrichedStats?.prompts) ? enrichedStats.prompts : [])],
      timeSpent: aggregateStats.timeSpent + (enrichedStats?.timeSpent || 0),
      helpsUsed: [...(aggregateStats.helpsUsed || []), ...helpsUsed],
      helpCount: (aggregateStats.helpCount || 0) + helpCount,
    };

    if (activityIndex >= activities.length - 1) {
      onComplete(nextStats);
      return;
    }

    setAggregateStats(nextStats);
    setActivityIndex((current) => current + 1);
  };

  return (
    <div className="relative space-y-5 pb-28">
      {/* الهيدر الموحد للعبة (عنوان، مستوى، نشاط) */}
      <div className="w-full mx-auto flex justify-between items-center bg-white/80 backdrop-blur-sm p-3 md:p-4 rounded-[2rem] md:rounded-3xl shadow-sm border-2 border-white mb-2 md:mb-4">
        <div className="text-center px-3 py-1.5 md:px-4 md:py-2 bg-indigo-100 rounded-xl md:rounded-2xl min-w-[4rem] md:min-w-[5rem]">
          <span className="block text-[10px] md:text-sm text-indigo-600 font-bold mb-0.5 md:mb-1">النشاط</span>
          <span className="text-base md:text-xl font-extrabold text-indigo-900" dir="ltr">
            {activityIndex + 1} / {activities.length}
          </span>
        </div>
        
        <div className="flex-1 text-center px-2 md:px-4">
          <h1 className="text-lg md:text-3xl lg:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500 tracking-tight leading-relaxed">
            {game?.config?.nameAr || game?.titleAr || game?.name || 'لعبة تخاطب'}
          </h1>
        </div>

        <div className="text-center px-3 py-1.5 md:px-4 md:py-2 bg-sky-100 rounded-xl md:rounded-2xl min-w-[4rem] md:min-w-[5rem]">
          <span className="block text-[10px] md:text-sm text-sky-600 font-bold mb-0.5 md:mb-1">المستوى</span>
          <span className="text-base md:text-xl font-extrabold text-sky-900">
            {activeLevel.levelNumber}
          </span>
        </div>
      </div>

      {renderGameActivity({
        game: runtimeGame,
        onComplete: handleActivityComplete,
        therapistControlsEnabled,
        therapistPromptLevel,
        onAssistantInteraction: resetAssistant,
        registerAssistantActions,
      })}

      <GameAssistant
        ref={assistantRef}
        idleTime={idleTime}
        onVisualHint={handleVisualHint}
        onGestureHint={handleGestureHint}
        onVerbalHint={handleVerbalHint}
        onPhysicalPrompt={handlePhysicalPrompt}
      />
    </div>
  );
};

export default GameEngine;
