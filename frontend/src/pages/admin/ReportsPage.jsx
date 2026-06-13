import React, { useEffect, useMemo, useState } from 'react';
import { Download, Search, Users, Clock, FileText, UserCircle, ChevronDown, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../../components/ConfirmModal';
import { useTherapyStore } from '../../hooks/useTherapyStore';

const mapPromptToArabic = (prompt) => {
  if (!prompt) return 'مستقل';
  const p = prompt.toUpperCase();
  if (p === 'INDEPENDENT' || p === 'NONE') return 'مستقل';
  if (p === 'VERBAL' || p === 'PROMPTED') return 'مساعدة لفظية';
  if (p === 'PHYSICAL') return 'مساعدة جسدية';
  if (p === 'VISUAL') return 'مساعدة بصرية';
  return prompt;
};

const ReportsPage = () => {
  const navigate = useNavigate();
  const { fetchSessions, loadingSessions, sessions, students } = useTherapyStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [isDownloading, setIsDownloading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, message: '' });

  useEffect(() => {
    fetchSessions().catch(() => {});
  }, [fetchSessions]);

  const safeStudents = useMemo(() => (Array.isArray(students) ? students : []), [students]);
  const safeSessions = useMemo(() => (Array.isArray(sessions) ? sessions : []), [sessions]);

  // تصفية البيانات بناءً على البحث والاختيار
  const filteredStudents = useMemo(() => {
    return safeStudents.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStudent = selectedStudent === 'all' || String(student.id) === selectedStudent;
      return matchesSearch && matchesStudent;
    });
  }, [safeStudents, searchQuery, selectedStudent]);

  const filteredSessions = useMemo(() => {
    return safeSessions.filter(session => {
      const student = safeStudents.find(s => String(s.id) === String(session.studentId));
      const studentName = student?.name || 'مستفيد';
      const gameTitle = session.game?.titleAr || session.game?.title || session.game?.name || 'لعبة';
      
      const matchesSearch = studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            gameTitle.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStudent = selectedStudent === 'all' || String(session.studentId) === selectedStudent;
      
      return matchesSearch && matchesStudent;
    }).slice(0, 15); // عرض آخر 15 جلسة متوافقة مع البحث
  }, [safeSessions, safeStudents, searchQuery, selectedStudent]);

  const handleDownloadPdf = async () => {
    if (selectedStudent === 'all') {
      setAlertConfig({ 
        isOpen: true, 
        message: 'الرجاء اختيار مستفيد أولاً من قائمة التصفية لتنزيل تقريره.' 
      });
      return;
    }
    
    const student = safeStudents.find(s => String(s.id) === selectedStudent);
    if (!student) return;

    const totalSessions = filteredSessions.length;
    const avgScore = totalSessions > 0 
      ? Math.round(filteredSessions.reduce((acc, curr) => acc + curr.score, 0) / totalSessions) 
      : 0;

    const sessionsHtml = filteredSessions.length === 0 
      ? '<p style="text-align:center; color:#64748b; padding: 40px; background: #f8fafc; border-radius: 12px; font-weight: bold;">لا توجد جلسات مسجلة متوافقة مع البحث.</p>'
      : `<table>
          <thead>
            <tr>
              <th>تاريخ الجلسة</th>
              <th>النشاط / اللعبة</th>
              <th>التقييم</th>
              <th>المحاولات</th>
              <th>نوع المساعدة</th>
            </tr>
          </thead>
          <tbody>
            ${filteredSessions.map(s => `
              <tr>
                <td style="color: #64748b;">${new Date(s.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                <td style="font-weight: 800; color: #0f172a;">${s.game?.titleAr || s.game?.title || s.game?.name || 'لعبة'}</td>
                <td><span class="badge ${s.score >= 80 ? 'badge-green' : s.score >= 50 ? 'badge-amber' : 'badge-red'}">${s.score}%</span></td>
                <td><span style="font-weight: 800; color: #475569;">${s.attempts}</span></td>
                <td><span class="badge ${!s.promptLevel || s.promptLevel === 'INDEPENDENT' || s.promptLevel === 'NONE' ? 'badge-green' : 'badge-amber'}">${mapPromptToArabic(s.promptLevel)}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>`;

    const htmlString = `
      <div dir="rtl" style="font-family: 'Cairo', system-ui, sans-serif; padding: 20px; color: #1e293b; background: white;">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;800;900&display=swap');
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
          th { background: #f8fafc; color: #475569; text-align: right; padding: 10px; border-bottom: 2px solid #e2e8f0; }
          td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
          .badge { padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; display: inline-block; }
          .badge-green { background: #dcfce7; color: #166534; }
          .badge-amber { background: #fef3c7; color: #92400e; }
          .badge-red { background: #fee2e2; color: #991b1b; }
        </style>
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px;">
          <div>
            <h1 style="margin: 0; color: #0f172a; font-size: 28px; font-weight: 900;">التقرير الشامل لجلسات التخاطب</h1>
            <p style="margin: 8px 0 0 0; color: #64748b; font-size: 14px; font-weight: 600;">تم استخراج هذا التقرير بتاريخ: ${new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #178bb6, #06b6d4); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 24px;">ST</div>
        </div>
        
        <div style="background: #f0f9ff; border-radius: 16px; padding: 20px; margin-bottom: 30px; border: 1px solid #bae6fd;">
          <div style="display: flex; flex-wrap: wrap; gap: 20px;">
            <div style="flex: 1 1 100%; margin-bottom: 10px;">
              <span style="display: block; font-size: 12px; color: #0284c7; font-weight: 800; margin-bottom: 4px;">اسم المستفيد</span>
              <span style="font-size: 20px; color: #0369a1; font-weight: 900;">${student.name}</span>
            </div>
            <div style="flex: 1;">
              <span style="display: block; font-size: 12px; color: #0284c7; font-weight: 800; margin-bottom: 4px;">العمر</span>
              <span style="font-size: 16px; font-weight: 800;">${student.age || '--'} سنوات</span>
            </div>
            <div style="flex: 1;">
              <span style="display: block; font-size: 12px; color: #0284c7; font-weight: 800; margin-bottom: 4px;">التشخيص</span>
              <span style="font-size: 16px; font-weight: 800;">${student.diagnosis || 'غير محدد'}</span>
            </div>
            <div style="flex: 1;">
              <span style="display: block; font-size: 12px; color: #0284c7; font-weight: 800; margin-bottom: 4px;">المستوى</span>
              <span style="font-size: 16px; font-weight: 800;">المستوى ${student.currentLevel} ${student.planName ? `(${student.planName})` : ''}</span>
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 15px; margin-bottom: 30px;">
          <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; text-align: center;">
            <h4 style="margin: 0 0 5px 0; font-size: 12px; color: #64748b;">إجمالي الجلسات</h4>
            <div style="font-size: 24px; font-weight: 900; color: #178bb6;">${totalSessions}</div>
          </div>
          <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; text-align: center;">
            <h4 style="margin: 0 0 5px 0; font-size: 12px; color: #64748b;">متوسط التقييم</h4>
            <div style="font-size: 24px; font-weight: 900; color: ${avgScore >= 80 ? '#059669' : avgScore >= 50 ? '#d97706' : '#dc2626'};">${avgScore}%</div>
          </div>
          <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; text-align: center;">
            <h4 style="margin: 0 0 5px 0; font-size: 12px; color: #64748b;">كود الملف</h4>
            <div style="font-size: 20px; font-weight: 900; color: #64748b;">${student.accessCode || student.code || '---'}</div>
          </div>
        </div>

        <h2 style="font-size: 18px; font-weight: 900; color: #0f172a; margin-bottom: 15px; border-right: 4px solid #178bb6; padding-right: 10px;">سجل الجلسات التدريبية المنجزة</h2>
        
        ${sessionsHtml}

        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px dashed #e2e8f0; display: flex; justify-content: space-between; font-size: 12px; color: #64748b;">
          <div>
            هذا التقرير تم استخراجه آلياً وموثق من نظام إدارة الجلسات.<br/>
            جميع البيانات محفوظة بسرية تامة.
          </div>
          <div style="text-align: center;">
            <div style="width: 150px; border-bottom: 1px solid #cbd5e1; margin-bottom: 5px;"></div>
            توقيع الأخصائي المتابع
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setAlertConfig({ 
        isOpen: true, 
        message: 'يرجى السماح بفتح النوافذ المنبثقة (Pop-ups) لعرض التقرير وطباعته.' 
      });
      setIsDownloading(false);
      return;
    }

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>تقرير_${student.name}</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body onload="setTimeout(function() { window.print(); window.close(); }, 500);">
          ${htmlString}
        </body>
      </html>
    `);
    printWindow.document.close();
    
    setIsDownloading(false);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* الترويسة وزر الـ PDF */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">التقارير</h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base">مراجعة سريعة للجلسات المسجلة والانتقال إلى تقرير كل مستفيد بالتفصيل.</p>
        </div>
        <button 
          onClick={handleDownloadPdf}
          disabled={isDownloading}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium shadow-sm transition-all ${
            isDownloading 
              ? 'bg-slate-400 text-white cursor-not-allowed shadow-none'
              : 'bg-[#178bb6] hover:bg-[#126d8f] text-white shadow-cyan-500/30 focus:ring-4 focus:ring-cyan-500/20 active:scale-[0.98]'
          }`}
        >
          {isDownloading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download size={20} />
          )}
          {isDownloading ? 'جاري التجهيز...' : 'تنزيل التقرير (PDF)'}
        </button>
      </div>

      {/* شريط البحث وفلتر الطلاب */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="ابحث باسم المستفيد أو اللعبة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pr-12 pl-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#178bb6]/20 focus:border-[#178bb6] transition-all"
          />
        </div>
        
        <div className="relative md:w-72">
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <Filter size={18} className="text-slate-400" />
          </div>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pr-12 pl-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#178bb6]/20 focus:border-[#178bb6] transition-all cursor-pointer"
          >
            <option value="all">جميع المستفيدين</option>
            {safeStudents.map(student => (
              <option key={student.id} value={student.id}>{student.name}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <ChevronDown size={18} className="text-slate-400" />
          </div>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative bg-gradient-to-br from-[#178bb6] to-cyan-600 rounded-[2rem] p-8 shadow-lg shadow-cyan-500/20 overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-cyan-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="text-white">
              <p className="text-cyan-100 text-lg font-medium mb-2 flex items-center gap-2">
                إجمالي المستفيدين
              </p>
              <h3 className="text-5xl font-black drop-shadow-sm">{filteredStudents.length}</h3>
            </div>
            <div className="w-20 h-20 bg-white/10 rounded-[1.5rem] flex items-center justify-center backdrop-blur-md border border-white/20 transform group-hover:rotate-12 transition-transform duration-500 shadow-inner">
              <Users size={36} className="text-white drop-shadow-md" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] p-8 shadow-lg shadow-emerald-500/20 overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-teal-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="text-white">
              <p className="text-emerald-100 text-lg font-medium mb-2 flex items-center gap-2">
                آخر نشاط مسجل
              </p>
              <h3 className="text-3xl sm:text-4xl font-black drop-shadow-sm" dir="ltr">
                {safeSessions[0]?.createdAt 
                  ? new Date(safeSessions[0].createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }) 
                  : 'لا يوجد نشاط'}
              </h3>
            </div>
            <div className="w-20 h-20 bg-white/10 rounded-[1.5rem] flex items-center justify-center backdrop-blur-md border border-white/20 transform group-hover:-rotate-12 transition-transform duration-500 shadow-inner">
              <Clock size={36} className="text-white drop-shadow-md" strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>

      {/* روابط تقارير المستفيدين */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <FileText size={22} className="text-[#178bb6]" />
          روابط تقارير المستفيدين
        </h2>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-slate-500">لا يوجد مستفيدين مطابقين للبحث.</div>
          ) : (
            filteredStudents.map((student, index) => (
              <div 
                key={student.id} 
                onClick={() => {
                  setSelectedStudent(String(student.id));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`p-5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${index !== filteredStudents.length - 1 ? 'border-b border-slate-100' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                    <UserCircle size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{student.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">المستوى {student.currentLevel} - كود {student.accessCode || student.code}</p>
                  </div>
                </div>
                <button className="text-sm font-medium text-[#178bb6] hover:text-[#126d8f] bg-cyan-50 px-4 py-2 rounded-lg transition-colors">
                  عرض التقرير
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* آخر الجلسات */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Clock size={22} className="text-[#178bb6]" />
          آخر الجلسات
        </h2>
        <div className="space-y-3">
          {loadingSessions ? (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center text-slate-500">جارٍ تحميل الجلسات...</div>
          ) : filteredSessions.length === 0 ? (
             <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center text-slate-500">لا توجد جلسات مطابقة.</div>
          ) : (
            filteredSessions.map((session) => {
              const student = safeStudents.find(s => String(s.id) === String(session.studentId));
              const studentName = student?.name || 'مستفيد';
              const gameTitle = session.game?.titleAr || session.game?.title || session.game?.name || 'لعبة';
              
              return (
                <div key={session.id} className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group cursor-default">
                  
                  {/* تأثير بصري في الخلفية */}
                  <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-cyan-50 to-transparent rounded-br-full opacity-50 group-hover:scale-110 transition-transform duration-500 pointer-events-none"></div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    
                    {/* معلومات الطالب والجلسة */}
                    <div className="flex items-center gap-4 sm:gap-5">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#178bb6] to-cyan-400 rounded-2xl flex items-center justify-center text-white shadow-md transform group-hover:rotate-3 transition-transform duration-300 flex-shrink-0">
                        <UserCircle size={28} strokeWidth={2} />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-lg sm:text-xl group-hover:text-[#178bb6] transition-colors">{studentName}</h4>
                        <p className="text-slate-500 font-medium mt-1 flex items-center gap-2 text-sm sm:text-base">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                          {gameTitle}
                        </p>
                        <p className="text-xs text-slate-400 mt-2 font-medium flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(session.createdAt).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {/* إحصائيات الجلسة */}
                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-100 rounded-2xl py-2 px-4 shadow-sm group-hover:border-slate-200 transition-colors flex-1 sm:flex-none">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">المساعدة</span>
                        <span className={`text-sm font-black ${!session.promptLevel || session.promptLevel === 'INDEPENDENT' || session.promptLevel === 'NONE' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {mapPromptToArabic(session.promptLevel)}
                        </span>
                      </div>
                      
                      <div className="flex flex-col items-center justify-center bg-cyan-50/50 border border-cyan-100 rounded-2xl py-2 px-4 shadow-sm group-hover:border-cyan-200 transition-colors flex-1 sm:flex-none">
                        <span className="text-[10px] font-bold text-cyan-600 uppercase tracking-wider mb-1">المحاولات</span>
                        <span className="text-sm font-black text-[#178bb6]">{session.attempts}</span>
                      </div>

                      <div className="flex flex-col items-center justify-center bg-emerald-50/50 border border-emerald-100 rounded-2xl py-2 px-5 shadow-sm group-hover:border-emerald-200 transition-colors flex-1 sm:flex-none">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">التقييم</span>
                        <div className="flex items-end gap-0.5">
                          <span className="text-xl font-black text-emerald-600 leading-none">{session.score}</span>
                          <span className="text-xs font-bold text-emerald-600 leading-none pb-0.5">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ isOpen: false, message: '' })}
        onConfirm={() => setAlertConfig({ isOpen: false, message: '' })}
        title="تنبيه"
        message={alertConfig.message}
        confirmText="حسناً"
        isDestructive={false}
      />
    </div>
  );
};

export default ReportsPage;
