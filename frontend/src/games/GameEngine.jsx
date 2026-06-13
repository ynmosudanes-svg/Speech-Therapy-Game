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
  onExit,
}) => {
  const [activityIndex, setActivityIndex] = useState(0);
  const [aggregateStats, setAggregateStats] = useState({
    correctAnswers: 0,
    wrongAnswers: 0,
    attempts: [],
    prompts: [],
    helpsPerActivity: [],
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
      helpsPerActivity: [],
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
    templateType: currentActivity.type || game?.type,
    activity: currentActivity,
    sharedMedia: config?.media || {},
    gameId: `${game.id}-${activeLevel.levelNumber}-${currentActivity.id}`,
  });

  const idleTime = assistantOptions?.idleTime || 15000;
  const helpVoiceEnabled = assistantOptions?.helpVoiceEnabled ?? false;

  const registerAssistantActions = useCallback((actions = {}) => {
    assistantActionsRef.current = actions;
  }, []);

  const pauseAssistant = useCallback(() => {
    assistantRef.current?.pauseAssistant?.();
  }, []);

  const stopAssistant = useCallback(() => {
    assistantRef.current?.stopAssistant?.();
  }, []);

  useEffect(() => {
    assistantRef.current?.resetAssistant?.();
  }, [activityIndex, game?.id]);

  useEffect(() => () => {
    assistantRef.current?.stopAssistant?.();
  }, []);

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
    const helpsUsed = assistantRef.current?.getHelpsUsed?.() || [];
    const helpCount = assistantRef.current?.getHelpCount?.() || 0;

    assistantRef.current?.stopAssistant?.();

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
      helpsPerActivity: [...(aggregateStats.helpsPerActivity || []), helpsUsed],
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
        
        <div className="flex-1 text-center px-1 md:px-4">
          <h1 className="text-xs sm:text-sm md:text-2xl lg:text-3xl font-extrabold text-indigo-700 leading-tight md:leading-9 line-clamp-2">
            {game?.config?.nameAr || game?.titleAr || game?.name || 'لعبة تخاطب'}
          </h1>
        </div>

        {onExit && (
          <button
            onClick={onExit}
            className="w-8 h-8 md:w-12 md:h-12 mr-1.5 md:mr-2 bg-rose-100 hover:bg-rose-500 hover:text-white text-rose-600 rounded-full flex items-center justify-center transition-all flex-shrink-0"
            title="خروج من اللعبة"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        )}
      </div>

      {renderGameActivity({
        game: runtimeGame,
        onComplete: handleActivityComplete,
        therapistControlsEnabled,
        therapistPromptLevel,
        onAssistantInteraction: pauseAssistant,
        registerAssistantActions,
        helpVoiceEnabled,
      })}

      <GameAssistant
        ref={assistantRef}
        idleTime={idleTime}
        voiceEnabled={helpVoiceEnabled}
        onVisualHint={handleVisualHint}
        onGestureHint={handleGestureHint}
        onVerbalHint={handleVerbalHint}
        onPhysicalPrompt={handlePhysicalPrompt}
      />
    </div>
  );
};

export default GameEngine;
