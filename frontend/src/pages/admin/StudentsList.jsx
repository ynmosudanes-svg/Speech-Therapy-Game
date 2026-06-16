import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Pencil, Play, Printer, Trash2, UserPlus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import { useTherapyStore } from '../../hooks/useTherapyStore';

const StudentsList = () => {
  const navigate = useNavigate();
  const { deleteStudent, fetchStudents, loadingStudents, students } = useTherapyStore();
  const [actionError, setActionError] = useState('');

  const safeStudents = useMemo(() => (Array.isArray(students) ? students : []), [students]);

  useEffect(() => {
    if (safeStudents.length) {
      return;
    }

    fetchStudents().catch((error) => {
      setActionError(error?.response?.data?.message || error?.message || 'تعذر تحميل الطلاب.');
    });
  }, [fetchStudents, safeStudents.length]);



  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('هل تريد حذف هذا الطالب؟')) {
      return;
    }

    try {
      setActionError('');
      await deleteStudent(studentId);
    } catch (error) {
      setActionError(error?.response?.data?.message || error?.message || 'تعذر حذف الطالب.');
    }
  };

  const handlePrintCode = (student) => {
    const printWindow = window.open('', '', 'width=600,height=460');
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>بطاقة الدخول - ${student.name}</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff8dc; margin: 0; }
            .card { background: white; width: 420px; border-radius: 28px; padding: 32px; border: 2px solid #f0dda7; box-shadow: 0 14px 32px rgba(0,0,0,.08); text-align: center; }
            .avatar { width: 88px; height: 88px; border-radius: 24px; background: #dbeafe; display:flex; align-items:center; justify-content:center; font-size: 42px; margin: 0 auto 16px; }
            .title { font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
            .subtitle { color: #475569; line-height: 1.7; margin-bottom: 20px; }
            .code { background: #2563eb; color: white; font-size: 32px; font-weight: 800; letter-spacing: 4px; border-radius: 20px; padding: 18px; margin: 18px 0; }
            .note { color: #64748b; font-size: 14px; line-height: 1.8; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="avatar">👦</div>
            <div class="title">${student.name}</div>
            <div class="subtitle">يدخل ولي الأمر بهذا الكود فقط من صفحة الدخول الرئيسية</div>
            <div class="code">${student.accessCode || student.code}</div>
            <div class="note">بعد الدخول سيشاهد الطفل ألعابه المخصصة فقط بدون أي إعدادات أو تنقل معقد.</div>
          </div>
          <script>window.onload = function () { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3">
            <Users className="text-blue-700" size={32} />
            إدارة الطلاب
          </h1>
          <p className="text-lg text-slate-600 mt-2">
            اختر الطالب ثم ابدأ الجلسة مباشرة أو راجع التقارير والخطة الحالية.
          </p>
        </div>

        <Button
          variant="primary"
          className="w-full md:w-auto justify-center !py-3 bg-blue-600 hover:bg-blue-700"
          onClick={() => navigate('/admin/students/create')}
        >
          <UserPlus size={18} />
          <span>إضافة طالب</span>
        </Button>
      </div>

      {actionError && (
        <div className="rounded-3xl bg-red-50 border border-red-100 px-5 py-4 text-red-600 font-bold">
          {actionError}
        </div>
      )}

      {loadingStudents ? (
        <div className="bg-white rounded-[2rem] border border-[#eadfbe] p-10 text-center text-xl font-black text-slate-700">
          جاري تحميل الطلاب...
        </div>
      ) : safeStudents.length ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {safeStudents.map((student) => {
            const assignedGames = Array.isArray(student.assignedGames) ? student.assignedGames : [];

            return (
              <article
                key={student.id}
                className="bg-white rounded-[2rem] p-6 border border-[#eadfbe] shadow-sm"
              >
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">{student.name}</h2>
                    <p className="text-slate-500 mt-1">العمر: {student.age} سنوات</p>
                    <div className="mt-3 inline-flex items-center rounded-full bg-[#f8f4ea] border border-[#eadfbe] px-4 py-2 text-sm font-black tracking-[0.2em]">
                      {student.accessCode || student.code}
                    </div>
                  </div>

                  <div className="w-16 h-16 rounded-[1.4rem] bg-blue-100 flex items-center justify-center text-4xl">
                    👦
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-5">
                  <div className="rounded-[1.5rem] bg-[#fff7e7] p-4 border border-[#f4df99]">
                    <div className="text-sm font-bold text-slate-500 mb-1">الألعاب المخصصة</div>
                    <div className="text-3xl font-black text-slate-900">{assignedGames.length}</div>
                  </div>
                  <div className="rounded-[1.5rem] bg-[#eff6ff] p-4 border border-blue-100">
                    <div className="text-sm font-bold text-slate-500 mb-1">المستوى الحالي</div>
                    <div className="font-black text-slate-900">المستوى {student.currentLevel}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {assignedGames.map((game) => (
                    <span
                      key={game.id}
                      className="rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600"
                    >
                      {game.titleAr || game.title || game.name}
                    </span>
                  ))}
                </div>

                <div className="grid sm:grid-cols-2 gap-3">


                  <Button
                    variant="outline"
                    className="w-full justify-center !py-3"
                    onClick={() => navigate(`/admin/students/${student.id}`)}
                  >
                    <Activity size={18} />
                    <span>عرض التقارير</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-center !py-3 bg-slate-50"
                    onClick={() => handlePrintCode(student)}
                  >
                    <Printer size={18} />
                    <span>طباعة كود الدخول</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-center !py-3"
                    onClick={() => navigate(`/admin/students/edit/${student.id}`)}
                  >
                    <Pencil size={18} />
                    <span>تعديل الطالب</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-center !py-3 bg-red-50 border-red-200 hover:bg-red-100 sm:col-span-2"
                    onClick={() => handleDeleteStudent(student.id)}
                  >
                    <Trash2 size={18} />
                    <span>حذف الطالب</span>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-[#eadfbe] p-10 text-center">
          <div className="text-2xl font-black text-slate-900 mb-3">لا يوجد طلاب بعد</div>
          <p className="text-slate-500 mb-6">ابدأ بإضافة أول طالب لعرضه هنا وإدارة جلساته وألعابه.</p>
          <Button
            variant="primary"
            className="mx-auto !py-3 bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate('/admin/students/create')}
          >
            <UserPlus size={18} />
            <span>إضافة طالب</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default StudentsList;
