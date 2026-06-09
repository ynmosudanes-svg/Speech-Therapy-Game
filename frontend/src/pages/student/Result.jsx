import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle2, Home, Sparkles, Trophy } from 'lucide-react';
import Button from '../../components/Button';
import { useTherapyStore } from '../../hooks/useTherapyStore';

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { game, sessionData } = location.state || {};

  useEffect(() => {
    const endTime = Date.now() + 2200;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        origin: { x: 1 },
      });

      if (Date.now() < endTime) requestAnimationFrame(frame);
    };

    frame();
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

        {sessionData && (
          <div className="grid md:grid-cols-3 gap-4 mb-8 text-right">
            <div className="rounded-[2rem] bg-[#eff6ff] p-5 border border-blue-100">
              <div className="text-sm font-bold text-blue-700 mb-2">التقييم</div>
              <div className="text-4xl font-black text-slate-900">{sessionData.score}%</div>
            </div>
            <div className="rounded-[2rem] bg-[#f0fdf4] p-5 border border-emerald-100">
              <div className="text-sm font-bold text-emerald-700 mb-2">الاستقلالية</div>
              <div className="text-4xl font-black text-slate-900">{sessionData.independenceRate}%</div>
            </div>
          </div>
        )}

        {sessionData?.promptSummary?.length > 0 && (
          <div className="rounded-[2rem] bg-slate-50 border border-slate-200 p-5 mb-8 text-right">
            <div className="flex items-center gap-2 font-black text-slate-900 mb-3">
              <Sparkles size={18} className="text-amber-500" />
              <span>مستوى المساعدة المسجل</span>
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
