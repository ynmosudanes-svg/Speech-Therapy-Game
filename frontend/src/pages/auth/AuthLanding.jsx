import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Check, Gamepad2, Stethoscope, UserPlus } from 'lucide-react';
import { Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { useTherapyStore } from '../../hooks/useTherapyStore';
import doctorFemale from '../../assets/c73eee5a-084b-40b7-8008-12cf4b733b52-removebg-preview.png';
import doctorMale from '../../assets/e0430cf0-bc12-4225-9bbb-6ef7153a17cd-removebg-preview.png';

const REGISTERED_USER_KEY = 'registered_user';

const accountTypes = [
  { value: 'parent', label: 'ولي أمر' },
  { value: 'specialist', label: 'أخصائي' },
];

const initialRegisterForm = {
  firstName: '',
  lastName: '',
  name: '',
  phone: '',
  email: '',
  password: '',
  accountType: 'parent',
};

const initialStaffForm = {
  email: '',
  password: '',
};

const heroDoctors = [
  { src: doctorFemale, alt: 'أخصائية علاج نطق' },
  { src: doctorMale, alt: 'أخصائي علاج نطق' },
];

const brandPhrases = [
  {
    title: 'منصة الألعاب العلاجية',
    subtitle: 'رعاية، لعب، وخطة مناسبة',
    dir: 'rtl',
  },
  {
    title: 'Speech Therapy Games',
    subtitle: 'Care, play, and a tailored plan',
    dir: 'ltr',
  },
];

const TypewriterBrand = () => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [letterCount, setLetterCount] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const currentPhrase = brandPhrases[phraseIndex];
  const combinedText = `${currentPhrase.title}|${currentPhrase.subtitle}`;
  const visibleText = combinedText.slice(0, letterCount);
  const [visibleTitle = '', visibleSubtitle = ''] = visibleText.split('|');

  useEffect(() => {
    const atFullText = letterCount === combinedText.length;
    const atEmptyText = letterCount === 0;
    const delay = atFullText && !deleting ? 1500 : deleting ? 32 : 58;

    const timer = window.setTimeout(() => {
      if (atFullText && !deleting) {
        setDeleting(true);
        return;
      }

      if (atEmptyText && deleting) {
        setDeleting(false);
        setPhraseIndex((current) => (current + 1) % brandPhrases.length);
        return;
      }

      setLetterCount((current) => current + (deleting ? -1 : 1));
    }, delay);

    return () => window.clearTimeout(timer);
  }, [combinedText.length, deleting, letterCount]);

  return (
    <span dir={currentPhrase.dir} className="block min-w-[190px] text-start">
      <span className="block min-h-5 text-sm font-black text-[#0F6FA6] md:text-base">
        {visibleTitle || '\u00A0'}
        {!visibleSubtitle && (
          <span className="mx-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse rounded-full bg-[#1584C3]" />
        )}
      </span>
      <span className="block min-h-4 text-xs font-bold text-[#64748B]">
        {visibleSubtitle || '\u00A0'}
        {visibleSubtitle && (
          <span className="mx-0.5 inline-block h-3 w-0.5 translate-y-0.5 animate-pulse rounded-full bg-[#1584C3]" />
        )}
      </span>
    </span>
  );
};

