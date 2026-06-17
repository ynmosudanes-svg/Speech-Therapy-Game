import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Check, Gamepad2, UserPlus, LogIn, Eye, EyeOff, ArrowRight, ChevronDown } from 'lucide-react';
import { Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { useTherapyStore } from '../../hooks/useTherapyStore';
import authService from '../../services/authService';
import kid1 from '../../assets/ef5322cd-3a7f-40df-ade9-73fab97f6a41-removebg-preview.png';
import kid2 from '../../assets/f8c467e2-1d27-4e1a-8c9d-121ff72f66fc-removebg-preview.png';

const REGISTERED_USER_KEY = 'registered_user';

const accountTypes = [
  { value: 'parent', label: 'ولي أمر' },
  { value: 'specialist', label: 'أخصائي' },
];

const countryCodes = [
  { code: '+20', label: 'مصر', flagCode: 'eg' },
  { code: '+249', label: 'السودان', flagCode: 'sd' },
  { code: '+966', label: 'السعودية', flagCode: 'sa' },
  { code: '+971', label: 'الإمارات', flagCode: 'ae' },
  { code: '+965', label: 'الكويت', flagCode: 'kw' },
  { code: '+974', label: 'قطر', flagCode: 'qa' },
  { code: '+973', label: 'البحرين', flagCode: 'bh' },
  { code: '+968', label: 'عمان', flagCode: 'om' },
  { code: '+962', label: 'الأردن', flagCode: 'jo' },
  { code: '+1', label: 'أمريكا', flagCode: 'us' },
];

const initialRegisterForm = {
  firstName: '',
  lastName: '',
  name: '',
  phoneCountryCode: '+20',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
  accountType: 'parent',
};

const initialStaffForm = {
  email: '',
  password: '',
};

const heroDoctors = [
  { src: kid1, alt: 'مستفيد' },
  { src: kid2, alt: 'مستفيدة' },
];

const brandPhrases = [
  {
    title: 'منصة الألعاب العلاجية',
    subtitle: 'رعاية، لعب، وخطة مناسبة',
    dir: 'rtl',
  },
  {
    title: 'العيادة السودانية',
    subtitle: 'لأمراض التخاطب والعلاج النمائي التكاملي',
    dir: 'rtl',
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
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);

  const isWelcome = mode === 'welcome';
  const isRegister = mode === 'register';
  const isStudent = mode === 'student';
  const isStaff = mode === 'staff';
  const selectedCountry = countryCodes.find((country) => country.code === registerForm.phoneCountryCode) || countryCodes[0];

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

  const handleForgotPassword = (event) => {
    event.preventDefault();
    const email = forgotPasswordEmail.trim() || staffForm.email.trim();

    if (!email) {
      setForgotPasswordMessage('اكتب البريد الإلكتروني أولًا ليتم مراجعة طلب استعادة كلمة المرور.');
      return;
    }

    setForgotPasswordEmail(email);
    setForgotPasswordMessage('تم استلام طلب استعادة كلمة المرور. سيتم التواصل معك من الإدارة.');
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    const fullName = `${registerForm.firstName.trim()} ${registerForm.lastName.trim()}`.trim();
    const normalizedPhone = registerForm.phone.trim().replace(/^\+/, '').replace(/^0+/, '');
    const fullPhone = `${registerForm.phoneCountryCode}${normalizedPhone}`;

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

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }

    if (registerForm.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
      return;
    }

    if (registerForm.accountType === 'parent') {
      try {
        setSubmitting(true);
        await authService.registerParent({
          name: fullName,
          phone: fullPhone,
          email: registerForm.email.trim(),
          password: registerForm.password,
        });

        const result = await loginAdmin(registerForm.email.trim(), registerForm.password);
        if (result.success) {
          navigate('/parent/dashboard', { replace: true });
          return;
        }

        setSuccessMessage('تم إنشاء الحساب بنجاح. يمكنك تسجيل الدخول وربط طفل بالكود أو تقديم طلب لطفل جديد.');
        setRegisterForm(initialRegisterForm);
        return;
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.error ||
            'تعذر إنشاء حساب ولي الأمر. تأكد من البيانات وحاول مرة أخرى.'
        );
        return;
      } finally {
        setSubmitting(false);
      }
    }

    localStorage.setItem(
      REGISTERED_USER_KEY,
      JSON.stringify({
        ...registerForm,
        firstName: registerForm.firstName.trim(),
        lastName: registerForm.lastName.trim(),
        name: fullName,
        phone: fullPhone,
        email: registerForm.email.trim(),
        role: 'registered_user',
        status: 'pending_review',
        provider: 'email',
        createdAt: new Date().toISOString(),
      })
    );

    setSuccessMessage('تم إنشاء الحساب بنجاح. سيتم مراجعة بياناتك من الإدارة.');
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
      setError(result.message || 'تعذر تسجيل دخول الفريق.');
      return;
    }

    const role = result.session?.user?.role;
    
    if (role === 'PARENT') {
      navigate('/parent/dashboard', { replace: true });
    } else {
      navigate(role === 'SUPER_ADMIN' ? '/admin/dashboard' : '/admin/patients', { replace: true });
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setSuccessMessage('');
    setForgotPasswordOpen(false);
    setForgotPasswordMessage('');
  };

  const inputClass =
    'min-h-10 w-full rounded-2xl border border-[#D9EAF2] bg-[#F8FBFD] px-4 text-sm font-bold outline-none transition-colors focus:border-[#1584C3] focus:bg-white focus:ring-4 focus:ring-[#1584C3]/15 sm:min-h-12 sm:text-base';

  return (
    <main
      dir="rtl"
      className="min-h-[100dvh] overflow-y-auto overflow-x-hidden bg-white text-[#0F172A]"
    >
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-7xl flex-col px-4 py-4 sm:px-6 sm:py-5 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-4 md:gap-5">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[1.35rem] bg-white p-2.5 shadow-[0_12px_30px_rgba(15,111,166,0.14)] ring-2 ring-[#D9EAF2] md:h-16 md:w-16">
              <img src="/logo.png" alt="شعار العيادة" className="h-full w-full object-contain" />
            </span>
            <TypewriterBrand />
          </Link>

          <button
            type="button"
            onClick={() => switchMode('staff')}
            className="hidden"
          >
            <LogIn size={18} />
            تسجيل الدخول
          </button>
        </header>

        <section
          className={`grid flex-1 items-start gap-5 py-4 sm:gap-6 sm:py-6 lg:items-center lg:gap-10 lg:py-6 ${
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
              <div className="mb-6 inline-grid w-full max-w-lg grid-cols-3 gap-1.5 self-start rounded-2xl bg-[#EAF7FD] p-1.5 sm:mb-8">
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className={`min-h-9 rounded-xl px-1.5 text-[11px] font-black leading-5 transition-colors sm:min-h-10 sm:px-4 sm:text-sm ${
                    isRegister ? 'bg-white text-[#1584C3] shadow-sm' : 'text-[#64748B] hover:bg-white/65 hover:text-[#1584C3]'
                  }`}
                >
                  إنشاء حساب
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('student')}
                  className={`min-h-9 rounded-xl px-1.5 text-[11px] font-black leading-5 transition-colors sm:min-h-10 sm:px-4 sm:text-sm ${
                    isStudent ? 'bg-white text-[#1584C3] shadow-sm' : 'text-[#64748B] hover:bg-white/65 hover:text-[#1584C3]'
                  }`}
                >
                  دخول المستفيد
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('staff')}
                  className={`min-h-9 rounded-xl px-1.5 text-[11px] font-black leading-5 transition-colors sm:min-h-10 sm:px-3 sm:text-sm ${
                    isStaff ? 'bg-white text-[#1584C3] shadow-sm' : 'text-[#64748B] hover:bg-white/65 hover:text-[#1584C3]'
                  }`}
                >
                  تسجيل الدخول
                </button>
              </div>
              )}

              <div className="min-w-0 flex-1">
                {isWelcome ? (
                  <div className="flex min-h-[320px] flex-col justify-center text-right sm:min-h-[430px]">
                    <p className="mb-2 text-xs font-black tracking-[0.08em] text-[#20B7B5] sm:mb-4 sm:text-sm sm:tracking-[0.18em]">
                      منصة العلاج التفاعلي
                    </p>
                    <h1 className="max-w-lg text-[1.625rem] font-black leading-[1.2] text-[#073B5C] sm:text-5xl sm:leading-[1.25]">
                      تجربة علاجية ألطف لطفلك
                    </h1>
                    <p className="mt-3 max-w-lg text-xs font-bold leading-5 text-[#64748B] sm:mt-5 sm:text-lg sm:leading-8">
                      ألعاب علاجية منظمة، متابعة مرنة، وتجربة سهلة للأخصائيين وأولياء الأمور.
                    </p>

                    <div className="mt-6 grid w-full max-w-lg gap-2.5 sm:mt-8 sm:grid-cols-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => switchMode('student')}
                        className="min-h-12 rounded-2xl bg-[linear-gradient(135deg,#1584C3,#20B7B5)] px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(21,132,195,0.24)] transition hover:-translate-y-0.5 sm:min-h-14 sm:text-base"
                      >
                        دخول المستفيد
                      </button>
                      <button
                        type="button"
                        onClick={() => switchMode('register')}
                        className="min-h-12 rounded-2xl border border-[#D9EAF2] bg-[#EAF7FD] px-5 text-sm font-black text-[#0F6FA6] shadow-[0_12px_24px_rgba(15,111,166,0.12)] transition hover:-translate-y-0.5 hover:border-[#1584C3] sm:min-h-14 sm:text-base"
                      >
                        إنشاء حساب
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => switchMode('staff')}
                      className="mt-4 w-fit text-xs font-black text-[#64748B] transition hover:text-[#0F6FA6] sm:mt-5 sm:text-sm"
                    >
                      تسجيل الدخول (أخصائي / ولي أمر)
                    </button>
                  </div>
                ) : isRegister ? (
                  <form onSubmit={handleRegister} className="space-y-3">
                    <div className="mb-2 text-right">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-xl border border-[#D9EAF2] bg-[#EAF7FD] text-[#1584C3]">
                          <UserPlus size={16} />
                        </span>
                        <h1 className="text-base font-black text-[#073B5C] sm:text-2xl">إنشاء حساب جديد</h1>
                      </div>
                      <p className="mt-1 text-[11px] font-bold leading-5 text-[#64748B] sm:text-sm sm:leading-6">
                        املأ بياناتك الأساسية وسيتم مراجعتها من المختص.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input value={registerForm.firstName} onChange={(event) => updateRegisterField('firstName', event.target.value)} placeholder="الاسم الأول" className={`${inputClass} sm:flex-1`} />
                      <input value={registerForm.lastName} onChange={(event) => updateRegisterField('lastName', event.target.value)} placeholder="الاسم الأخير" className={`${inputClass} sm:flex-1`} />
                    </div>
                    <div dir="ltr" className="relative flex min-h-10 w-full overflow-visible rounded-2xl border border-[#D9EAF2] bg-[#F8FBFD] text-sm font-bold outline-none transition-colors focus-within:border-[#1584C3] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#1584C3]/15 sm:min-h-12 sm:text-base">
                      <button
                        type="button"
                        onClick={() => setCountryDropdownOpen((current) => !current)}
                        className="phone-country-button flex min-w-[6.75rem] shrink-0 items-center justify-center gap-2 rounded-l-2xl border-r border-[#D9EAF2] bg-[#EAF7FD] px-3 font-black text-[#0F172A] transition hover:bg-[#DDF2FA] sm:min-w-[7.5rem]"
                        aria-label="كود البلد"
                        aria-expanded={countryDropdownOpen}
                      >
                        <img
                          src={`https://flagcdn.com/w40/${selectedCountry.flagCode}.png`}
                          alt=""
                          className="h-4 w-6 rounded-[0.25rem] object-cover shadow-sm"
                        />
                        <span dir="ltr" className="leading-none">{selectedCountry.code}</span>
                        <span className="text-[#1584C3]">⌄</span>
                        <ChevronDown size={16} strokeWidth={3} className="-translate-y-0.5 text-[#1584C3]" />
                      </button>

                      {countryDropdownOpen && (
                        <div className="absolute left-0 top-[calc(100%+0.45rem)] z-50 w-[7.75rem] overflow-hidden rounded-2xl border border-[#D9EAF2] bg-white shadow-[0_18px_40px_rgba(15,111,166,0.16)]">
                          {countryCodes.map((country) => {
                            const isSelected = country.code === registerForm.phoneCountryCode;

                            return (
                              <button
                                key={country.code}
                                type="button"
                                onClick={() => {
                                  updateRegisterField('phoneCountryCode', country.code);
                                  setCountryDropdownOpen(false);
                                }}
                                className={`flex w-full items-center justify-center gap-2 px-3 py-2.5 text-sm font-black transition ${
                                  isSelected
                                    ? 'bg-[#EAF7FD] text-[#0F172A]'
                                    : 'bg-white text-[#0F172A] hover:bg-[#F3FAFD] hover:text-[#0F172A]'
                                }`}
                              >
                                <img
                                  src={`https://flagcdn.com/w40/${country.flagCode}.png`}
                                  alt=""
                                  className="h-4 w-6 rounded-[0.25rem] object-cover shadow-sm"
                                />
                                <span dir="ltr">{country.code}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <input
                        value={registerForm.phone}
                        onChange={(event) => updateRegisterField('phone', event.target.value.replace(/[^\d+]/g, ''))}
                        placeholder="رقم الهاتف"
                        inputMode="tel"
                        dir="rtl"
                        className="min-w-0 flex-1 bg-transparent px-4 text-right font-black text-[#0F172A] outline-none placeholder:font-bold placeholder:text-[#8A94A6]"
                      />
                    </div>
                    <input type="email" value={registerForm.email} onChange={(event) => updateRegisterField('email', event.target.value)} placeholder="البريد الإلكتروني" className={inputClass} />
                    <div className="relative">
                      <input type={showRegisterPassword ? 'text' : 'password'} value={registerForm.password} onChange={(event) => updateRegisterField('password', event.target.value)} placeholder="كلمة المرور" className={`${inputClass} pl-12`} />
                      <button type="button" onClick={() => setShowRegisterPassword(!showRegisterPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#94A3B8] hover:text-[#1584C3] hover:bg-[#EAF7FD] transition-colors">
                        {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <div className="relative">
                      <input type={showRegisterConfirm ? 'text' : 'password'} value={registerForm.confirmPassword} onChange={(event) => updateRegisterField('confirmPassword', event.target.value)} placeholder="تأكيد كلمة المرور" className={`${inputClass} pl-12`} />
                      <button type="button" onClick={() => setShowRegisterConfirm(!showRegisterConfirm)} className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#94A3B8] hover:text-[#1584C3] hover:bg-[#EAF7FD] transition-colors">
                        {showRegisterConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {accountTypes.map((type) => {
                        const isSelected = registerForm.accountType === type.value;

                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => updateRegisterField('accountType', type.value)}
                            className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-3 text-xs font-black transition-colors sm:text-sm ${
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
                      disabled={submitting}
                      className="min-h-11 w-full rounded-2xl bg-[linear-gradient(135deg,#1584C3,#20B7B5)] px-5 py-2.5 text-xs font-black text-white shadow-[0_12px_28px_rgba(21,132,195,0.28)] transition hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,#0F6FA6,#168D8B)] disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-12 sm:py-3 sm:text-base"
                    >
                      {submitting ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب'}
                    </button>
                  </form>
                ) : isStaff && forgotPasswordOpen ? (
                  <form onSubmit={handleForgotPassword} className="space-y-4 sm:space-y-6">
                    <div className="mb-3 text-right sm:mb-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-xl border border-[#D9EAF2] bg-[#EAF7FD] text-[#1584C3]">
                          <LogIn size={16} />
                        </span>
                        <h1 className="text-base font-black text-[#073B5C] sm:text-2xl">استعادة كلمة المرور</h1>
                      </div>
                      <p className="mt-1 text-[11px] font-bold leading-5 text-[#64748B] sm:text-sm sm:leading-6">
                        أدخل البريد الإلكتروني المسجل، وسيتم إرسال طلب الاستعادة للإدارة.
                      </p>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-xs font-black text-[#0F172A] sm:mb-3 sm:text-sm">البريد الإلكتروني</span>
                      <input
                        type="email"
                        value={forgotPasswordEmail}
                        onChange={(event) => {
                          setForgotPasswordEmail(event.target.value);
                          setForgotPasswordMessage('');
                        }}
                        placeholder="البريد الإلكتروني"
                        dir="auto"
                        autoComplete="email"
                        className={`${inputClass} text-right`}
                      />
                    </label>

                    {forgotPasswordMessage && (
                      <p className="px-1 text-sm font-bold leading-6 text-[#0F6FA6]">
                        {forgotPasswordMessage}
                      </p>
                    )}

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setForgotPasswordOpen(false);
                          setForgotPasswordMessage('');
                        }}
                        className="inline-flex h-10 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#D9EAF2] bg-[#EAF7FD] text-[#1584C3] transition hover:bg-white sm:h-12 sm:w-14"
                        aria-label="الرجوع لتسجيل الدخول"
                      >
                        <ArrowRight size={18} />
                      </button>
                      <button
                        type="submit"
                        className="min-h-10 flex-1 rounded-2xl bg-[linear-gradient(135deg,#1584C3,#20B7B5)] px-5 py-2 text-xs font-black text-white shadow-[0_12px_28px_rgba(21,132,195,0.28)] transition hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,#0F6FA6,#168D8B)] sm:min-h-12 sm:py-3 sm:text-base"
                      >
                        إرسال طلب الاستعادة
                      </button>
                    </div>
                  </form>
                ) : isStaff ? (
                  <form onSubmit={handleStaffLogin} className="space-y-4 sm:space-y-6">
                    <div className="mb-3 text-right sm:mb-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-xl border border-[#D9EAF2] bg-[#EAF7FD] text-[#1584C3]">
                          <LogIn size={16} />
                        </span>
                        <h1 className="text-base font-black text-[#073B5C] sm:text-2xl">تسجيل الدخول</h1>
                      </div>
                      <p className="mt-1 text-[11px] font-bold leading-5 text-[#64748B] sm:text-sm sm:leading-6">
                        سجل دخولك كأخصائي أو ولي أمر لإدارة الحساب ومتابعة المستفيدين.
                      </p>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-xs font-black text-[#0F172A] sm:mb-3 sm:text-sm">البريد الإلكتروني</span>
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
                      <span className="mb-2 block text-xs font-black text-[#0F172A] sm:mb-3 sm:text-sm">كلمة المرور</span>
                      <div className="relative">
                        <input
                          type={showStaffPassword ? 'text' : 'password'}
                          value={staffForm.password}
                          onChange={(event) => updateStaffField('password', event.target.value)}
                          placeholder="كلمة المرور"
                          autoComplete="current-password"
                          className={`${inputClass} pl-12`}
                        />
                        <button type="button" onClick={() => setShowStaffPassword(!showStaffPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#94A3B8] hover:text-[#1584C3] hover:bg-[#EAF7FD] transition-colors">
                          {showStaffPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </label>

                    <div className="-mt-2 text-left">
                      <button
                        type="button"
                        onClick={() => {
                          setForgotPasswordOpen(true);
                          setForgotPasswordEmail(staffForm.email);
                          setForgotPasswordMessage('');
                        }}
                        className="text-xs font-black text-[#1584C3] transition hover:text-[#0F6FA6] hover:underline sm:text-sm"
                      >
                        نسيت كلمة المرور؟
                      </button>
                    </div>

                    {error && (
                      <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="min-h-10 w-full rounded-2xl bg-[linear-gradient(135deg,#1584C3,#20B7B5)] px-5 py-2 text-xs font-black text-white shadow-[0_12px_28px_rgba(21,132,195,0.28)] transition hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,#0F6FA6,#168D8B)] disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-12 sm:py-3 sm:text-base"
                    >
                      دخول لوحة الحساب
                    </button>
                  </form>
                ) : isStudent ? (
                  <form onSubmit={handleStudentLogin} className="space-y-5 sm:space-y-6">
                    <div className="mb-3 text-right sm:mb-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-xl border border-[#D9EAF2] bg-[#EAF7FD] text-[#1584C3]">
                          <Gamepad2 size={16} />
                        </span>
                        <h1 className="text-base font-black text-[#073B5C] sm:text-2xl">دخول المستفيد</h1>
                      </div>
                      <p className="mt-1 text-[11px] font-bold leading-5 text-[#64748B] sm:text-sm sm:leading-6">
                        لا تحتاج كلمة مرور أو PIN. أدخل كود الدخول وابدأ الأنشطة مباشرة.
                      </p>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-xs font-black text-[#0F172A] sm:mb-3 sm:text-sm">كود الدخول</span>
                      <input
                        value={accessCode}
                        onChange={(event) => {
                          setAccessCode(event.target.value.toUpperCase());
                          setError('');
                        }}
                        placeholder="أدخل كود الدخول"
                        dir="auto"
                        autoComplete="one-time-code"
                        className="min-h-11 w-full rounded-2xl border border-[#D9EAF2] bg-[#F8FBFD] px-5 text-center text-sm font-black text-[#0F172A] shadow-sm outline-none transition-colors placeholder:text-[#8A94A6] focus:border-[#1584C3] focus:bg-white focus:ring-4 focus:ring-[#1584C3]/15 sm:min-h-12 sm:text-lg"
                      />
                    </label>

                    <label className="flex w-fit cursor-pointer items-center gap-2 text-xs font-black text-[#0F172A] sm:text-sm">
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
                      className="min-h-11 w-full rounded-2xl bg-[linear-gradient(135deg,#1584C3,#20B7B5)] px-5 py-2.5 text-xs font-black text-white shadow-[0_12px_28px_rgba(21,132,195,0.28)] transition hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,#0F6FA6,#168D8B)] disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-12 sm:py-3 sm:text-base"
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
              isWelcome ? 'max-w-xl lg:min-h-[560px] lg:-translate-y-12' : 'max-w-xl lg:min-h-[560px] lg:-translate-y-16 xl:-translate-y-20'
            }`}
          >
            <aside
              className={`relative flex flex-col justify-end overflow-hidden px-0 pb-0 text-white ${
                isWelcome ? 'h-[225px] sm:h-[390px] lg:h-auto lg:min-h-[540px] lg:overflow-visible' : 'h-[235px] sm:h-[390px] lg:h-auto lg:min-h-[540px] lg:overflow-visible'
              }`}
            >
              <div
                className={`absolute left-1/2 -translate-x-1/2 rounded-[42%_58%_34%_66%/42%_38%_62%_58%] bg-[linear-gradient(155deg,#1584C3_0%,#0F6FA6_50%,#20B7B5_100%)] shadow-[0_24px_60px_rgba(7,59,92,0.18)] ${
                  isWelcome ? 'bottom-5 h-[72%] w-[82%] sm:bottom-8 sm:h-[70%] sm:w-[88%]' : 'bottom-5 h-[72%] w-[82%] sm:bottom-8 sm:h-[70%] sm:w-[88%]'
                }`}
              />
              <div className="absolute bottom-0 left-1/2 z-30 h-2 w-[34%] -translate-x-1/2 rounded-full bg-[#0F6FA6]/18 shadow-[0_12px_28px_rgba(7,59,92,0.1)] sm:bottom-1 sm:h-3 sm:w-[42%]" />
              <div
                className={`relative z-10 mx-auto flex h-full w-full min-w-0 items-end justify-center overflow-hidden ${
                  isWelcome ? 'lg:h-[540px] lg:overflow-visible' : 'lg:h-[540px] lg:overflow-visible'
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
                            ? 'h-[98%] sm:h-[99%] lg:h-[96%] lg:max-w-none'
                            : 'h-[98%] sm:h-[99%] lg:h-[96%] lg:max-w-none'
                        }`}
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-20 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.72)_56%,#ffffff_100%)] sm:h-28 lg:h-32" />

            </aside>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AuthLanding;
