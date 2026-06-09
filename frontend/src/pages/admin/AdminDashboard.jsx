import React, { useEffect, useMemo, useState } from 'react';
import { Activity, CalendarClock, Flag, Target, TrendingUp, Users, Clock, User, ChevronLeft, Gamepad2, Tags, LayoutTemplate, Layers, BarChart, PlayCircle } from 'lucide-react';
import { useTherapyStore } from '../../hooks/useTherapyStore';
import gameService from '../../services/gameService';



const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}>{children}</div>
);

export default function AdminDashboard() {
  const { students, sessions, adminSession } = useTherapyStore();
  const [games, setGames] = useState([]);

  useEffect(() => {
    if (adminSession?.token) {
      gameService.getGames(adminSession.token).then(res => setGames(Array.isArray(res) ? res : []));
    }
  }, [adminSession?.token]);

  const dashboard = useMemo(() => {
    const totalGames = games.length;
    const activeCategories = new Set(games.map(g => g.type)).size;
    const totalActivities = games.reduce((acc, g) => acc + (g.config?.levels?.reduce((lAcc, l) => lAcc + (l.activities?.length || 0), 0) || 0), 0);
    const difficultyLevels = 3;
    const gamesPlayed = sessions.length;

    // Last 5 sessions as "Recent Sessions"
    const upcomingSessions = sessions.slice(0, 5).map(session => {
      const student = students.find(s => s.id === session.studentId);
      return {
        id: session.id,
        patientName: student?.name || 'طالب محذوف',
        time: new Date(session.createdAt).toLocaleDateString('ar-EG'),
        type: session.gameType === 'speech' ? 'نطق وتخاطب' : 'تنمية مهارات',
        color: 'bg-blue-100 text-blue-700'
      };
    });

    const progressTrend = [
      { label: 'الشهر الماضي', value: 30 },
      { label: 'الحالي', value: 45 },
    ];

    return {
      kpis: {
        totalGames,
        activeCategories,
        playTemplates: games.length,
        totalActivities,
        difficultyLevels,
        gamesPlayed,
      },
      upcomingSessions,
      progressTrend,
    };
  }, [games, sessions, students]);

  const { kpis, upcomingSessions, progressTrend } = dashboard;

  const stats = [
    { label: 'إجمالي الألعاب', value: kpis.totalGames, icon: Gamepad2, tone: 'from-[#168FC7] to-[#0f7ea6]', bg: 'bg-sky-50', text: 'text-[#168FC7]' },
    { label: 'التصنيفات النشطة', value: kpis.activeCategories, icon: Tags, tone: 'from-[#38bdf8] to-[#168FC7]', bg: 'bg-sky-50', text: 'text-[#168FC7]' },
    { label: 'قوالب اللعب', value: kpis.playTemplates, icon: LayoutTemplate, tone: 'from-[#7dd3fc] to-[#168FC7]', bg: 'bg-sky-50', text: 'text-[#168FC7]' },
    { label: 'الأنشطة التفاعلية', value: kpis.totalActivities, icon: Layers, tone: 'from-[#168FC7] to-[#0f7ea6]', bg: 'bg-cyan-50', text: 'text-cyan-700' },
    { label: 'مستويات الصعوبة', value: kpis.difficultyLevels, icon: BarChart, tone: 'from-[#38bdf8] to-[#168FC7]', bg: 'bg-sky-50', text: 'text-[#168FC7]' },
    { label: 'مرات اللعب', value: kpis.gamesPlayed, icon: PlayCircle, tone: 'from-[#168FC7] to-[#0f7ea6]', bg: 'bg-cyan-50', text: 'text-cyan-700' },
  ];

  return (
    <div className="w-full bg-slate-50/50 p-4 sm:p-6 lg:p-8 font-arabic" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">لوحة متابعة المركز</h1>
            <p className="text-slate-500 mt-1.5 font-medium">نظرة شاملة ومحدثة لحالة المرضى، الجلسات، والخطط العلاجية.</p>
          </div>
          <button className="flex items-center gap-2 bg-[#168FC7] hover:bg-[#0f7ea6] text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-sm shadow-sky-100">
            <span>تحديث البيانات</span>
            <Activity size={18} />
          </button>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-5">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-5 relative overflow-hidden group">
                <div
                  className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.tone} opacity-5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 duration-500`}
                />
                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${stat.bg} ${stat.text}`}>
                    <Icon size={24} strokeWidth={2.5} />
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-black text-slate-800">{stat.value}</div>
                    <div className="text-sm font-semibold text-slate-500">{stat.label}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-black text-slate-900">معدل التقدم العام (6 أشهر)</h2>
                  <p className="text-sm text-slate-500 mt-1 font-medium">متوسط استجابة المرضى للخطط العلاجية</p>
                </div>
                <div className="p-2 bg-sky-50 text-[#168FC7] rounded-xl">
                  <TrendingUp size={24} />
                </div>
              </div>

              <div className="flex items-end justify-between gap-2 h-64 border-b-2 border-slate-100 pb-2 px-2">
                {progressTrend.map((point) => (
                  <div key={point.label} className="group relative flex-1 flex flex-col items-center justify-end h-full">
                    <div className="absolute -top-10 bg-slate-800 text-white text-xs font-bold py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg transform translate-y-2 group-hover:translate-y-0">
                      {point.value}%
                    </div>
                    <div
                      className="w-full max-w-[3.5rem] rounded-t-xl bg-gradient-to-t from-[#168FC7] to-[#7dd3fc] transition-all duration-500 shadow-sm group-hover:opacity-80"
                      style={{ height: `${point.value}%` }}
                    />
                    <div className="text-sm font-bold text-slate-500 mt-4">{point.label}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <CalendarClock size={24} />
                </div>
                <h2 className="text-xl font-black text-slate-900">أحدث الجلسات</h2>
              </div>

              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:text-blue-600 transition-colors shadow-sm">
                        <User size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{session.patientName}</div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 font-semibold">
                          <Clock size={14} className="text-slate-400" />
                          <span>{session.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${session.color}`}>{session.type}</span>
                      <ChevronLeft size={16} className="text-slate-300 group-hover:text-blue-500" />
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 font-bold hover:bg-sky-50 hover:border-[#168FC7] hover:text-[#168FC7] transition-colors">
                عرض الجدول الكامل
              </button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
