import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle2, Home, Sparkles, Trophy } from 'lucide-react';
import Button from '../../components/Button';
import { stopGameAudio } from '../../utils/soundEffects';

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { game, sessionData } = location.state || {};

  useEffect(() => {
    stopGameAudio();
  }, []);

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
    <div className="max-w-4xl mx-auto py-6">
      <div className="bg-white rounded-[3rem] border border-[#f0dda7] p-8 md:p-10 text-center shadow-xl shadow-amber-100/40">
        <div className="w-28 h-28 rounded-[2rem] bg-[#fff1bf] flex items-center justify-center mx-auto mb-6">
          <Trophy size={56} className="text-amber-500" />
        </div>

        <h1 className="text-5xl font-black text-slate-900 mb-4">أحسنت!</h1>
        <p className="text-2xl text-slate-600 leading-9 max-w-2xl mx-auto mb-8">
          أنهيت لعبة <span className="font-black text-slate-900">{game?.titleAr || 'اللعبة'}</span> بنجاح.
        </p>

        {sessionData?.isFreePlay ? (
          <div className="rounded-[2rem] bg-amber-50 border border-amber-200 p-6 mb-8 text-right">
            <p className="text-lg font-bold text-amber-900 leading-8">
              لعب حر من المكتبة (لا يُسجل في التقارير)
            </p>
          </div>
        ) : sessionData ? (
          <>
            <div className="grid md:grid-cols-3 gap-4 mb-4 text-right">
              <div className="rounded-[2rem] bg-[#eff6ff] p-5 border border-blue-100">
                <div className="text-sm font-bold text-blue-700 mb-2">الدقة من أول محاولة</div>
                <div className="text-4xl font-black text-slate-900">{sessionData.accuracyScore ?? sessionData.score}%</div>
              </div>
              <div className="rounded-[2rem] bg-[#f0fdf4] p-5 border border-emerald-100">
                <div className="text-sm font-bold text-emerald-700 mb-2">الاستقلالية</div>
                <div className="text-4xl font-black text-slate-900">{sessionData.independenceRate}%</div>
              </div>
              <div className="rounded-[2rem] bg-[#fff7ed] p-5 border border-orange-100">
                <div className="text-sm font-bold text-orange-700 mb-2">إتمام الأنشطة</div>
                <div className="text-4xl font-black text-slate-900">{sessionData.completionScore ?? 100}%</div>
              </div>
            </div>
            <p className="text-sm font-bold text-slate-500 mb-8 leading-7">
              إجمالي المحاولات: {sessionData.totalAttempts || 0}
              {sessionData.activityCount ? ` — عدد الأنشطة: ${sessionData.activityCount}` : ''}
            </p>
          </>
        ) : null}

        {!sessionData?.isFreePlay && sessionData?.promptSummary?.length > 0 && (
          <div className="rounded-[2rem] bg-slate-50 border border-slate-200 p-5 mb-8 text-right">
            <div className="flex items-center gap-2 font-black text-slate-900 mb-3">
              <Sparkles size={18} className="text-amber-500" />
              <span>مستوى المساعدة المستخدم</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {sessionData.promptSummary.map((prompt, index) => (
                <span
                  key={`${prompt}-${index}`}
                  className="rounded-full bg-white border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700"
                >
                  {prompt}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-emerald-700 font-black mb-8">
          <CheckCircle2 size={20} />
          <span>يمكنك بدء لعبة جديدة الآن</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="primary"
            className="text-xl !rounded-[1.6rem] !py-4 px-10"
            onClick={() => navigate('/student/home')}
          >
            <Home size={22} />
            <span>ألعاب أخرى</span>
          </Button>


        </div>
      </div>
    </div>
  );
};

export default Result;
