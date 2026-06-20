import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle2, Home, Sparkles, Trophy } from 'lucide-react';
import Button from '../../components/Button';
import { useTherapySounds } from '../../hooks/useTherapySounds';
import { stopGameAudio } from '../../utils/soundEffects';

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { game, sessionData } = location.state || {};
  const { playLevelComplete } = useTherapySounds({ soundEnabled: true });

  useEffect(() => {
    stopGameAudio();
  }, []);

  useEffect(() => {
    playLevelComplete();
  }, [playLevelComplete]);

  useEffect(() => {
    const burst = { particleCount: 42, spread: 58, ticks: 95, gravity: 1.1, startVelocity: 30, zIndex: 50 };

    confetti({ ...burst, angle: 60, origin: { x: 0.1, y: 0.7 } });
    confetti({ ...burst, angle: 120, origin: { x: 0.9, y: 0.7 } });

    const followUp = window.setTimeout(() => {
      confetti({
        particleCount: 35,
        spread: 80,
        ticks: 90,
        gravity: 1.1,
        startVelocity: 26,
        origin: { y: 0.55 },
        zIndex: 50,
      });
    }, 350);

    return () => {
      window.clearTimeout(followUp);
      confetti.reset();
    };
  }, []);

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-8rem)] max-w-5xl items-center px-3 py-4 md:px-6 md:py-6">
      <div className="grid w-full gap-5 rounded-[2.25rem] border border-[#dceaf3] bg-white/90 p-5 shadow-[0_22px_60px_-32px_rgba(15,111,166,0.25)] backdrop-blur-sm md:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] md:gap-6 md:p-7">
        <div className="flex flex-col items-center text-center md:items-start md:text-right">
          <div className="mb-4 grid h-20 w-20 place-items-center rounded-[1.6rem] bg-[#edf8ff] md:mb-5 md:h-24 md:w-24">
            <Trophy size={44} className="text-[#178bb6] md:size-12" />
          </div>

          <h1 className="mb-3 text-4xl font-black text-slate-900 md:text-5xl">أحسنت!</h1>
          <p className="max-w-xl text-lg leading-8 text-slate-600 md:text-xl md:leading-9">
            أنهيت لعبة <span className="font-black text-slate-900">{game?.titleAr || 'اللعبة'}</span> بنجاح.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 md:justify-start">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={`result-star-${index}`}
                className="grid h-11 w-11 place-items-center rounded-full bg-amber-50 text-amber-500 shadow-[0_10px_24px_-16px_rgba(245,158,11,0.55)]"
              >
                <Sparkles size={18} />
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-2 font-black text-emerald-700">
            <CheckCircle2 size={19} />
            <span>يمكنك بدء لعبة جديدة الآن</span>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button
              variant="primary"
              className="text-lg !rounded-[1.35rem] !py-3.5 px-8"
              onClick={() => navigate('/student/home')}
            >
              <Home size={20} />
              <span>ألعاب أخرى</span>
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {sessionData?.isFreePlay ? (
            <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50/90 p-4 text-right">
              <p className="text-base font-bold leading-7 text-slate-700">
                لعب حر من المكتبة (لا يُسجل في التقارير)
              </p>
            </div>
          ) : sessionData ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.5rem] border border-sky-100 bg-sky-50/80 p-4 text-right">
                  <div className="mb-2 text-xs font-black text-[#178bb6]">الإجابات الصحيحة</div>
                  <div className="text-3xl font-black text-slate-900">
                    {sessionData.correctAnswers || 0}/{sessionData.activityCount || 0}
                  </div>
                </div>
                <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/80 p-4 text-right">
                  <div className="mb-2 text-xs font-black text-emerald-700">عدد المساعدات</div>
                  <div className="text-3xl font-black text-slate-900">{sessionData.helpCount || 0}</div>
                </div>
                <div className="rounded-[1.5rem] border border-amber-100 bg-amber-50/80 p-4 text-right">
                  <div className="mb-2 text-xs font-black text-amber-700">إجمالي المحاولات</div>
                  <div className="text-3xl font-black text-slate-900">{sessionData.totalAttempts || 0}</div>
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-slate-200 bg-white/90 p-4 text-right">
                <p className="text-sm font-bold leading-7 text-slate-600">
                  عدد الأنشطة: {sessionData.activityCount || 0}
                  {typeof sessionData.completionScore === 'number' ? ` - الإكمال: ${sessionData.completionScore}%` : ''}
                </p>
              </div>
            </>
          ) : null}

          {!sessionData?.isFreePlay && sessionData?.promptSummary?.length > 0 && (
            <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50/90 p-4 text-right">
              <div className="mb-3 flex items-center gap-2 font-black text-slate-900">
                <Sparkles size={18} className="text-[#178bb6]" />
                <span>مستوى المساعدة المستخدم</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sessionData.promptSummary.map((prompt, index) => (
                  <span
                    key={`${prompt}-${index}`}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-700"
                  >
                    {prompt}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Result;
