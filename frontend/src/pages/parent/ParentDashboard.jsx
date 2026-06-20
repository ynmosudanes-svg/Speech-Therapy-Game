import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import {
  Award,
  ClipboardPlus,
  BarChart3,
  CheckCircle2,
  Clock3,
  Gamepad2,
  Link as LinkIcon,
  LogOut,
  MessageCircle,
  Sparkles,
  Target,
  User,
  X,
} from 'lucide-react';
import { useTherapyStore } from '../../hooks/useTherapyStore';
import ConfirmModal from '../../components/ConfirmModal';
import parentService from '../../services/parentService';
import kid1 from '../../assets/ef5322cd-3a7f-40df-ade9-73fab97f6a41-removebg-preview.png';
import kid2 from '../../assets/f8c467e2-1d27-4e1a-8c9d-121ff72f66fc-removebg-preview.png';

const emptyRequestForm = {
  name: '',
  age: '',
  diagnosis: '',
};

const welcomeSlides = [
  {
    src: kid1,
    alt: 'طفل يستخدم منصة التخاطب',
    title: 'تجربة لعب علاجية',
    label: 'خطوة ممتعة كل يوم',
  },
  {
    src: kid2,
    alt: 'طفلة تستخدم منصة التخاطب',
    title: 'متابعة واضحة للطفل',
    label: 'ألعاب وتقارير في مكان واحد',
  },
];

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
  const [showWelcomeAd, setShowWelcomeAd] = useState(false);
  const isParentAccount = adminSession?.user?.role === 'PARENT';
  const welcomeAdStorageKey = adminSession?.user?.id || adminSession?.user?.email || adminSession?.email || 'parent';
  const approvedChildren = useMemo(
    () => (Array.isArray(students) ? students.filter((child) => child.requestStatus !== 'PENDING') : []),
    [students]
  );
  const pendingChildren = useMemo(
    () => (Array.isArray(students) ? students.filter((child) => child.requestStatus === 'PENDING') : []),
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

  useEffect(() => {
    if (!adminSession?.token) {
      return;
    }

    const storageKey = `parent-welcome-ad-seen:${welcomeAdStorageKey}`;
    if (!localStorage.getItem(storageKey)) {
      setShowWelcomeAd(true);
    }
  }, [adminSession?.token, welcomeAdStorageKey]);

  useEffect(() => {
    if (!showWelcomeAd) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [showWelcomeAd]);

  const refreshChildren = async () => {
    await fetchStudents(adminSession.token);
  };

  const handleLogout = () => {
    logoutAdmin();
    navigate('/');
  };

  const closeWelcomeAd = () => {
    localStorage.setItem(`parent-welcome-ad-seen:${welcomeAdStorageKey}`, 'true');
    setShowWelcomeAd(false);
  };

  const handleWelcomeAction = (action) => {
    closeWelcomeAd();

    if (action === 'games') {
      navigate('/library');
      return;
    }

    window.setTimeout(() => {
      const targetId = action === 'requests' ? 'parent-requests' : 'parent-actions';
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
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
      const result = await parentService.linkChild(adminSession.token, code);
      await refreshChildren();
      setAccessCode('');
      setSuccess(
        result?.data?.requestStatus === 'APPROVED'
          ? 'هذا الطفل مربوط بحسابك بالفعل.'
          : 'تم إرسال طلب ربط الطفل بنجاح. سيظهر الطفل بعد موافقة الفريق المختص.'
      );
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

      {showWelcomeAd && (
        <div className="fixed inset-0 z-[80] overflow-hidden bg-slate-950/55 px-4 py-5 backdrop-blur-md sm:px-6">
          <div className="flex min-h-full items-center justify-center">
            <section className="relative w-full max-w-5xl overflow-visible rounded-[2rem] border border-white/70 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
              <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[#20B7B5]/15" />
              <div className="absolute -bottom-28 right-1/3 h-72 w-72 rounded-full bg-[#1584C3]/15 blur-sm" />
              <div className="absolute left-8 top-8 hidden h-20 w-20 rounded-[2rem] border border-[#D9EAF2] bg-white/70 rotate-12 lg:block" />

              <button
                type="button"
                onClick={closeWelcomeAd}
                className="absolute -left-3 -top-3 z-30 grid h-12 w-12 place-items-center rounded-2xl border border-[#D9EAF2] bg-white text-slate-500 shadow-[0_12px_28px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-slate-800"
                aria-label="إغلاق الإعلان"
              >
                <X size={20} />
              </button>

              <div className="relative grid max-h-[88vh] overflow-hidden rounded-[2rem] lg:grid-cols-[0.88fr_1.12fr]">
                <div className="relative overflow-hidden border-b border-[#D9EAF2] bg-[linear-gradient(150deg,#EAF7FD_0%,#ffffff_58%,#E8FAF9_100%)] p-5 sm:p-7 lg:border-b-0 lg:border-l lg:p-8">
                  <div className="absolute -right-20 top-10 h-44 w-44 rounded-full bg-[#20B7B5]/15 blur-sm" />
                  <div className="absolute bottom-10 left-10 h-28 w-28 rounded-[2rem] bg-[#1584C3]/10 rotate-12" />
                  <div className="relative mx-auto flex min-h-[330px] max-w-[390px] flex-col justify-end overflow-hidden rounded-[1.8rem] bg-[linear-gradient(160deg,#0F6FA6_0%,#20B7B5_100%)] shadow-[0_24px_54px_rgba(15,111,166,0.24)] sm:min-h-[380px]">
                    <div className="absolute inset-x-5 top-5 z-20 flex items-center justify-between">
                      <span className="rounded-full bg-white/90 px-4 py-2 text-xs font-black text-[#0F6FA6] shadow-sm">
                        صور من المنصة
                      </span>
                      <span className="rounded-full bg-slate-950/18 px-4 py-2 text-xs font-black text-white backdrop-blur">
                        إعلان تفاعلي
                      </span>
                    </div>

                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.38),transparent_28%),linear-gradient(180deg,transparent_45%,rgba(7,59,92,0.38)_100%)]" />

                    <Swiper
                      modules={[Autoplay]}
                      loop
                      speed={850}
                      autoplay={{ delay: 2300, disableOnInteraction: false }}
                      className="relative z-10 h-[320px] w-full sm:h-[370px]"
                    >
                      {welcomeSlides.map((slide) => (
                        <SwiperSlide key={slide.src} className="!flex items-end justify-center">
                          <div className="relative flex h-full w-full items-end justify-center px-5 pt-16">
                            <img
                              src={slide.src}
                              alt={slide.alt}
                              className="h-[92%] w-auto max-w-[92%] object-contain object-bottom drop-shadow-[0_28px_34px_rgba(7,59,92,0.28)]"
                            />
                            <div className="absolute bottom-5 right-5 left-5 rounded-3xl border border-white/25 bg-white/85 p-3 text-right shadow-[0_18px_45px_rgba(7,59,92,0.18)] backdrop-blur">
                              <p className="text-xs font-black text-[#20B7B5]">{slide.label}</p>
                              <h3 className="mt-1 text-lg font-black text-[#073B5C]">{slide.title}</h3>
                            </div>
                          </div>
                        </SwiperSlide>
                      ))}
                    </Swiper>

                    <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                      <span className="h-2 w-8 rounded-full bg-white" />
                      <span className="h-2 w-2 rounded-full bg-white/55" />
                    </div>

                    <div className="absolute -left-4 top-32 z-20 hidden rounded-3xl bg-white px-4 py-3 text-right shadow-[0_18px_38px_rgba(15,23,42,0.16)] sm:block">
                      <p className="text-[11px] font-black text-slate-400">الهدف</p>
                      <p className="text-sm font-black text-[#073B5C]">تعلم ممتع وآمن</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-7 lg:p-8">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#D9EAF2] bg-[#F8FBFD] px-4 py-2 text-xs font-black text-[#0F6FA6] shadow-sm">
                      <Sparkles size={16} />
                      مرحبًا بك في منصة التخاطب
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#0F6FA6] px-4 py-2 text-xs font-black text-white shadow-[0_12px_24px_rgba(15,111,166,0.2)]">
                      إعلان تعريفي سريع
                    </span>
                  </div>

                  <h1 className="max-w-2xl text-2xl font-black leading-[1.45] tracking-[-0.02em] text-[#073B5C] sm:text-4xl">
                    نحن سعداء بانضمامك إلينا.
                  </h1>

                  <p className="mt-4 max-w-2xl text-sm font-bold leading-7 text-slate-600 sm:text-base sm:leading-8">
                    تساعد المنصة طفلك على تطوير مهارات اللغة والتواصل، الانتباه والتركيز،
                    الإدراك والتفكير، والتفاعل الأسري من خلال ألعاب تعليمية ممتعة ومتابعة علاجية واضحة.
                  </p>

                  <div className="mt-4 grid gap-2 sm:grid-cols-4">
                    {[
                      { icon: MessageCircle, label: 'اللغة والتواصل' },
                      { icon: Target, label: 'الانتباه والتركيز' },
                      { icon: Gamepad2, label: 'الإدراك والتفكير' },
                      { icon: User, label: 'التفاعل الأسري' },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#D9EAF2] bg-[#F8FBFD] px-3 py-3 text-center shadow-sm">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#1584C3] shadow-sm ring-1 ring-[#D9EAF2]">
                            <Icon size={19} />
                          </span>
                          <span className="text-[11px] font-black leading-5 text-slate-800">{item.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  <h2 className="mt-5 text-lg font-black text-[#073B5C]">ماذا يمكنك أن تفعل الآن؟</h2>
                  <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                    {[
                      'إضافة طفل جديد',
                      'متابعة حالة طلباتك',
                      'استعراض نماذج من الألعاب التعليمية',
                      'التعرف على آلية المتابعة والتقارير',
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-3 rounded-2xl border border-[#D9EAF2] bg-[#F8FBFD] px-3.5 py-2.5 shadow-sm">
                        <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
                        <span className="text-[13px] font-black leading-6 text-slate-700">{item}</span>
                      </div>
                    ))}
                  </div>

                  {pendingChildren.length > 0 && (
                    <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-bold leading-7 text-amber-800">
                      لديك {pendingChildren.length} طلب قيد المراجعة. سيقوم فريقنا بمراجعته في أقرب وقت ممكن،
                      وسيتم إشعارك فور تفعيل حساب الطفل.
                    </div>
                  )}

                  <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => handleWelcomeAction('add')}
                      className="rounded-2xl bg-[linear-gradient(135deg,#1584C3,#20B7B5)] px-5 py-4 text-sm font-black text-white shadow-[0_16px_30px_rgba(21,132,195,0.24)] transition hover:-translate-y-0.5"
                    >
                      إضافة طفل
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWelcomeAction('games')}
                      className="rounded-2xl border border-[#D9EAF2] bg-white px-5 py-4 text-sm font-black text-[#0F6FA6] shadow-sm transition hover:bg-[#F8FBFD]"
                    >
                      استعراض الألعاب
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWelcomeAction('requests')}
                      className="rounded-2xl border border-[#D9EAF2] bg-white px-5 py-4 text-sm font-black text-slate-700 shadow-sm transition hover:bg-[#F8FBFD]"
                    >
                      متابعة الطلبات
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

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
                    <p className="text-2xl font-black text-[#20B7B5]">{pendingChildren.length}</p>
                    <p className="mt-1 text-xs font-black text-slate-500">طلبات قيد المراجعة</p>
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
                  {submitting ? 'جاري إرسال الطلب...' : 'إرسال طلب الربط'}
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

        <section id="parent-children" className="scroll-mt-24 mb-7">
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

        {pendingChildren.length > 0 && (
          <section id="parent-requests" className="scroll-mt-24">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-xl font-black text-slate-900">طلبات قيد المراجعة</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  الطلبات التي لم يتم تفعيلها بعد تظهر هنا حتى يوافق عليها الفريق.
                </p>
              </div>
              <span className="w-fit rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-black text-amber-700">
                {pendingChildren.length} طلب
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {pendingChildren.map((child) => (
                <article key={child.id} className="rounded-[1.5rem] border border-amber-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-lg font-black text-amber-600 ring-1 ring-amber-200">
                        {child.name?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-black leading-tight text-slate-900">{child.name}</h3>
                        <p className="mt-0.5 text-[11px] font-bold text-slate-500">العمر: {child.age} سنوات</p>
                      </div>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-black text-amber-700">
                      <Clock3 size={14} />
                      في انتظار الموافقة
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
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
