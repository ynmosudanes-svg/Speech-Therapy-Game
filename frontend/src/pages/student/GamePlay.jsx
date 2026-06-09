import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { DoorOpen, ShieldCheck } from 'lucide-react';
import Button from '../../components/Button';
import GameEngine from '../../games/GameEngine';
import normalizeGameForEngine from '../../games/adapters/normalizeGameForEngine';
import { PROMPT_LEVELS, useTherapyStore } from '../../hooks/useTherapyStore';
import gameService from '../../services/gameService';

const GamePlay = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { gameId } = useParams();
  const isFreePlay = location.state?.isFreePlay || false;
  const {
    currentStudent,
    mapFrontendPromptToApi,
    saveSession,
  } = useTherapyStore();

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showIntroVideo, setShowIntroVideo] = useState(false);
  const currentLevel = Math.min(Math.max(Number(currentStudent?.currentLevel || 1), 1), 3);
  const assignedGame = useMemo(
    () =>
      Array.isArray(currentStudent?.assignedGames)
        ? currentStudent.assignedGames.find((item) => String(item?.id) === String(gameId)) || null
        : null,
    [currentStudent?.assignedGames, gameId]
  );

  useEffect(() => {
    const fetchGame = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await gameService.getGame(null, gameId);
        setGame(normalizeGameForEngine(response));
      } catch (_fetchError) {
        // Fallback to cached assignedGame if offline or fetch fails
        if (assignedGame?.config) {
          setGame(normalizeGameForEngine(assignedGame));
          setError('');
          return;
        }

        setError('تعذر تحميل اللعبة.');
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [assignedGame, gameId]);

  const introVideo = game?.config?.media?.introVideo || '';

  useEffect(() => {
    setShowIntroVideo(Boolean(introVideo));
  }, [introVideo, game?.id]);

  const handleGameComplete = async (stats) => {
    if (!currentStudent || !game) {
      return;
    }

    const totalQuestions = (stats.correctAnswers || 0) + (stats.wrongAnswers || 0) || 1;
    const score = Math.round(((stats.correctAnswers || 0) / totalQuestions) * 100);
    const promptHistory = Array.isArray(stats.prompts) ? stats.prompts : [];
    const independentCount = promptHistory.filter((prompt) => prompt === 'none').length;
    const independenceRate = promptHistory.length
      ? Math.round((independentCount / promptHistory.length) * 100)
      : 100;

    const promptSummary = promptHistory.map(
      (prompt) => PROMPT_LEVELS.find((level) => level.id === prompt)?.label || prompt
    );

    const helps = Array.isArray(stats.helpsUsed) ? stats.helpsUsed : [];
    let computedPrompt = 'none';
    if (helps.includes('physical')) {
      computedPrompt = 'physical';
    } else if (helps.includes('verbal')) {
      computedPrompt = 'verbal';
    } else if (helps.includes('gesture')) {
      computedPrompt = 'gestural';
    } else if (helps.includes('visual')) {
      computedPrompt = 'visual';
    }

    const sessionPayload = {
      studentId: currentStudent.id,
      gameId: game.id,
      score,
      attempts: Array.isArray(stats.attempts)
        ? stats.attempts.reduce((sum, value) => sum + value, 0)
        : stats.attempts || totalQuestions,
      duration: stats.timeSpent || 0,
      sessionType: isFreePlay ? 'FREE_PLAY' : 'HOME',
      promptLevel: mapFrontendPromptToApi(computedPrompt),
    };

    try {
      const savedSession = await saveSession(sessionPayload);
      const sessionData = {
        ...savedSession,
        gameType: game.type,
        level: game.level,
        totalQuestions,
        correctAnswers: stats.correctAnswers || 0,
        wrongAnswers: stats.wrongAnswers || 0,
        score,
        independenceRate,
        therapistMode: false,
        sessionType: sessionPayload.sessionType,
        promptSummary,
        timeSpent: stats.timeSpent || 0,
      };

      navigate('/student/result', { state: { game, sessionData } });
    } catch (saveError) {
      setError(saveError?.response?.data?.message || saveError?.message || 'تعذر حفظ نتيجة الجلسة.');
    }
  };

  if (loading) {
    return <div className="text-center py-24 text-3xl font-black text-slate-700">جارٍ تجهيز الجلسة...</div>;
  }

  if (!game) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-[#eadfbe] p-10 text-center">
        <h2 className="text-3xl font-black text-slate-800 mb-4">{error || 'تعذر العثور على اللعبة'}</h2>
        <Button variant="primary" onClick={() => navigate('/student/home')}>
          العودة
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5" dir="rtl">


      {error && (
        <div className="rounded-3xl bg-red-50 border border-red-100 px-5 py-4 text-red-600 font-bold">
          {error}
        </div>
      )}

      {introVideo && showIntroVideo ? (
        <section className="bg-white rounded-[2.5rem] border border-[#dbe7f3] p-5 md:p-6 shadow-sm space-y-4">
          <div className="text-center">
            <div className="text-sm font-bold text-slate-500 mb-2">شرح اللعبة</div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">شاهد الطريقة أولًا ثم ابدأ</h2>
          </div>

          <div className="w-full max-w-4xl mx-auto rounded-[2rem] overflow-hidden border border-slate-200 bg-black shadow-lg">
            <video
              controls
              autoPlay
              playsInline
              src={introVideo}
              className="w-full h-auto max-h-[50vh] object-contain"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="primary" onClick={() => setShowIntroVideo(false)}>
              ابدأ اللعب
            </Button>
            <Button variant="outline" onClick={() => navigate('/student/home')}>
              العودة
            </Button>
          </div>
        </section>
      ) : (
        <>
          {introVideo && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setShowIntroVideo(true)}>
                مشاهدة الشرح مرة أخرى
              </Button>
            </div>
          )}

          <GameEngine
            game={game}
            onComplete={handleGameComplete}
            therapistControlsEnabled={false}
            therapistPromptLevel={'none'}
            onUnsupported={() => navigate('/student/home')}
            startLevel={currentLevel}
            assistantOptions={{
              idleTime: Number(game?.config?.assistant?.idleTime || 7000),
              hintLevel1: game?.config?.assistant?.hintLevel1 || undefined,
              hintLevel2: game?.config?.assistant?.hintLevel2 || undefined,
              hintLevel3: game?.config?.assistant?.hintLevel3 || undefined,
              audioText: game?.config?.assistant?.audioText || undefined,
            }}
          />
        </>
      )}
    </div>
  );
};

export default GamePlay;
