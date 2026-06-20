import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  ClipboardPlus,
  BarChart3,
  Gamepad2,
  Link as LinkIcon,
  LogOut,
  User,
} from 'lucide-react';
import { useTherapyStore } from '../../hooks/useTherapyStore';
import ConfirmModal from '../../components/ConfirmModal';
import parentService from '../../services/parentService';

const emptyRequestForm = {
  name: '',
  age: '',
  diagnosis: '',
};

const ParentDashboard = () => {
  const navigate = useNavigate();
  const { adminSession, logoutAdmin, fetchStudents, students } = useTherapyStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeAction, setActiveAction] = useState('link');
  const [accessCode, setAccessCode] = useState('');
  const [requestForm, setRequestForm] = useState(emptyRequestForm);
  const [submitting, setSubmitting] = useState(false);
  const [copiedChildId, setCopiedChildId] = useState(null);
  const [dialog, setDialog] = useState(null);
  const isParentAccount = adminSession?.user?.role === 'PARENT';
  const approvedChildren = useMemo(
    () => (Array.isArray(students) ? students.filter((child) => child.requestStatus !== 'PENDING') : []),
    [students]
  );

  useEffect(() => {
    const loadData = async () => {
      if (!adminSession?.token) {
        navigate('/');
        return;
      }

      try {
        setLoading(true);
        await fetchStudents(adminSession.token);
      } catch {
        setError('حدث خطأ أثناء تحميل بيانات الأطفال.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [adminSession?.token, fetchStudents, navigate]);

  const refreshChildren = async () => {
    await fetchStudents(adminSession.token);
  };

  const handleLogout = () => {
    logoutAdmin();
    navigate('/');
  };

  const handleLinkChild = async (event) => {
    event.preventDefault();
    const code = accessCode.trim().toUpperCase();

    if (!code) {
      setError('من فضلك أدخل كود الطفل.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      await parentService.linkChild(adminSession.token, code);
      await refreshChildren();
      setAccessCode('');
      setSuccess('تم ربط الطفل بحسابك بنجاح.');
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          'تعذر ربط الطفل. تأكد من الكود وحاول مرة أخرى.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestChild = async (event) => {
    event.preventDefault();

    if (!requestForm.name.trim() || !requestForm.age) {
      setError('من فضلك أدخل اسم الطفل وعمره.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      await parentService.requestChild(adminSession.token, {
        name: requestForm.name.trim(),
        age: Number(requestForm.age),
        diagnosis: requestForm.diagnosis.trim(),
      });
      await refreshChildren();
      setRequestForm(emptyRequestForm);
      setSuccess('تم تقديم طلب الطفل بنجاح. سيظهر للمتابعة من الفريق المختص.');
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          'تعذر تقديم الطلب. تأكد من البيانات وحاول مرة أخرى.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewReport = (child) => {
    navigate(`/parent/reports/${child.id}`);
  };

  const handleCopyChildCode = async (child) => {
    const code = child.accessCode || child.code;

    if (!code) {
      setError('كود الطفل غير متوفر.');
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setCopiedChildId(child.id);
      window.setTimeout(() => {
        setCopiedChildId((current) => (current === child.id ? null : current));
      }, 1500);
    } catch {
      setError('تعذر نسخ كود الطفل.');
    }
  };

  const handleUnlinkChild = async (child) => {
    if (!isParentAccount) {
      setError('إلغاء الربط متاح فقط من حساب ولي الأمر المرتبط بالطفل.');
      return;
    }

    setDialog({
      title: 'إلغاء الربط',
      message: `هل تريد إلغاء ربط ${child.name} من الحساب؟`,
      confirmText: 'إلغاء الربط',
      cancelText: 'إلغاء',
      isDestructive: true,
      onConfirm: async () => {
        try {
          setSubmitting(true);
          await parentService.unlinkChild(adminSession.token, child.id);
          await refreshChildren();
        } catch (unlinkError) {
          setError(unlinkError?.response?.data?.message || 'تعذر إلغاء الربط.');
        } finally {
          setSubmitting(false);
          setDialog(null);
        }
      },
    });
  };

  const updateRequestField = (field, value) => {
    setRequestForm((current) => ({ ...current, [field]: value }));
    setError('');
    setSuccess('');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#D9EAF2] border-t-[#1584C3]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-arabic text-slate-800" dir="rtl">
      <nav className="app-nav-shell sticky top-0 z-30 border-b backdrop-blur-md">
        <div dir="rtl" className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <button type="button" onClick={() => navigate('/parent/dashboard')} className="flex shrink-0 items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-[#dbe7f3]">
              <img src="/logo.png" alt="العيادة السودانية" className="h-7 w-7 object-contain" />
            </span>
            <span className="app-brand-text font-arabic text-right text-base leading-none tracking-normal sm:text-lg" dir="rtl">
              العيادة السودانية
            </span>
          </button>

          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={() => document.getElementById('parent-actions')?.scrollIntoView({ behavior: 'smooth' })}
              className="app-nav-link app-nav-link-active"
            >
              الإجراءات
            </button>
            <button
              type="button"
              onClick={() => document.getElementById('parent-children')?.scrollIntoView({ behavior: 'smooth' })}
              className="app-nav-link"
            >
              أطفالي
            </button>
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <div className="hidden min-w-0 items-center gap-2 rounded-2xl bg-white/80 px-3 py-2 ring-1 ring-[#dbe7f3] lg:flex">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
                <User size={20} />
              </div>
              <div className="min-w-0 text-right">
                <p className="text-[10px] font-black text-[var(--primary)]">لوحة المستفيد</p>
                <p className="max-w-[150px] truncate text-sm font-black text-slate-800">{adminSession?.user?.name}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-red-500 ring-1 ring-red-100 transition hover:bg-red-50 lg:inline-flex"
              title="خروج"
            >
              <LogOut size={19} />
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section id="parent-actions" className="scroll-mt-24 mb-7 overflow-hidden rounded-[1.75rem] border border-[#dbe7f3] bg-white shadow-[0_18px_45px_-32px_rgba(15,111,166,0.45)]">
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative overflow-hidden bg-[linear-gradient(135deg,#EAF7FD_0%,#F8FBFD_58%,#ffffff_100%)] p-6 sm:p-8">
              <div className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-[#20B7B5]/10" />
              <div className="absolute -bottom-20 right-10 h-44 w-44 rounded-full bg-[#1584C3]/10" />
              <div className="relative">
                <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#1584C3] shadow-sm ring-1 ring-[#D9EAF2]">
                  <User size={24} />
                </span>
                <h2 className="text-2xl font-black text-slate-950 sm:text-3xl">إدارة الأطفال</h2>
                <p className="mt-3 max-w-xl text-sm font-bold leading-7 text-slate-600">
                  اربط حساب طفل موجود بالكود، أو أرسل طلب إضافة طفل جديد ليقوم الفريق المختص بمراجعته.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/80 bg-white/75 px-4 py-3">
                    <p className="text-2xl font-black text-[#0F6FA6]">{approvedChildren.length}</p>
                    <p className="mt-1 text-xs font-black text-slate-500">أطفال مرتبطين</p>
                  </div>
                  <div className="rounded-2xl border border-white/80 bg-white/75 px-4 py-3">
                    <p className="text-2xl font-black text-[#20B7B5]">{activeAction === 'link' ? 'ربط' : 'طلب'}</p>
                    <p className="mt-1 text-xs font-black text-slate-500">الإجراء الحالي</p>
                  </div>
                </div>
              </div>
            </div>

          <div className="p-4 sm:p-6">
            <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-[#F1F8FC] p-1.5">
              <button
                type="button"
                onClick={() => {
                  setActiveAction('link');
                  setError('');
                  setSuccess('');
                }}
                className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-black transition ${
                  activeAction === 'link' ? 'bg-white text-[#0F6FA6] shadow-sm ring-1 ring-[#D9EAF2]' : 'text-slate-500 hover:bg-white/60 hover:text-[#0F6FA6]'
                }`}
              >
                <LinkIcon size={18} />
                ربط طفل بالكود
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveAction('request');
                  setError('');
                  setSuccess('');
                }}
                className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-black transition ${
                  activeAction === 'request' ? 'bg-white text-[#0F6FA6] shadow-sm ring-1 ring-[#D9EAF2]' : 'text-slate-500 hover:bg-white/60 hover:text-[#0F6FA6]'
                }`}
              >
                <ClipboardPlus size={18} />
                تقديم طلب لطفل
              </button>
            </div>

            {activeAction === 'link' ? (
              <form onSubmit={handleLinkChild} className="space-y-3">
                <input
                  value={accessCode}
                  onChange={(event) => {
                    setAccessCode(event.target.value.toUpperCase());
                    setError('');
                    setSuccess('');
                  }}
                  placeholder="أدخل كود الطفل"
                  className="min-h-14 w-full rounded-2xl border border-[#D9EAF2] bg-[#F8FBFD] px-4 text-center text-lg font-black tracking-wide text-slate-800 outline-none transition focus:border-[#1584C3] focus:bg-white focus:ring-4 focus:ring-[#1584C3]/15"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[3.25rem] w-full rounded-2xl bg-[linear-gradient(135deg,#1584C3,#20B7B5)] px-4 font-black text-white shadow-[0_14px_30px_rgba(21,132,195,0.22)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'جاري الربط...' : 'ربط الطفل'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRequestChild} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-[1fr_0.55fr]">
                  <input
                    value={requestForm.name}
                    onChange={(event) => updateRequestField('name', event.target.value)}
                    placeholder="اسم الطفل"
                    className="min-h-[3.25rem] rounded-2xl border border-[#D9EAF2] bg-[#F8FBFD] px-4 text-sm font-bold outline-none transition focus:border-[#1584C3] focus:bg-white focus:ring-4 focus:ring-[#1584C3]/15"
                  />
                  <input
                    type="number"
                    min="1"
                    max="25"
                    value={requestForm.age}
                    onChange={(event) => updateRequestField('age', event.target.value)}
                    placeholder="العمر"
                    className="min-h-[3.25rem] rounded-2xl border border-[#D9EAF2] bg-[#F8FBFD] px-4 text-sm font-bold outline-none transition focus:border-[#1584C3] focus:bg-white focus:ring-4 focus:ring-[#1584C3]/15"
                  />
                </div>
                <textarea
                  value={requestForm.diagnosis}
                  onChange={(event) => updateRequestField('diagnosis', event.target.value)}
                  placeholder="ملاحظات أو التشخيص إن وجد"
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-[#D9EAF2] bg-[#F8FBFD] px-4 py-3 text-sm font-bold outline-none transition focus:border-[#1584C3] focus:bg-white focus:ring-4 focus:ring-[#1584C3]/15"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[3.25rem] w-full rounded-2xl bg-[linear-gradient(135deg,#1584C3,#20B7B5)] px-4 font-black text-white shadow-[0_14px_30px_rgba(21,132,195,0.22)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'جاري إرسال الطلب...' : 'تقديم الطلب'}
                </button>
              </form>
            )}
          </div>
          </div>
        </section>

        {error && (
          <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 font-bold text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-xl border border-[#D9EAF2] bg-[#EAF7FD] px-4 py-3 font-bold text-[#0F6FA6]">
            {success}
          </div>
        )}

        <section id="parent-children" className="scroll-mt-24">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl font-black text-slate-900">أطفالي</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                اختر حساب الطفل للدخول والبدء في الألعاب العلاجية.
              </p>
            </div>
            <span className="w-fit rounded-full border border-[#D9EAF2] bg-white px-4 py-2 text-xs font-black text-[#0F6FA6]">
              {approvedChildren.length} أطفال
            </span>
          </div>

          {approvedChildren.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-[#CFE3F3] bg-white/80 px-6 py-8 text-center shadow-[0_12px_30px_-26px_rgba(15,111,166,0.35)]">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF7FD] text-[#0F6FA6]">
                <User size={24} />
              </div>
              <h3 className="mb-2 text-lg font-black text-slate-900">لا يوجد أطفال مرتبطون بعد</h3>
              <p className="mx-auto max-w-xl text-sm font-semibold leading-7 text-slate-500">
                ابدأ بربط طفل بالكود أو تقديم طلب لطفل جديد من الأعلى.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {approvedChildren.map((child) => (
                <article
                  key={child.id}
                  className="relative overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="mb-4 flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#1584C3,#20B7B5)] text-lg font-black text-white shadow-[0_10px_20px_rgba(21,132,195,0.16)]">
                        {child.name?.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-black leading-tight text-slate-900">{child.name}</h3>
                        <p className="mt-0.5 text-[11px] font-medium text-slate-500">العمر: {child.age} سنوات</p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-600">
                      مستوى {child.currentLevel}
                    </div>
                  </div>

                  <div className="mb-4 grid gap-2.5 sm:grid-cols-2">
                    <div className="flex min-w-0 items-center gap-2 rounded-xl border border-[#D9EAF2] bg-[#F8FBFD] p-2.5">
                      <Gamepad2 size={18} className="shrink-0 text-[#1584C3]" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold leading-5 text-slate-400">الألعاب المخصصة</p>
                        <p className="text-xs font-black leading-5 text-slate-700">{child.assignedGames?.length || 0} ألعاب</p>
                      </div>
                    </div>
                    {child.planName && (
                      <div className="flex min-w-0 items-center gap-2 rounded-xl border border-[#D9EAF2] bg-[#F8FBFD] p-2.5">
                        <Award size={18} className="shrink-0 text-[#20B7B5]" />
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold leading-5 text-slate-400">الخطة الحالية</p>
                          <p className="line-clamp-2 text-xs font-black leading-5 text-slate-700" title={child.planName}>
                            {child.planName}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-2xl border border-[#D9EAF2] bg-[#F8FBFD] p-3">
                      <p className="mb-2 text-[11px] font-bold text-slate-400">كود الطفل</p>
                      <div className="rounded-2xl bg-white px-3 py-2.5 shadow-sm ring-1 ring-[#D9EAF2]">
                        <div className="mb-1.5 flex justify-start">
                          <button
                            type="button"
                            onClick={() => handleCopyChildCode(child)}
                            className="shrink-0 rounded-xl border border-[#D9EAF2] bg-white px-3 py-1 text-[11px] font-black text-[#0F6FA6] transition hover:bg-[#F8FBFD]"
                          >
                            {copiedChildId === child.id ? 'تم النسخ' : 'نسخ'}
                          </button>
                        </div>
                        <code className="select-all text-xs font-black tracking-[0.24em] text-slate-900">
                          {child.accessCode || child.code || 'غير متوفر'}
                        </code>
                      </div>
                    </div>

                    {isParentAccount && (
                    <button
                      type="button"
                      onClick={() => handleUnlinkChild(child)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-black text-rose-700 shadow-sm transition hover:bg-rose-100"
                    >
                      إلغاء الربط
                    </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleViewReport(child)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#D9EAF2] bg-white px-4 py-2 font-black text-[#0F6FA6] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#F8FBFD]"
                    >
                      <BarChart3 size={18} />
                      عرض التقرير
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {dialog && (
        <ConfirmModal
          isOpen
          onClose={() => setDialog(null)}
          onConfirm={dialog.onConfirm || (() => setDialog(null))}
          title={dialog.title}
          message={dialog.message}
          confirmText={dialog.confirmText}
          cancelText={dialog.cancelText}
          isDestructive={dialog.isDestructive ?? true}
          hideCancelButton={dialog.hideCancelButton ?? false}
          position="top"
        />
      )}
    </div>
  );
};

export default ParentDashboard;
