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
  assistantSuspended = false,
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

  useEffect(() => {
    if (assistantSuspended) {
      assistantRef.current?.stopAssistant?.();
      return;
    }

    assistantRef.current?.resetAssistant?.();
  }, [assistantSuspended, activityIndex, game?.id]);

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
    <div className="relative space-y-3 md:space-y-5 pb-20 md:pb-28">
      {/* الهيدر الموحد للعبة (عنوان، مستوى، نشاط) */}
      <div className="game-engine-header relative z-20 w-full max-w-5xl xl:max-w-[980px] mx-auto bg-white/80 backdrop-blur-sm px-4 py-3 md:px-5 md:py-4 rounded-[1.45rem] md:rounded-3xl shadow-sm border-2 border-white mb-1 md:mb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="w-8 md:w-12 shrink-0" />

          <div className="flex-1 text-center px-2 md:px-4">
            <h1 className="text-[11px] sm:text-sm md:text-2xl lg:text-3xl font-extrabold text-indigo-700 leading-tight md:leading-9 line-clamp-2">
              {game?.config?.nameAr || game?.titleAr || game?.name || 'لعبة تخاطب'}
            </h1>
          </div>

          {onExit ? (
            <button
              onClick={onExit}
              className="w-8 h-8 md:w-12 md:h-12 bg-rose-100 hover:bg-rose-500 hover:text-white text-rose-600 rounded-full flex items-center justify-center transition-all flex-shrink-0"
              title="خروج من اللعبة"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          ) : (
            <div className="w-8 md:w-12 shrink-0" />
          )}
        </div>

        <div className="mt-3 md:mt-4">
          <div className="mb-2 flex items-center justify-between text-[11px] md:text-xl font-black text-slate-400">
            <span>البداية</span>
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-indigo-600 shadow-sm">
              المرحلة {activityIndex + 1} من {activities.length}
            </span>
            <span>النهاية</span>
          </div>

          <div className="h-4 md:h-5 rounded-full bg-slate-100/95 border border-white/90 shadow-inner overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-300 via-indigo-400 to-fuchsia-400 transition-all duration-500 ease-out"
              style={{ width: `${((activityIndex + 1) / Math.max(activities.length, 1)) * 100}%` }}
            />
          </div>
        </div>
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

      {!assistantSuspended && (
        <GameAssistant
          ref={assistantRef}
          idleTime={idleTime}
          voiceEnabled={helpVoiceEnabled}
          onVisualHint={handleVisualHint}
          onGestureHint={handleGestureHint}
          onVerbalHint={handleVerbalHint}
          onPhysicalPrompt={handlePhysicalPrompt}
        />
      )}
    </div>
  );
};

export default GameEngine;
