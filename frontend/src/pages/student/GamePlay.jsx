import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import lottie from 'lottie-web';
import Button from '../../components/Button';
import ConfirmModal from '../../components/ConfirmModal';
import GameEngine from '../../games/GameEngine';
import normalizeGameForEngine from '../../games/adapters/normalizeGameForEngine';
import { useTherapyStore } from '../../hooks/useTherapyStore';
import { useTherapySounds } from '../../hooks/useTherapySounds';
import gameService from '../../services/gameService';
import { computeSessionMetrics } from '../../utils/sessionMetrics';
import { silenceSiteAudio, stopGameAudio } from '../../utils/soundEffects';
import loadingAnimation from '../../assets/Animation/2 ani.json';

const GamePlay = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { gameId } = useParams();
  const isPublicPlay = location.pathname.startsWith('/play/');
  const isFreeMode = new URLSearchParams(location.search).get('mode') === 'free';
  const isFreePlay = isPublicPlay || isFreeMode || location.state?.isFreePlay || false;
  const {
    currentStudent,
    studentSession,
    mapFrontendPromptToApi,
    saveSession,
  } = useTherapyStore();

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showIntroVideo, setShowIntroVideo] = useState(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [completedSessionData, setCompletedSessionData] = useState(null);
  const loadingAnimationRef = useRef(null);
  const completionSoundPlayedRef = useRef(false);
  const { playLevelComplete } = useTherapySounds({ soundEnabled: true });
  const currentLevel = Math.min(Math.max(Number(currentStudent?.currentLevel || 1), 1), 3);
  const assignedGame = useMemo(
    () =>
      Array.isArray(currentStudent?.assignedGames)
        ? currentStudent.assignedGames.find((item) => String(item?.id) === String(gameId)) || null
        : null,
    [currentStudent, gameId]
  );

  useEffect(() => {
    const fetchGame = async () => {
      try {
        setLoading(true);
        setError('');
        if (!isFreePlay && !isPublicPlay && currentStudent && !assignedGame) {
          setGame(null);
          setError('هذه اللعبة غير مخصصة في الخطة العلاجية الحالية.');
          return;
        }

        const token = isFreePlay || isPublicPlay ? null : studentSession?.token;
        const response = await gameService.getGame(token, gameId);
        setGame(normalizeGameForEngine(response));
      } catch {
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
  }, [assignedGame, currentStudent, gameId, isFreePlay, isPublicPlay, studentSession?.token]);

  const introVideo = game?.config?.media?.introVideo || '';
  const introVideoVisible = showIntroVideo ?? Boolean(introVideo);

  useEffect(() => {
    if (!completedSessionData || completionSoundPlayedRef.current) return;

    completionSoundPlayedRef.current = true;
    playLevelComplete();
  }, [completedSessionData, playLevelComplete]);

  useEffect(() => {
    document.body.classList.toggle('confirm-modal-open', showExitConfirm);

    if (showExitConfirm) {
      silenceSiteAudio();
    }

    return () => {
      document.body.classList.remove('confirm-modal-open');
    };
  }, [showExitConfirm]);

  useEffect(() => {
    const handleBackgroundAudioStop = () => {
      silenceSiteAudio({ resetTrackedAudio: false });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleBackgroundAudioStop();
      }
    };

    window.addEventListener('blur', handleBackgroundAudioStop);
    window.addEventListener('pagehide', handleBackgroundAudioStop);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleBackgroundAudioStop);
      window.removeEventListener('pagehide', handleBackgroundAudioStop);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!loading || !loadingAnimationRef.current) {
      return undefined;
    }

    const instance = lottie.loadAnimation({
      container: loadingAnimationRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: loadingAnimation,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid meet',
      },
    });

    return () => {
      instance.destroy();
    };
  }, [loading]);

  const handleGameComplete = async (stats) => {
    if (!game) {
      return;
    }

    const metrics = computeSessionMetrics(stats);

    const sessionData = {
      gameType: game.type,
      level: game.level,
      activityCount: metrics.activityCount,
      correctAnswers: stats.correctAnswers || 0,
      wrongAnswers: stats.wrongAnswers || 0,
      helpCount: stats.helpCount || 0,
      score: metrics.score,
      accuracyScore: metrics.accuracyScore,
      completionScore: metrics.completionScore,
      independenceRate: metrics.independenceRate,
      totalAttempts: metrics.totalAttempts,
      therapistMode: false,
      sessionType: isFreePlay ? 'FREE_PLAY' : 'HOME',
      promptSummary: metrics.promptSummary,
      timeSpent: stats.timeSpent || 0,
      isFreePlay,
    };

    stopGameAudio();

    if (isFreePlay) {
      if (isPublicPlay) {
        setCompletedSessionData(sessionData);
      } else {
        navigate('/student/result', { state: { game, sessionData } });
      }
      return;
    }

    if (!currentStudent) {
      return;
    }

    const sessionPayload = {
      studentId: currentStudent.id,
      gameId: game.id,
      score: metrics.score,
      attempts: metrics.totalAttempts,
      duration: stats.timeSpent || 0,
      sessionType: 'HOME',
      promptLevel: mapFrontendPromptToApi(metrics.computedPrompt),
    };

    try {
      const savedSession = await saveSession(sessionPayload);
      navigate('/student/result', {
        state: {
          game,
          sessionData: {
            ...sessionData,
            ...savedSession,
          },
        },
      });
    } catch (saveError) {
      setError(saveError?.response?.data?.message || saveError?.message || 'تعذر حفظ نتيجة الجلسة.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-start gap-4 px-4 pt-10 text-center md:gap-5 md:pt-14" dir="rtl">
        <div className="relative flex h-48 w-48 items-center justify-center md:h-56 md:w-56">
          <div className="absolute inset-0 rounded-full bg-sky-100/65 blur-2xl" />
          <div className="absolute inset-[12%] rounded-full bg-cyan-100/45 blur-3xl" />
          <div ref={loadingAnimationRef} className="relative z-10 h-full w-full scale-[1.05] md:scale-[1.08]" />
        </div>
        <div className="text-2xl font-black text-slate-700 md:text-3xl">جارٍ تجهيز الجلسة...</div>
        <div className="max-w-md text-sm font-semibold leading-7 text-slate-500 md:text-base">
          لو الإنترنت بطيء، هتفضل الشاشة دي ظاهرة لحد ما تكتمل البيانات.
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-[#eadfbe] p-10 text-center">
        <h2 className="text-3xl font-black text-slate-800 mb-4">{error || 'تعذر العثور على اللعبة'}</h2>
        <Button variant="primary" onClick={() => navigate(isPublicPlay ? '/' : '/student/home')}>
          العودة
        </Button>
      </div>
    );
  }

  if (completedSessionData) {
    return (
      <div className="mx-auto flex min-h-[85vh] max-w-3xl items-center justify-center" dir="rtl">
        <div className="w-full rounded-[3rem] border border-[#dbe7f3] bg-white p-8 text-center shadow-xl shadow-sky-100/60 md:p-10">
          <div className="mx-auto mb-6 grid h-24 w-24 place-items-center rounded-[2rem] bg-[#EAF7FD] text-[#1584C3]">
            <ShieldCheck size={46} />
          </div>
          <h1 className="mb-3 text-4xl font-black text-slate-900">أحسنت!</h1>
          <p className="mx-auto mb-8 max-w-xl text-lg font-bold leading-8 text-slate-600">
            أنهيت لعبة <span className="font-black text-slate-900">{game?.titleAr || game?.title || 'اللعبة'}</span> بنجاح. هذا لعب حر ولا يتم حفظه في تقارير أي طالب.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button variant="primary" onClick={() => window.location.reload()}>
              العب مرة أخرى
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              العودة
            </Button>
          </div>
        </div>
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

      {introVideo && introVideoVisible ? (
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
            <Button variant="outline" onClick={() => navigate(isPublicPlay ? '/' : '/student/home')}>
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

          <div
            className={`transition-all duration-150 ${
              showExitConfirm ? 'pointer-events-none select-none opacity-0' : 'opacity-100'
            }`}
          >
            <GameEngine
              game={game}
              onComplete={handleGameComplete}
              therapistControlsEnabled={false}
              therapistPromptLevel={'none'}
              onUnsupported={() => navigate(isPublicPlay ? '/' : '/student/home')}
              startLevel={currentLevel}
              assistantSuspended={showExitConfirm}
              assistantOptions={{
                idleTime: Number(game?.config?.assistant?.idleTime || 8000),
                hintLevel1: game?.config?.assistant?.hintLevel1 || undefined,
                hintLevel2: game?.config?.assistant?.hintLevel2 || undefined,
                hintLevel3: game?.config?.assistant?.hintLevel3 || undefined,
                audioText: game?.config?.assistant?.audioText || undefined,
                helpVoiceEnabled: false,
              }}
              onExit={() => setShowExitConfirm(true)}
            />
          </div>

          <ConfirmModal
            isOpen={showExitConfirm}
            onClose={() => setShowExitConfirm(false)}
            onConfirm={() => {
              setShowExitConfirm(false);
              navigate(isPublicPlay ? '/' : '/student/home');
            }}
            title="الخروج من اللعبة"
            message="هل تود الخروج من اللعبة الآن؟ لن يتم حفظ أي تقدم في هذه الجلسة، ولن يؤثر ذلك على التقييم."
            confirmText="خروج"
            cancelText="إلغاء"
            isDestructive={false}
            hideCancelButton
            position="top"
          />
        </>
      )}
    </div>
  );
};

export default GamePlay;