const AuthLanding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginAdmin, loginStudent } = useTherapyStore();
  const [mode, setMode] = useState(location.state?.mode || 'welcome');
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [staffForm, setStaffForm] = useState(initialStaffForm);
  const [accessCode, setAccessCode] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isWelcome = mode === 'welcome';
  const isRegister = mode === 'register';
  const isStudent = mode === 'student';
  const isStaff = mode === 'staff';

  useEffect(() => {
    if (location.state?.mode) {
      setMode(location.state.mode);
    }
  }, [location.state?.mode]);

  const updateRegisterField = (field, value) => {
    setRegisterForm((current) => ({ ...current, [field]: value }));
    setError('');
    setSuccessMessage('');
  };

  const updateStaffField = (field, value) => {
    setStaffForm((current) => ({ ...current, [field]: value }));
    setError('');
  };

  const handleRegister = (event) => {
    event.preventDefault();
    const fullName = `${registerForm.firstName.trim()} ${registerForm.lastName.trim()}`.trim();

    if (
      !registerForm.firstName.trim() ||
      !registerForm.lastName.trim() ||
      !registerForm.phone.trim() ||
      !registerForm.email.trim() ||
      !registerForm.password.trim()
    ) {
      setError('من فضلك أكمل كل بيانات الحساب.');
      return;
    }

    localStorage.setItem(
      REGISTERED_USER_KEY,
      JSON.stringify({
        ...registerForm,
        firstName: registerForm.firstName.trim(),
        lastName: registerForm.lastName.trim(),
        name: fullName,
        phone: registerForm.phone.trim(),
        email: registerForm.email.trim(),
        role: 'registered_user',
        status: 'pending_review',
        provider: 'email',
        createdAt: new Date().toISOString(),
      })
    );

    setSuccessMessage('تم إنشاء الحساب بنجاح. سيتم مراجعة بياناتك من المختص.');
    setError('');
    setRegisterForm(initialRegisterForm);
  };

  const handleStudentLogin = async (event) => {
    event.preventDefault();
    const normalizedCode = accessCode.trim().toUpperCase();

    if (!normalizedCode) {
      setError('من فضلك أدخل كود الدخول أولًا.');
      return;
    }

    setSubmitting(true);
    const result = await loginStudent(normalizedCode, 'parent', rememberMe);
    setSubmitting(false);

    if (!result.success) {
      setError(result.message || 'كود الدخول غير صحيح.');
      return;
    }

    navigate('/student/home', { replace: true });
  };

  const handleStaffLogin = async (event) => {
    event.preventDefault();

    if (!staffForm.email.trim() || !staffForm.password.trim()) {
      setError('من فضلك أدخل البريد الإلكتروني وكلمة المرور.');
      return;
    }

    setSubmitting(true);
    const result = await loginAdmin(staffForm.email.trim(), staffForm.password);
    setSubmitting(false);

    if (!result.success) {
      setError(result.message || 'تعذر تسجيل دخول الكادر.');
      return;
    }

    const role = result.session?.user?.role;
    navigate(role === 'SUPER_ADMIN' ? '/admin/dashboard' : '/admin/patients', { replace: true });
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setSuccessMessage('');
  };

  const inputClass =
    'min-h-12 w-full rounded-2xl border border-[#D9EAF2] bg-[#F8FBFD] px-4 text-base font-bold outline-none transition-colors focus:border-[#1584C3] focus:bg-white focus:ring-4 focus:ring-[#1584C3]/15';

  return (
    <main
      dir="rtl"
      className="min-h-[100dvh] overflow-y-auto overflow-x-hidden bg-white text-[#0F172A]"
    >
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-7xl flex-col px-4 py-4 sm:px-6 sm:py-5 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-4 md:gap-5">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[1.35rem] bg-white p-2.5 shadow-[0_12px_30px_rgba(15,111,166,0.14)] ring-2 ring-[#D9EAF2] md:h-16 md:w-16">
              <img src="/logo.png" alt="شعار المنصة" className="h-full w-full object-contain" />
            </span>
            <TypewriterBrand />
          </Link>

          <button
            type="button"
            onClick={() => switchMode('staff')}
            className="hidden"
          >
            <Stethoscope size={18} />
            الفريق الطبي
          </button>
        </header>

        <section
          className={`grid flex-1 items-start gap-3 py-3 sm:gap-6 sm:py-6 lg:items-center lg:gap-10 lg:py-6 ${
            isWelcome ? 'lg:grid-cols-[0.95fr_1.05fr]' : 'lg:grid-cols-[minmax(520px,0.95fr)_minmax(320px,0.75fr)] lg:pt-6'
          }`}
        >
          <div
            className={`order-2 mx-auto flex w-full max-w-xl min-w-0 flex-col justify-start lg:order-1 ${
              isWelcome ? 'lg:min-h-[560px]' : 'lg:min-h-0'
            }`}
          >
            <div
              className={`flex min-h-0 flex-col px-0 pt-1 sm:px-2 sm:pt-8 ${
                isWelcome ? 'lg:min-h-[520px] lg:pt-10' : 'lg:min-h-0 lg:pt-0'
              }`}
            >
              {!isWelcome && (
              <div className="mb-5 inline-grid w-full max-w-lg grid-cols-3 gap-1.5 self-end rounded-2xl bg-[#EAF7FD] p-1 sm:mb-8">
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className={`min-h-10 rounded-xl px-4 text-sm font-black transition-colors ${
                    isRegister ? 'bg-white text-[#1584C3] shadow-sm' : 'text-[#64748B] hover:text-[#0F6FA6]'
                  }`}
                >
                  إنشاء حساب
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('student')}
                  className={`min-h-10 rounded-xl px-4 text-sm font-black transition-colors ${
                    isStudent ? 'bg-white text-[#1584C3] shadow-sm' : 'text-[#64748B] hover:text-[#0F6FA6]'
                  }`}
                >
                  دخول المستفيد
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('staff')}
                  className={`min-h-10 rounded-xl px-3 text-sm font-black transition-colors ${
                    isStaff ? 'bg-white text-[#1584C3] shadow-sm' : 'text-[#64748B] hover:text-[#0F6FA6]'
                  }`}
                >
                  الفريق الطبي
                </button>
              </div>
              )}

              <div className="min-w-0 flex-1">
                {isWelcome ? (
                  <div className="flex min-h-[390px] flex-col justify-center text-right sm:min-h-[430px]">
                    <p className="mb-4 text-sm font-black tracking-[0.18em] text-[#20B7B5]">
                      منصة علاجية تفاعلية
                    </p>
                    <h1 className="max-w-lg text-4xl font-black leading-[1.25] text-[#073B5C] sm:text-5xl">
                      رحلتك العلاجية تبدأ بخطوة بسيطة
                    </h1>
                    <p className="mt-5 max-w-lg text-base font-bold leading-8 text-[#64748B] sm:text-lg">
                      ألعاب نطق مصممة بعناية، متابعة واضحة، وتجربة سهلة للمستفيدين والفريق الطبي.
                    </p>

                    <div className="mt-8 grid w-full max-w-lg gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => switchMode('student')}
                        className="min-h-14 rounded-2xl bg-[linear-gradient(135deg,#1584C3,#20B7B5)] px-5 text-base font-black text-white shadow-[0_14px_30px_rgba(21,132,195,0.24)] transition hover:-translate-y-0.5"
                      >
                        دخول المستفيد
                      </button>
                      <button
                        type="button"
                        onClick={() => switchMode('register')}
                        className="min-h-14 rounded-2xl border border-[#D9EAF2] bg-[#EAF7FD] px-5 text-base font-black text-[#0F6FA6] shadow-[0_12px_24px_rgba(15,111,166,0.12)] transition hover:-translate-y-0.5 hover:border-[#1584C3]"
                      >
                        إنشاء حساب
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => switchMode('staff')}
                      className="mt-5 w-fit text-sm font-black text-[#64748B] transition hover:text-[#0F6FA6]"
                    >
                      دخول الفريق الطبي
                    </button>
                  </div>
                ) : isRegister ? (
                  <form onSubmit={handleRegister} className="space-y-3">
                    <div className="mb-2 text-right">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-xl border border-[#D9EAF2] bg-[#EAF7FD] text-[#1584C3]">
                          <UserPlus size={16} />
                        </span>
                        <h1 className="text-xl font-black text-[#073B5C] sm:text-2xl">إنشاء حساب جديد</h1>
                      </div>
                      <p className="mt-1 text-sm font-bold leading-6 text-[#64748B]">
                        املأ بياناتك الأساسية وسيتم مراجعتها من المختص.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input value={registerForm.firstName} onChange={(event) => updateRegisterField('firstName', event.target.value)} placeholder="الاسم الأول" className={`${inputClass} sm:flex-1`} />
                      <input value={registerForm.lastName} onChange={(event) => updateRegisterField('lastName', event.target.value)} placeholder="الاسم الأخير" className={`${inputClass} sm:flex-1`} />
                    </div>
                    <input value={registerForm.phone} onChange={(event) => updateRegisterField('phone', event.target.value)} placeholder="رقم الهاتف" className={inputClass} />
                    <input type="email" value={registerForm.email} onChange={(event) => updateRegisterField('email', event.target.value)} placeholder="البريد الإلكتروني" className={inputClass} />
                    <input type="password" value={registerForm.password} onChange={(event) => updateRegisterField('password', event.target.value)} placeholder="كلمة المرور" className={inputClass} />
                    <div className="grid grid-cols-2 gap-3">
                      {accountTypes.map((type) => {
                        const isSelected = registerForm.accountType === type.value;

                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => updateRegisterField('accountType', type.value)}
                            className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-black transition-colors ${
                              isSelected
                                ? 'border-[#1584C3] bg-[#EAF7FD] text-[#0F6FA6] shadow-sm'
                                : 'border-[#D9EAF2] bg-[#F8FBFD] text-[#64748B] hover:border-[#1584C3] hover:text-[#0F6FA6]'
                            }`}
                            aria-pressed={isSelected}
                          >
                            <span
                              className={`grid h-5 w-5 place-items-center rounded-md border-2 ${
                                isSelected ? 'border-[#1584C3] bg-white text-[#1584C3]' : 'border-[#D9EAF2] bg-white'
                              }`}
                            >
                              {isSelected && <Check size={13} strokeWidth={4} />}
                            </span>
                            <span>{type.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {error && (
                      <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                        {error}
                      </div>
                    )}
                    {successMessage && (
                      <div className="rounded-2xl border border-[#D9EAF2] bg-[#EAF7FD] px-4 py-3 text-sm font-bold text-[#0F6FA6]">
                        {successMessage}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="min-h-12 w-full rounded-2xl bg-[linear-gradient(135deg,#1584C3,#20B7B5)] px-5 py-3 text-base font-black text-white shadow-[0_12px_28px_rgba(21,132,195,0.28)] transition hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,#0F6FA6,#168D8B)]"
                    >
                      إنشاء الحساب
                    </button>
                  </form>
                ) : isStaff ? (
                  <form onSubmit={handleStaffLogin} className="space-y-6">
                    <div className="mb-4 text-right">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-xl border border-[#D9EAF2] bg-[#EAF7FD] text-[#1584C3]">
                          <Stethoscope size={16} />
                        </span>
                        <h1 className="text-xl font-black text-[#073B5C] sm:text-2xl">تسجيل دخول الفريق الطبي</h1>
                      </div>
                      <p className="mt-1 text-sm font-bold leading-6 text-[#64748B]">
                        سجل دخول الطبيب أو الأخصائي لإدارة المستفيدين والجلسات من نفس الصفحة.
                      </p>
                    </div>

                    <label className="block">
                      <span className="mb-3 block text-sm font-black text-[#0F172A]">البريد الإلكتروني</span>
                      <input
                        type="email"
                        value={staffForm.email}
                        onChange={(event) => updateStaffField('email', event.target.value)}
                        placeholder="البريد الإلكتروني"
                        dir="auto"
                        autoComplete="email"
                        className={`${inputClass} text-right`}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-3 block text-sm font-black text-[#0F172A]">كلمة المرور</span>
                      <input
                        type="password"
                        value={staffForm.password}
                        onChange={(event) => updateStaffField('password', event.target.value)}
                        placeholder="كلمة المرور"
                        autoComplete="current-password"
                        className={inputClass}
                      />
                    </label>

                    {error && (
                      <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="min-h-12 w-full rounded-2xl bg-[linear-gradient(135deg,#1584C3,#20B7B5)] px-5 py-3 text-base font-black text-white shadow-[0_12px_28px_rgba(21,132,195,0.28)] transition hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,#0F6FA6,#168D8B)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      دخول لوحة التحكم
                    </button>
                  </form>
                ) : isStudent ? (
                  <form onSubmit={handleStudentLogin} className="space-y-6">
                    <div className="mb-4 text-right">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-xl border border-[#D9EAF2] bg-[#EAF7FD] text-[#1584C3]">
                          <Gamepad2 size={16} />
                        </span>
                        <h1 className="text-xl font-black text-[#073B5C] sm:text-2xl">دخول المستفيد</h1>
                      </div>
                      <p className="mt-1 text-sm font-bold leading-6 text-[#64748B]">
                        لا نطلب كلمة مرور أو PIN. أدخل كود الدخول وابدأ الأنشطة مباشرة.
                      </p>
                    </div>

                    <label className="block">
                      <span className="mb-3 block text-sm font-black text-[#0F172A]">كود الدخول</span>
                      <input
                        value={accessCode}
                        onChange={(event) => {
                          setAccessCode(event.target.value.toUpperCase());
                          setError('');
                        }}
                        placeholder="أدخل كود الدخول"
                        dir="auto"
                        autoComplete="one-time-code"
                        className="min-h-12 w-full rounded-2xl border border-[#D9EAF2] bg-[#F8FBFD] px-5 text-center text-lg font-black text-[#0F172A] shadow-sm outline-none transition-colors placeholder:text-[#8A94A6] focus:border-[#1584C3] focus:bg-white focus:ring-4 focus:ring-[#1584C3]/15"
                      />
                    </label>

                    <label className="flex w-fit cursor-pointer items-center gap-2 text-sm font-black text-[#0F172A]">
                      <span>تذكرني</span>
                      <span
                        className={`grid h-6 w-6 place-items-center rounded-lg border-2 ${
                          rememberMe ? 'border-[#1584C3] bg-[#EAF7FD] text-[#1584C3]' : 'border-[#D9EAF2] bg-white'
                        }`}
                      >
                        {rememberMe && <Check size={16} strokeWidth={4} />}
                      </span>
                      <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="hidden" />
                    </label>

                    {error && (
                      <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="min-h-12 w-full rounded-2xl bg-[linear-gradient(135deg,#1584C3,#20B7B5)] px-5 py-3 text-base font-black text-white shadow-[0_12px_28px_rgba(21,132,195,0.28)] transition hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,#0F6FA6,#168D8B)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      دخول المستفيد
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          </div>

          <div
            className={`order-1 mx-auto w-full min-w-0 pt-0 sm:pt-6 lg:order-2 ${
              isWelcome ? 'max-w-xl lg:min-h-[560px]' : 'max-w-sm lg:min-h-[430px]'
            }`}
          >
            <aside
              className={`relative flex flex-col justify-end overflow-hidden px-0 pb-0 text-white ${
                isWelcome ? 'h-[275px] sm:h-[390px] lg:h-auto lg:min-h-[540px] lg:overflow-visible' : 'h-[230px] sm:h-[320px] lg:h-auto lg:min-h-[430px]'
              }`}
            >
              <div
                className={`absolute left-1/2 -translate-x-1/2 rounded-[42%_58%_34%_66%/42%_38%_62%_58%] bg-[linear-gradient(155deg,#1584C3_0%,#0F6FA6_50%,#20B7B5_100%)] shadow-[0_24px_60px_rgba(7,59,92,0.18)] ${
                  isWelcome ? 'bottom-5 h-[72%] w-[82%] sm:bottom-8 sm:h-[70%] sm:w-[88%]' : 'bottom-4 h-[68%] w-[88%] sm:bottom-6'
                }`}
              />
              <div
                className={`relative z-10 mx-auto flex h-full w-full min-w-0 items-end justify-center overflow-hidden ${
                  isWelcome ? 'lg:h-[540px] lg:overflow-visible' : 'lg:h-[430px]'
                }`}
              >
                <Swiper
                  modules={[Autoplay]}
                  loop
                  speed={850}
                  autoplay={{ delay: 2600, disableOnInteraction: false }}
                  className="h-full w-full"
                >
                  {heroDoctors.map((doctor) => (
                    <SwiperSlide key={doctor.src} className="!flex items-end justify-center">
                      <img
                        src={doctor.src}
                        alt={doctor.alt}
                        className={`w-auto max-w-full object-contain object-bottom drop-shadow-[0_22px_28px_rgba(7,59,92,0.18)] ${
                          isWelcome
                            ? 'h-[106%] -translate-y-4 sm:h-[106%] sm:-translate-y-5 lg:h-[100%] lg:max-w-none lg:-translate-y-4'
                            : 'h-[100%] -translate-y-2 sm:h-[102%] sm:-translate-y-3 lg:h-[96%]'
                        }`}
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>

            </aside>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AuthLanding;
