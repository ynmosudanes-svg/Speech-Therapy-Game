import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, BookOpen, Gamepad2, AlertTriangle, X, CheckCircle } from 'lucide-react';
import Button from '../../components/Button';
import { useTherapyStore } from '../../hooks/useTherapyStore';
import gameLibraryService from '../../services/gameLibraryService';

const PatientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { adminSession, students, regenerateStudentAccessCode } = useTherapyStore();

  const [accessCode, setAccessCode] = useState('');
  const [busyCodeAction, setBusyCodeAction] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ show: false, text: '', type: 'success' });
  const [libraries, setLibraries] = useState([]);
  const [selectedLibraryId, setSelectedLibraryId] = useState('');

  const storeStudent = useMemo(() => {
    if (!Array.isArray(students)) {
      return null;
    }

    return students.find((item) => String(item.id) === String(id)) || null;
  }, [id, students]);

  const workspace = useMemo(() => {
    if (storeStudent) {
      return {
        patient: {
          id: String(storeStudent.id),
          name: storeStudent.name,
          accessCode: storeStudent.accessCode || storeStudent.code || '',
          age: storeStudent.age,
          diagnosis: storeStudent.diagnosis || 'غير محدد',
          progress: storeStudent.progress || 0,
          attendanceRate: storeStudent.attendanceRate || 0,
        },
      };
    }

    return null;
  }, [id, storeStudent]);

  const patient = workspace?.patient;
  const assignedGames = Array.isArray(storeStudent?.assignedGames) ? storeStudent.assignedGames : [];
  const currentAccessCode = accessCode || patient?.accessCode || '';
  useEffect(() => {
    if (!adminSession?.token) {
      setLibraries([]);
      return;
    }

    let isMounted = true;

    const fetchLibraries = async () => {
      try {
        const response = await gameLibraryService.getLibraries(adminSession.token);
        if (isMounted) {
          setLibraries(Array.isArray(response) ? response : response?.data || []);
        }
      } catch (error) {
        console.error('Failed to load game libraries', error);
        if (isMounted) {
          setLibraries([]);
        }
      }
    };

    fetchLibraries();

    return () => {
      isMounted = false;
    };
  }, [adminSession?.token]);


  const assignedLibraryFolders = useMemo(() => {
    const assignedIds = new Set(assignedGames.map((game) => String(game.id)));
    const folders = (Array.isArray(libraries) ? libraries : [])
      .map((library, index) => {
        const games = Array.isArray(library.games)
          ? library.games.filter((game) => assignedIds.has(String(game.id)))
          : [];

        return {
          ...library,
          color: library.color || ['#1584C3', '#14A383', '#A855F7', '#E11D48'][index % 4],
          games,
        };
      })
      .filter((library) => library.games.length > 0);

    const groupedGameIds = new Set(folders.flatMap((library) => library.games.map((game) => String(game.id))));
    const ungroupedGames = assignedGames.filter((game) => !groupedGameIds.has(String(game.id)));

    if (ungroupedGames.length > 0) {
      folders.push({
        id: '__ungrouped__',
        name: 'ألعاب خارج المكتبات',
        description: 'ألعاب مخصصة للطفل لكنها غير موجودة داخل مكتبة علاجية محددة.',
        color: '#1584C3',
        games: ungroupedGames,
      });
    }

    return folders;
  }, [assignedGames, libraries]);

  const selectedLibrary = useMemo(
    () => assignedLibraryFolders.find((library) => String(library.id) === String(selectedLibraryId)) || null,
    [assignedLibraryFolders, selectedLibraryId]
  );
  const handleCopyCode = async () => {
    if (!currentAccessCode) return;

    try {
      await navigator.clipboard.writeText(currentAccessCode);
      setAlertMessage({ show: true, text: 'تم نسخ كود الدخول.', type: 'success' });
    } catch {
      setAlertMessage({ show: true, text: 'تعذر نسخ الكود.', type: 'error' });
    }
  };

  const handlePrintCode = () => {
    if (!currentAccessCode || !patient) return;

    const printWindow = window.open('', '', 'width=600,height=460');
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>بطاقة الدخول - ${patient.name}</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; margin: 0; }
            .card { background: white; width: 420px; border-radius: 28px; padding: 32px; border: 2px solid #dbe7f3; box-shadow: 0 14px 32px rgba(0,0,0,.08); text-align: center; }
            .title { font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
            .subtitle { color: #475569; line-height: 1.7; margin-bottom: 20px; }
            .code { background: #2563eb; color: white; font-size: 32px; font-weight: 800; letter-spacing: 4px; border-radius: 20px; padding: 18px; margin: 18px 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="title">${patient.name}</div>
            <div class="subtitle">كود دخول المستفيد</div>
            <div class="code">${currentAccessCode}</div>
          </div>
          <script>window.onload = function () { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleRegenerateCode = () => {
    if (!storeStudent) return;
    setConfirmDialog(true);
  };

  const confirmRegenerateCode = async () => {
    setConfirmDialog(false);
    try {
      setBusyCodeAction(true);
      const updated = await regenerateStudentAccessCode(storeStudent.id);
      setAccessCode(updated?.accessCode || '');
      setAlertMessage({ show: true, text: 'تم تجديد الكود بنجاح.', type: 'success' });
    } catch (error) {
      setAlertMessage({ show: true, text: error?.response?.data?.message || error?.message || 'تعذر تجديد الكود.', type: 'error' });
    } finally {
      setBusyCodeAction(false);
    }
  };

  if (!patient) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center" dir="rtl">
        <h1 className="text-2xl font-black text-slate-900 mb-2">لم يتم العثور على المريض</h1>
        <p className="text-slate-600 mb-5">تحقق من رقم المريض أو ارجع لقائمة المرضى.</p>
        <Button variant="primary" onClick={() => navigate('/admin/patients')}>العودة لقائمة المرضى</Button>
      </div>
    );
  }

  return (
    <section dir="rtl" className="space-y-4">
      <main className="bg-white border border-slate-200 rounded-[1.6rem] p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{patient.name}</h1>
            <p className="text-slate-600">البيانات الأساسية للمستفيد والألعاب المخصصة له.</p>
            {!storeStudent && (
              <p className="text-sm font-bold text-amber-600 mt-2">
                هذا الملف معروض من بيانات تجريبية، لذلك زر تعديل الطفل غير متاح هنا.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {storeStudent && (
              <Button
                variant="primary"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate(`/admin/patients/edit/${storeStudent.id}`)}
              >
                تعديل الطفل
              </Button>
            )}
            <Button
              variant="outline"
              className="border-red-500 text-red-600 hover:bg-red-50 hover:border-red-600"
              onClick={() => navigate('/admin/patients')}
            >
              <ArrowRight size={16} />
              العودة للمرضى
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <div className="text-sm text-slate-500 font-bold mb-2">كود الدخول</div>
          <div className="text-2xl font-black tracking-[0.14em] text-blue-700 mb-3">{currentAccessCode || '---'}</div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="!py-2" onClick={handleCopyCode}>نسخ الكود</Button>
            <Button variant="outline" className="!py-2" onClick={handlePrintCode}>طباعة</Button>
            {storeStudent && (
              <Button
                variant="primary"
                className="!py-2 bg-blue-600 hover:bg-blue-700"
                disabled={busyCodeAction}
                onClick={handleRegenerateCode}
              >
                تجديد الكود
              </Button>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
          <InfoCard title="العمر" value={`${patient.age} سنوات`} />
          <InfoCard title="التشخيص" value={patient.diagnosis} />
          <InfoCard title="نسبة الحضور" value={`${patient.attendanceRate || '--'}%`} />
          <InfoCard title="نسبة التقدم" value={`${patient.progress || '--'}%`} />
        </div>

        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-slate-900">
              <Gamepad2 size={18} className="text-blue-600" />
              <h2 className="text-xl font-black">الألعاب المخصصة</h2>
            </div>

            {selectedLibrary && (
              <button
                type="button"
                onClick={() => setSelectedLibraryId('')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-4 py-2 text-sm font-black text-blue-600 shadow-sm transition hover:bg-blue-50"
              >
                <ArrowRight size={16} />
                رجوع للمكتبات
              </button>
            )}
          </div>

          {!storeStudent || assignedGames.length === 0 ? (
            <EmptyBlock text="لا توجد ألعاب مخصصة لهذا المستفيد حاليًا." />
          ) : selectedLibrary ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
              {selectedLibrary.games.map((game, index) => (
                <div
                  key={game.id}
                  className="group relative overflow-hidden rounded-[2rem] border border-[#dbe7f3] bg-white p-6 text-right shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  onClick={() => navigate(`/admin/games/edit/${game.id}`)}
                >
                  <div className="absolute inset-x-5 top-0 h-2 rounded-b-full" style={{ backgroundColor: selectedLibrary.color }} />

                  <div className="relative z-10">
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#EAF7FD] shadow-sm ring-1 ring-[#cfe3f3]" style={{ color: selectedLibrary.color }}>
                        <Gamepad2 size={28} />
                      </div>
                      <span className="rounded-full bg-[#EAF7FD] px-3 py-1 text-xs font-black ring-1 ring-[#cfe3f3]" style={{ color: selectedLibrary.color }}>
                        #{index + 1}
                      </span>
                    </div>

                    <h3 className="font-black text-slate-800 text-xl mb-2">{game.titleAr || game.title || game.name}</h3>
                    <p className="text-sm font-bold text-slate-500 mb-6 line-clamp-2 leading-relaxed">
                      {game.descriptionAr || game.description || 'لعبة تفاعلية مخصصة لتنمية المهارات الإدراكية والتخاطب بصورة ممتعة ومحفزة.'}
                    </p>

                    <div className="flex items-center justify-end mt-auto">
                      <span className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black text-white shadow-sm transition-transform group-hover:-translate-x-1" style={{ backgroundColor: selectedLibrary.color }}>
                        تعديل اللعبة
                        <ArrowRight size={17} />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : assignedLibraryFolders.length === 0 ? (
            <EmptyBlock text="لا توجد مكتبات علاجية تحتوي ألعاب هذا المستفيد حاليًا." />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
              {assignedLibraryFolders.map((library) => (
                <button
                  type="button"
                  key={library.id}
                  onClick={() => setSelectedLibraryId(String(library.id))}
                  className="group relative min-h-[18.5rem] overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 text-right shadow-[0_18px_40px_-30px_rgba(15,23,42,0.4)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_52px_-32px_rgba(15,23,42,0.45)]"
                >
                  <div className="absolute inset-x-4 top-0 h-2.5 rounded-b-full" style={{ backgroundColor: library.color }} />
                  <div className="pointer-events-none absolute -left-14 -top-14 h-36 w-36 rounded-full opacity-10" style={{ backgroundColor: library.color }} />
                  <span className="absolute left-8 top-8 rounded-full bg-slate-50 px-3.5 py-1.5 text-xs font-black text-slate-600 ring-1 ring-slate-100">
                    {library.games.length} لعبة
                  </span>
                  <span className="absolute right-8 top-8 grid h-[5.25rem] w-[5.25rem] place-items-center rounded-[1.65rem] bg-white shadow-[0_14px_30px_-24px_rgba(15,23,42,0.55)] ring-1 ring-slate-100" style={{ color: library.color }}>
                    <BookOpen size={36} />
                  </span>

                  <div className="relative z-10 flex min-h-[14rem] flex-col pt-28">
                    <h3 className="line-clamp-2 text-2xl font-black leading-9 text-slate-900">{library.name}</h3>
                    <p className="mt-3 line-clamp-3 max-w-[24rem] text-sm font-bold leading-7 text-slate-500">
                      {library.description || 'مجموعة ألعاب علاجية مخصصة لهذا المستفيد.'}
                    </p>

                    <div className="mt-auto flex items-center justify-start pt-8">
                      <span className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-black text-white shadow-[0_14px_24px_-18px_rgba(15,23,42,0.5)] transition-transform group-hover:-translate-x-1" style={{ backgroundColor: library.color }}>
                        عرض الألعاب
                        <ArrowRight size={17} />
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Custom Modals */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">تجديد الكود</h3>
              <p className="text-slate-500 font-medium">هل أنت متأكد من رغبتك في تجديد كود الدخول؟ الكود القديم سيتوقف عن العمل ولن يتمكن المستفيد من الدخول به.</p>
            </div>
            <div className="flex gap-3 p-4 bg-slate-50 border-t border-slate-100">
              <Button variant="primary" className="flex-1 justify-center" onClick={confirmRegenerateCode}>
                تأكيد التجديد
              </Button>
              <Button variant="outline" className="flex-1 justify-center bg-white" onClick={() => setConfirmDialog(false)}>
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}

      {alertMessage.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setAlertMessage({ ...alertMessage, show: false })}>
          <div className="bg-white rounded-[2rem] shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${alertMessage.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                {alertMessage.type === 'success' ? <CheckCircle className="w-8 h-8" /> : <X className="w-8 h-8" />}
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">{alertMessage.type === 'success' ? 'تمت العملية' : 'حدث خطأ'}</h3>
              <p className="text-slate-500 font-medium">{alertMessage.text}</p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <Button variant="primary" className="w-full justify-center" onClick={() => setAlertMessage({ ...alertMessage, show: false })}>
                حسناً
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

const InfoCard = ({ title, value }) => (
  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
    <div className="text-xs text-slate-500 font-bold mb-1">{title}</div>
    <div className="text-lg font-black text-slate-900">{value}</div>
  </div>
);

const EmptyBlock = ({ text }) => (
  <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 font-bold">{text}</div>
);

export default PatientDetails;
