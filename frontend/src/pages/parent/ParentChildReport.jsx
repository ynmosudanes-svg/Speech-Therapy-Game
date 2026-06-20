import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, BarChart3, Clock, Gamepad2, Sparkles, Trophy } from 'lucide-react';
import { useTherapyStore } from '../../hooks/useTherapyStore';

const mapPromptToArabic = (prompt) => {
  if (!prompt) return 'بدون مساعدة';
  const value = String(prompt).trim().toUpperCase();

  if (value === 'INDEPENDENT' || value === 'NONE') return 'بدون مساعدة';
  if (value === 'FULL' || value === 'PARTIAL' || value === 'ASSISTED') return 'مساعدة';
  if (value === 'VERBAL') return 'لفظية';
  if (value === 'VISUAL') return 'بصرية';
  if (value === 'GESTURAL') return 'إيمائية';
  if (value === 'MODEL' || value === 'MODELING') return 'نموذجية';
  if (value === 'PHYSICAL' || value === 'FULL_PHYSICAL' || value === 'PARTIAL_PHYSICAL') return 'جسدية';

  return prompt;
};

const StatCard = ({ label, value, icon: Icon, tone = 'sky' }) => {
  const tones = {
    sky: 'border-sky-100 bg-sky-50 text-[#0F6FA6]',
    teal: 'border-teal-100 bg-teal-50 text-[#1FA9A6]',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    rose: 'border-rose-100 bg-rose-50 text-rose-600',
  };

  return (
    <div className={`rounded-[1.5rem] border p-4 shadow-sm ${tones[tone] || tones.sky}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-bold">{label}</p>
        {Icon ? <Icon size={18} /> : null}
      </div>
      <div className="text-3xl font-black text-slate-900">{value}</div>
    </div>
  );
};

const ParentChildReport = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { adminSession, students, sessions, fetchStudents, fetchSessions, loadingStudents, loadingSessions } =
    useTherapyStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!adminSession?.token) {
        navigate('/parent/dashboard');
        return;
      }

      try {
        await Promise.all([fetchStudents(adminSession.token), fetchSessions(adminSession.token)]);
      } finally {
        setReady(true);
      }
    };

    loadData();
  }, [adminSession?.token, fetchSessions, fetchStudents, navigate]);

  const child = useMemo(
    () => (Array.isArray(students) ? students.find((item) => String(item.id) === String(studentId)) : null),
    [studentId, students]
  );

  const childSessions = useMemo(() => {
    if (!Array.isArray(sessions)) return [];

    return sessions
      .filter((session) => String(session.studentId) === String(studentId))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [sessions, studentId]);

  const stats = useMemo(() => {
    const totalSessions = childSessions.length;
    const avgScore = totalSessions
      ? Math.round(childSessions.reduce((sum, session) => sum + Number(session.score || 0), 0) / totalSessions)
      : 0;
    const totalAttempts = childSessions.reduce((sum, session) => sum + Number(session.attempts || 0), 0);
    const avgDuration = totalSessions
      ? Math.round(childSessions.reduce((sum, session) => sum + Number(session.duration || session.timeSpent || 0), 0) / totalSessions)
      : 0;
    const independentSessions = childSessions.filter((session) => {
      const prompt = String(session.promptLevel || '').toUpperCase();
      return !prompt || prompt === 'INDEPENDENT' || prompt === 'NONE';
    }).length;

    return {
      totalSessions,
      avgScore,
      totalAttempts,
      avgDuration,
      independentSessions,
    };
  }, [childSessions]);

  if (!ready || loadingStudents || loadingSessions) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4" dir="rtl">
        <div className="rounded-[2rem] border border-[#D9EAF2] bg-white px-6 py-5 text-center shadow-sm">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#D9EAF2] border-t-[#1584C3]" />
          <p className="text-lg font-black text-slate-700">جاري تحميل التقرير...</p>
        </div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-4" dir="rtl">
        <div className="w-full rounded-[2rem] border border-[#D9EAF2] bg-white p-6 text-center shadow-sm">
          <h1 className="mb-3 text-2xl font-black text-slate-900">الطفل غير موجود</h1>
          <p className="mb-6 text-sm font-semibold leading-7 text-slate-500">لم نستطع العثور على الطفل المطلوب في الحساب الحالي.</p>
          <button
            type="button"
            onClick={() => navigate('/parent/dashboard')}
            className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#1584C3,#20B7B5)] px-5 py-3 font-black text-white"
          >
            <ArrowRight size={18} />
            العودة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6 font-arabic text-slate-800 sm:px-6 lg:px-8" dir="rtl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/parent/dashboard')}
          className="inline-flex items-center gap-2 rounded-2xl border border-[#D9EAF2] bg-white px-4 py-2.5 text-sm font-black text-[#0F6FA6] shadow-sm transition hover:bg-[#F8FBFD]"
        >
          <ArrowRight size={18} />
          العودة
        </button>
        <div className="text-right">
          <p className="text-sm font-black text-[#0F6FA6]">التقرير</p>
          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">{child.name}</h1>
        </div>
      </div>

      <section className="mb-6 rounded-[2rem] border border-[#D9EAF2] bg-white p-5 shadow-[0_18px_45px_-32px_rgba(15,111,166,0.25)] sm:p-6">
        <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,#EAF7FD_0%,#F8FBFD_60%,#ffffff_100%)] p-5">
            <p className="mb-2 text-sm font-bold text-slate-500">بيانات الطفل</p>
            <h2 className="text-2xl font-black text-slate-900">{child.name}</h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">العمر: {child.age} سنوات</p>
            <p className="mt-2 text-sm font-semibold text-slate-600">الكود: {child.accessCode || child.code || 'غير متوفر'}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard label="إجمالي الجلسات" value={stats.totalSessions} icon={Gamepad2} tone="sky" />
            <StatCard label="متوسط النتيجة" value={`${stats.avgScore}%`} icon={Trophy} tone="amber" />
            <StatCard label="إجمالي المحاولات" value={stats.totalAttempts} icon={BarChart3} tone="teal" />
            <StatCard label="زمن متوسط" value={`${stats.avgDuration}s`} icon={Clock} tone="rose" />
          </div>
        </div>
      </section>

      <section className="mb-6 rounded-[2rem] border border-[#D9EAF2] bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2 text-lg font-black text-slate-900">
          <Sparkles size={18} className="text-[#20B7B5]" />
          <span>ملخص المساعدة</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="الجلسات المستقلة" value={stats.independentSessions} tone="teal" />
          <StatCard label="جلسات بمساعدة" value={Math.max(stats.totalSessions - stats.independentSessions, 0)} tone="amber" />
          <StatCard label="نسبة الاستقلال" value={`${stats.totalSessions ? Math.round((stats.independentSessions / stats.totalSessions) * 100) : 0}%`} tone="sky" />
        </div>
      </section>

      <section className="rounded-[2rem] border border-[#D9EAF2] bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2 text-lg font-black text-slate-900">
          <Clock size={18} className="text-[#0F6FA6]" />
          <span>آخر الجلسات</span>
        </div>

        {childSessions.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-[#D9EAF2] bg-[#F8FBFD] p-6 text-center text-sm font-semibold text-slate-500">
            لا توجد جلسات مسجلة لهذا الطفل بعد.
          </div>
        ) : (
          <div className="space-y-3">
            {childSessions.slice(0, 6).map((session) => (
              <div
                key={session.id}
                className="grid gap-3 rounded-[1.5rem] border border-[#D9EAF2] bg-[#F8FBFD] p-4 sm:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr]"
              >
                <div>
                  <p className="text-sm font-black text-slate-900">{session.gameName || session.game?.titleAr || session.game?.title || 'لعبة'}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {new Date(session.createdAt || Date.now()).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="text-sm font-black text-slate-700">
                  النتيجة: <span className="text-[#0F6FA6]">{Number(session.score || 0)}%</span>
                </div>
                <div className="text-sm font-black text-slate-700">
                  المحاولات: <span className="text-[#0F6FA6]">{Number(session.attempts || 0)}</span>
                </div>
                <div className="text-sm font-black text-slate-700">
                  المساعدة: <span className="text-[#0F6FA6]">{mapPromptToArabic(session.promptLevel)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ParentChildReport;
