import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, BarChart3, Clock, TrendingUp } from 'lucide-react';
import Button from '../../components/Button';
import { useTherapyStore } from '../../hooks/useTherapyStore';

const mapPromptToArabic = (prompt) => {
  if (!prompt) return 'مستقل';
  const p = String(prompt).toUpperCase();
  if (p === 'INDEPENDENT' || p === 'NONE') return 'مستقل';
  if (p === 'FULL') return 'مساعدة كاملة';
  if (p === 'PARTIAL') return 'مساعدة جزئية';
  if (p === 'VERBAL' || p === 'PROMPTED') return 'مساعدة لفظية';
  if (p === 'PHYSICAL') return 'مساعدة جسدية';
  if (p === 'VISUAL') return 'مساعدة بصرية';
  return prompt;
};

const StudentProfile = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { getStudentReport, students } = useTherapyStore();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fallbackStudent = useMemo(
    () => (Array.isArray(students) ? students.find((item) => String(item.id) === String(studentId)) : null),
    [studentId, students]
  );

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const response = await getStudentReport(studentId);
        setReport(response);
      } catch (fetchError) {
        setError(fetchError?.response?.data?.message || fetchError?.message || 'تعذر تحميل التقرير.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [getStudentReport, studentId]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-[2rem] border border-slate-200 p-10 text-center">
        <h2 className="text-3xl font-black text-slate-900 mb-3">جاري تحميل التقرير...</h2>
      </div>
    );
  }

  if (!report && error) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-[2rem] border border-slate-200 p-10 text-center">
        <h2 className="text-3xl font-black text-slate-900 mb-3">تعذر تحميل الطالب</h2>
        <p className="text-slate-600 mb-6">{error}</p>
        <Button variant="primary" onClick={() => navigate('/admin/students')}>
          العودة إلى قائمة الطلاب
        </Button>
      </div>
    );
  }

  const student = report?.student || fallbackStudent;
  const progress = Array.isArray(report?.progressOverTime) ? report.progressOverTime : [];
  const performanceByGame = Array.isArray(report?.performanceByGame) ? report.performanceByGame : [];
  const performanceByPromptLevel = Array.isArray(report?.performanceByPromptLevel)
    ? report.performanceByPromptLevel
    : [];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/admin/students')} className="!p-2">
          <ArrowRight size={20} />
        </Button>
        <h1 className="text-3xl font-black text-slate-900">ملف الطالب: {student?.name || 'طالب'}</h1>
      </div>

      {error && (
        <div className="rounded-3xl bg-amber-50 border border-amber-100 px-5 py-4 text-amber-700 font-bold mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <div className="w-24 h-24 bg-[#ffe08a] rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
              👦
            </div>
            <h2 className="text-2xl font-black text-center text-slate-800 mb-2">{student?.name}</h2>
            <p className="text-center text-slate-500 mb-3">العمر: {student?.age} سنوات</p>
            <p className="text-center text-slate-500 mb-6">كود الدخول: {student?.accessCode || student?.code}</p>

            <div className="space-y-3">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl text-sm">
                <span className="font-bold text-slate-700">إجمالي الجلسات</span>
                <span className="font-black text-slate-900">{report?.totalSessions || 0}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl text-sm">
                <span className="font-bold text-slate-700">متوسط الدرجة</span>
                <span className="font-black text-slate-900">{report?.averageScore || 0}%</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl text-sm">
                <span className="font-bold text-slate-700">الاستقلالية</span>
                <span className="font-black text-emerald-700">{report?.independenceRate || 0}%</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl text-sm">
                <span className="font-bold text-slate-700">إجمالي المحاولات</span>
                <span className="font-black text-slate-900">{report?.totalAttempts || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <TrendingUp className="text-emerald-700" />
              منحنى التطور
            </h3>

            {progress.length > 0 ? (
              <div className="flex items-end gap-4 h-56 mt-8 border-b border-slate-200 pb-2 px-2">
                {progress.map((session, index) => (
                  <div key={session.sessionId} className="relative flex flex-col items-center flex-1 group">
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-10 bg-slate-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity">
                      {session.score}% - {session.gameName}
                    </div>
                    <div
                      className={`w-full max-w-[42px] rounded-t-md transition-all duration-500 ${
                        session.score >= 80
                          ? 'bg-green-500'
                          : session.score >= 50
                            ? 'bg-yellow-400'
                            : 'bg-red-400'
                      }`}
                      style={{ height: `${session.score}%` }}
                    />
                    <div className="text-[10px] text-slate-400 mt-2 truncate w-full text-center">
                      ج {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-10">لا توجد جلسات مسجلة حتى الآن.</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                <BarChart3 className="text-blue-700" />
                الأداء حسب اللعبة
              </h3>
              <div className="space-y-3">
                {performanceByGame.length > 0 ? (
                  performanceByGame.map((entry) => (
                    <div key={entry.gameId} className="rounded-2xl border border-slate-100 p-4 bg-slate-50">
                      <div className="font-black text-slate-900">{entry.gameName}</div>
                      <div className="text-sm text-slate-500 mt-1">
                        {entry.totalSessions} جلسات - متوسط {entry.averageScore}%
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">لا توجد بيانات بعد.</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                <Clock className="text-emerald-700" />
                الأداء حسب المساعدة
              </h3>
              <div className="space-y-3">
                {performanceByPromptLevel.length > 0 ? (
                  performanceByPromptLevel.map((entry) => (
                    <div key={entry.promptLevel} className="rounded-2xl border border-slate-100 p-4 bg-slate-50">
                      <div className="font-black text-slate-900">{mapPromptToArabic(entry.promptLevel)}</div>
                      <div className="text-sm text-slate-500 mt-1">
                        {entry.totalSessions} جلسات - متوسط {entry.averageScore}%
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">لا توجد بيانات بعد.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
