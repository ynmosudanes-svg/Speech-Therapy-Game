import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';
import Button from '../components/Button';
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
  assistantSuspended = false,
  onExit,
}) => {
  const [activityIndex, setActivityIndex] = useState(0);
  const [activityRunKey, setActivityRunKey] = useState(0);
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
    [levels, startLevel],
  );
  const activities = Array.isArray(activeLevel?.activities) ? activeLevel.activities : [];
  const currentActivity = activities[activityIndex] || null;

  useEffect(() => {
    setActivityIndex(0);
    setActivityRunKey(0);
    setAggregateStats({
      correctAnswers: 0,
      wrongAnswers: 0,
      attempts: [],
      prompts: [],
      helpsPerActivity: [],
      timeSpent: 0,
    });
  }, [game?.id, startLevel]);

  const registerAssistantActions = useCallback((actions = {}) => {
    assistantActionsRef.current = actions;
  }, []);

  const pauseAssistant = useCallback(() => {
    assistantRef.current?.pauseAssistant?.();
  }, []);

  useEffect(() => {
    assistantRef.current?.resetAssistant?.();
  }, [activityIndex, activityRunKey, game?.id]);

  useEffect(() => {
    if (assistantSuspended) {
      assistantRef.current?.stopAssistant?.();
      return;
    }

    assistantRef.current?.resetAssistant?.();
  }, [assistantSuspended, activityIndex, activityRunKey, game?.id]);

  useEffect(() => () => {
    assistantRef.current?.stopAssistant?.();
  }, []);

  const handleRestartActivity = () => {
    assistantRef.current?.stopAssistant?.();
    assistantActionsRef.current = {};
    setActivityRunKey((current) => current + 1);
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
    setActivityRunKey(0);
    setActivityIndex((current) => current + 1);
  };

  if (!game || !config?.version || !activeLevel) {
    return (
      <div className="rounded-[2.5rem] border border-[#eadfbe] bg-white p-10 text-center">
        <h2 className="mb-4 text-3xl font-black text-slate-800">هذه اللعبة غير مكتملة الإعداد</h2>
        <Button variant="primary" onClick={onUnsupported}>
          العودة
        </Button>
      </div>
    );
  }

  if (!activities.length) {
    return (
      <div className="rounded-[2.5rem] border border-[#eadfbe] bg-white p-10 text-center">
        <h2 className="mb-4 text-3xl font-black text-slate-800">هذا المستوى لا يحتوي أنشطة بعد</h2>
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
    gameId: `${game.id}-${activeLevel.levelNumber}-${currentActivity.id}-${activityRunKey}`,
  });

  const idleTime = assistantOptions?.idleTime || 15000;
  const helpVoiceEnabled = assistantOptions?.helpVoiceEnabled ?? false;
  const progress = ((activityIndex + 1) / Math.max(activities.length, 1)) * 100;

  return (
    <div className="relative space-y-3 pb-20 md:space-y-4 md:pb-28">
      <div className="game-engine-header relative z-20 mx-auto flex w-full max-w-2xl items-center gap-2 px-2 py-1.5 md:px-3">
        {onExit && (
          <button
            type="button"
            onClick={onExit}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-500 transition-all hover:-translate-y-0.5 hover:bg-rose-100 active:scale-95 md:h-10 md:w-10"
            title="خروج من اللعبة"
          >
            <X className="h-5 w-5 md:h-[22px] md:w-[22px]" strokeWidth={3} />
          </button>
        )}

        <button
          type="button"
          onClick={handleRestartActivity}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#cdeef7] bg-white/92 text-[#19add6] shadow-[0_10px_20px_-14px_rgba(25,173,214,0.45)] transition-all hover:-translate-y-0.5 hover:bg-[#eefafd] active:scale-95 md:h-10 md:w-10"
          title="إعادة النشاط"
        >
          <RotateCcw className="h-5 w-5 md:h-[22px] md:w-[22px]" strokeWidth={2.5} />
        </button>

        <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200/80 md:h-2.5">
          <div
            className="h-full rounded-full bg-[#19add6] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div key={`${currentActivity.id}-${activityRunKey}`}>
        {renderGameActivity({
          game: runtimeGame,
          onComplete: handleActivityComplete,
          therapistControlsEnabled,
          therapistPromptLevel,
          onAssistantInteraction: pauseAssistant,
          registerAssistantActions,
          helpVoiceEnabled,
          assistantOptions: {
            ...assistantOptions,
            idleTime,
          },
        })}
      </div>
    </div>
  );
};

export default GameEngine;
