import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BarChart3, CalendarClock, ClipboardList, Gauge, Sparkles, Timer, Trophy, Gamepad2, Play, Star, Target, AlertCircle, Clock } from 'lucide-react';
import { useTherapyStore } from '../../hooks/useTherapyStore';

const TITLES = {
  sessions: 'الجلسات',
  assessment: 'التقييم',
  plan: 'الخطة العلاجية',
  behavior: 'السلوكيات',
  reports: 'التقارير',
  library: 'المكتبة العلاجية',
  medical: 'الملف الطبي',
  journey: 'مسار التقدم',
  profile: 'صفحتي',
};

const MEDICAL_TABS = [
  { id: 'medical', label: 'الملف الطبي' },
  { id: 'assessment', label: 'التقييم' },
  { id: 'behavior', label: 'السلوكيات' },
  { id: 'journey', label: 'مسار التقدم' },
  { id: 'profile', label: 'صفحتي' },
];

const StudentWorkspaceSection = ({ section }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentStudent, sessions } = useTherapyStore();

  const games = Array.isArray(currentStudent?.assignedGames) ? currentStudent.assignedGames : [];
  const studentSessions = Array.isArray(sessions)
    ? sessions.filter((session) => String(session.studentId) === String(currentStudent?.id))
    : [];
  const title = TITLES[section] || 'بوابة المستفيد';

  const getGameTitle = (session) => {
    const game = games.find((item) => String(item.id) === String(session.gameId));
    return session.gameName || game?.config?.nameAr || game?.titleAr || game?.title || game?.name || 'نشاط علاجي';
  };

  const completedCount = studentSessions.length;
  const averageScore = completedCount
    ? Math.round(studentSessions.reduce((sum, session) => sum + Number(session.score || 0), 0) / completedCount)
    : 0;
  const totalDuration = studentSessions.reduce(
    (sum, session) => sum + Number(session.duration || session.timeSpent || 0),
    0
  );
  const bestSession = studentSessions.reduce(
    (best, session) => (Number(session.score || 0) > Number(best?.score || 0) ? session : best),
    null
  );

  const formatDuration = (seconds) => {
    if (!seconds) return '0 د';
    return `${Math.max(1, Math.round(Number(seconds) / 60))} د`;
  };

  if (section === 'library') {
    return (
      <div dir="rtl" className="space-y-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900">{title}</h1>
          <p className="text-slate-600 mt-2">أنشطة مخصصة للمستفيد للعب والتدريب.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {games.map((game, index) => (
            <div 
              key={game.id} 
              className={`relative overflow-hidden rounded-[2rem] border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group cursor-pointer
                ${index % 3 === 0 ? 'bg-gradient-to-br from-[#eff6ff] to-[#dbeafe] border-blue-100 hover:shadow-blue-200/50' : 
                  index % 3 === 1 ? 'bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7] border-emerald-100 hover:shadow-emerald-200/50' : 
                  'bg-gradient-to-br from-[#fdf4ff] to-[#fae8ff] border-fuchsia-100 hover:shadow-fuchsia-200/50'}`}
              onClick={() => navigate(`/student/game/${game.id}`)}
            >
              <div className="absolute -top-4 -right-4 p-4 opacity-10 transition-transform duration-500 group-hover:scale-150 group-hover:rotate-12">
                <Sparkles className="w-32 h-32" />
              </div>
              
              <div className="relative z-10 text-right">
                <div className="w-14 h-14 rounded-2xl bg-white/80 shadow-sm border border-white/50 flex items-center justify-center mb-5 backdrop-blur-sm">
                  <Gamepad2 className={`w-7 h-7 ${index % 3 === 0 ? 'text-blue-500' : index % 3 === 1 ? 'text-emerald-500' : 'text-fuchsia-500'}`} />
                </div>
                
                <h3 className="font-black text-slate-800 text-xl mb-2">{game.titleAr || game.title || game.name}</h3>
                <p className="text-sm font-bold text-slate-500 mb-6 line-clamp-2 leading-relaxed">
                  {game.descriptionAr || game.description || 'لعبة تفاعلية لتنمية المهارات بصورة ممتعة ومحفزة.'}
                </p>

                <div className="flex items-center justify-between mt-auto">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 font-black text-xs text-slate-600 backdrop-blur-sm border border-white/50">
                    المستوى {game.level || 1}
                  </span>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-transform active:scale-95 group-hover:-translate-x-1
                    ${index % 3 === 0 ? 'bg-blue-600 shadow-blue-200' : index % 3 === 1 ? 'bg-emerald-600 shadow-emerald-200' : 'bg-fuchsia-600 shadow-fuchsia-200'}`}>
                    <Play fill="currentColor" className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section === 'medical') {
    const currentTab = searchParams.get('tab') || 'medical';

    return (
      <div dir="rtl" className="space-y-4">
        <h1 className="text-3xl font-black text-slate-900">{title}</h1>

        <div className="flex flex-wrap gap-2">
          {MEDICAL_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSearchParams({ tab: tab.id })}
              className={`rounded-xl px-4 py-2 font-bold border transition-colors ${
                currentTab === tab.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-[#dbe7f3] hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white border border-[#dbe7f3] rounded-2xl p-5">
          {currentTab === 'medical' && (
            <>
              <div className="text-slate-500 text-sm mb-1">الاسم</div>
              <div className="font-black text-2xl text-slate-900">{currentStudent?.name || '-'}</div>
              <div className="mt-4 text-slate-500 text-sm mb-1">التشخيص</div>
              <div className="font-bold text-slate-800">{currentStudent?.diagnosis || 'غير محدد بعد'}</div>
            </>
          )}

          {currentTab !== 'medical' && (
            <div className="text-slate-600 leading-8">
              هذه بيانات تبويب <span className="font-black">{TITLES[currentTab]}</span> وسيتم ربطها ببيانات الـAPI في المرحلة القادمة.
            </div>
          )}
        </div>
      </div>
    );
  }

  if (section === 'sessions') {
    return (
      <div dir="rtl" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#eff6ff] to-white rounded-[2rem] p-6 border border-blue-100 shadow-sm">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 flex items-center gap-3">
              <Trophy className="text-blue-500" size={36} /> إنجازاتي!
            </h1>
            <p className="mt-2 text-slate-500 font-bold">كل الألعاب اللي لعبتها والنجوم اللي جمعتها هتلاقيها هنا 🌟</p>
          </div>
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-blue-100 flex items-center gap-3">
            <Star className="text-amber-400" fill="currentColor" size={28} />
            <div className="font-black text-2xl text-slate-800">
              {studentSessions.reduce((total, session) => total + (Number(session.score || 0) >= 70 ? 3 : Number(session.score || 0) >= 30 ? 2 : 1), 0)} <span className="text-sm text-slate-500 font-bold">نجمة إجمالية</span>
            </div>
          </div>
        </div>

        <div className="relative">
          {studentSessions.length ? (
            <div className="space-y-4 relative before:absolute before:inset-y-4 before:right-8 before:w-1.5 before:bg-[#dbe7f3] before:rounded-full">
              {studentSessions.map((session, index) => {
                const score = Number(session.score || 0);
                const starsCount = score >= 70 ? 3 : score >= 30 ? 2 : 1;
                
                return (
                  <article key={session.id || `${session.gameId}-${index}`} className="relative pl-4 pr-20 py-2">
                    {/* Timeline Node */}
                    <div className="absolute right-[1.125rem] top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border-[3px] border-blue-300 shadow-sm z-10 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    </div>
                    
                    {/* Card */}
                    <div className="bg-white rounded-[1.5rem] border border-[#dbe7f3] p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 group">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100 group-hover:scale-110 transition-transform shrink-0">
                          <Gamepad2 className="text-blue-500" size={28} />
                        </div>
                        <div>
                          <div className="font-black text-slate-800 text-xl">{getGameTitle(session)}</div>
                          <div className="text-slate-400 text-sm font-bold mt-1 text-right" dir="rtl">
                            {new Date(session.createdAt || Date.now()).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 shrink-0">
                        {[1, 2, 3].map((star) => (
                          <Star 
                            key={star} 
                            size={22} 
                            className={star <= starsCount ? "text-amber-400 drop-shadow-sm" : "text-slate-200"} 
                            fill={star <= starsCount ? "currentColor" : "none"} 
                            strokeWidth={star <= starsCount ? 0 : 2}
                          />
                        ))}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[2.5rem] border-2 border-dashed border-blue-200 bg-blue-50/50 p-10 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm border border-blue-100 text-blue-500">
                <Sparkles size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">لم تبدأ جمع النجوم بعد!</h3>
              <p className="mx-auto max-w-xl text-slate-600 font-bold">ابدأ بلعب أول نشاط لك لتحصل على النجوم المضيئة وتراها هنا.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (section === 'reports') {
    return (
      <div dir="rtl" className="space-y-5">
        <section className="overflow-hidden rounded-[2rem] border border-[#a8d7e7] bg-[linear-gradient(135deg,_#0f7ea6_0%,_#1693c1_50%,_#6ec0dc_100%)] p-6 md:p-7 text-white shadow-[0_18px_45px_rgba(9,86,114,0.22)]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-bold mb-4">
                <BarChart3 size={17} />
                تقرير أداء الطفل
              </div>
              <h1 className="text-3xl md:text-5xl font-black leading-tight">{currentStudent?.name || 'المستفيد'}</h1>
              <p className="mt-3 max-w-2xl text-white/90 leading-8">
                ملخص مبني على الأنشطة التي تم تنفيذها ونتائج كل محاولة داخل الألعاب المخصصة.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 min-w-full lg:min-w-[360px]">
              <HeroMetric label="أنشطة مكتملة" value={completedCount} />
              <HeroMetric label="متوسط الأداء" value={`${averageScore}%`} />
            </div>
          </div>
        </section>

        <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <ReportStat icon={ClipboardList} label="الأنشطة المخصصة" value={games.length} tone="blue" />
          <ReportStat icon={Trophy} label="أفضل نتيجة" value={bestSession ? `${bestSession.score}%` : '--'} tone="amber" />
          <ReportStat icon={Timer} label="وقت التدريب" value={formatDuration(totalDuration)} tone="emerald" />
          <ReportStat icon={Gauge} label="التقدم الحالي" value={completedCount ? 'قيد المتابعة' : 'في الانتظار'} tone="violet" />
        </section>

        <section className="rounded-[1.8rem] border border-[#dbe7f3] bg-white p-5 md:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-5">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">نتائج الأنشطة</h2>
            <span className="text-slate-500 font-bold text-sm">آخر محاولات الطفل داخل الألعاب</span>
          </div>

          {studentSessions.length ? (
            <div className="space-y-3">
              {studentSessions.slice(0, 8).map((session, index) => {
                const score = Math.min(100, Math.max(0, Number(session.score || 0)));
                return (
                  <article key={session.id || `${session.gameId}-${index}`} className="flex items-center gap-4 rounded-[1.2rem] border border-slate-100 bg-white p-4 hover:shadow-md transition-shadow group">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${score === 100 ? 'bg-emerald-100 text-emerald-600' : score >= 60 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                      {score === 100 ? <Trophy size={28} /> : score >= 60 ? <Target size={28} /> : <AlertCircle size={28} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-slate-800 truncate">{getGameTitle(session)}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm font-bold text-slate-500">
                        <span className="flex items-center gap-1.5"><Clock size={16} /> {formatDuration(session.duration || session.timeSpent)}</span>
                        <span className="flex items-center gap-1.5"><BarChart3 size={16} /> {session.attempts || 1} محاولات</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`text-2xl font-black ${score === 100 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                        {score}%
                      </span>
                      <div className="w-24 h-2.5 rounded-full bg-slate-100 overflow-hidden shadow-inner">
                        <div
                          className={`h-full rounded-full ${score === 100 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Sparkles}
              title="لا توجد تقارير أداء بعد"
              description="أول ما الطفل يخلص لعبة، هيتسجل السكور والوقت وتظهر هنا تقارير واضحة حسب النشاط."
            />
          )}
        </section>
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-4">
      <h1 className="text-3xl font-black text-slate-900">{title}</h1>
      <div className="bg-white border border-[#dbe7f3] rounded-2xl p-6 text-slate-600 leading-8">
        هذه صفحة {title} ضمن بوابة المستفيد. سيتم ربطها ببيانات الـAPI في المرحلة القادمة.
      </div>
    </div>
  );
};

const HeroMetric = ({ label, value }) => (
  <div className="rounded-2xl border border-white/20 bg-white/12 p-4">
    <div className="text-white/80 text-sm font-bold">{label}</div>
    <div className="mt-1 text-3xl font-black">{value}</div>
  </div>
);

const ReportStat = ({ icon: Icon, label, value, tone }) => {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
  };

  return (
    <article className="rounded-[1.5rem] border border-[#dbe7f3] bg-white p-4 shadow-sm">
      <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${tones[tone] || tones.blue}`}>
        <Icon size={22} />
      </div>
      <div className="text-slate-500 font-bold text-sm">{label}</div>
      <div className="mt-1 text-2xl font-black text-slate-900">{value}</div>
    </article>
  );
};

const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="rounded-[1.5rem] border border-dashed border-[#c5d9ea] bg-[#f9fcff] p-8 text-center">
    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
      <Icon size={30} />
    </div>
    <h3 className="text-2xl font-black text-slate-900">{title}</h3>
    <p className="mx-auto mt-2 max-w-xl text-slate-600 leading-7">{description}</p>
  </div>
);

export default StudentWorkspaceSection;
