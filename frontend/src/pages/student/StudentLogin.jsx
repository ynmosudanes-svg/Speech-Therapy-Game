import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Shield, Gamepad2, Check } from 'lucide-react';
import Button from '../../components/Button';
import { useTherapyStore } from '../../hooks/useTherapyStore';

const StudentLogin = () => {
  const navigate = useNavigate();
  const { currentStudent, loginStudent } = useTherapyStore();

  const [accessCode, setAccessCode] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (currentStudent) {
    return <Navigate to="/student/home" replace />;
  }

  const handleLogin = async (event) => {
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

    setError('');
    navigate('/student/home', { replace: true });
  };

  return (
    <div dir="rtl" className="min-h-[100dvh] bg-[linear-gradient(180deg,_#eef8fb,_#f7fcfd_46%,_#ffffff_100%)] overflow-y-auto px-4 py-8 md:p-6 flex flex-col">
      <div className="w-full max-w-[56rem] m-auto flex flex-col lg:grid lg:grid-cols-[1fr_0.9fr] gap-4 md:gap-6 lg:min-h-[600px]">
        <div className="relative group h-full">
          <div className="absolute -inset-1.5 bg-gradient-to-r from-[#138fbc] to-[#45abd0] rounded-[2.2rem] blur-2xl opacity-15 md:opacity-25 transition duration-1000 group-hover:opacity-35"></div>
          <section className="relative h-full flex flex-col justify-center bg-white/95 backdrop-blur-xl rounded-[2rem] lg:rounded-[2.5rem] p-5 lg:p-10 border border-[#138fbc]/15 shadow-2xl">
            <div className="flex lg:hidden items-start justify-end gap-4 mb-6">
            <div className="flex items-center gap-3 rounded-[1.4rem] bg-[#f7fbff] border border-[#dbe7f3] px-4 py-3 shadow-sm">
              <div className="w-10 h-10 rounded-[0.8rem] bg-white border border-[#dbe7f3] shadow-sm flex items-center justify-center overflow-hidden p-1 shrink-0">
                <img src="/logo.png" alt="شعار العيادة" className="w-full h-full object-contain" />
              </div>
              <div className="text-right">
                <h1 className="text-sm md:text-base font-extrabold text-[#138fbc] leading-tight">مركز التأهيل والتخاطب</h1>
                <p className="text-xs md:text-sm text-slate-500 leading-5">دخول المستفيد بالكود فقط</p>
              </div>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#0f7ea6] to-[#45abd0] leading-tight mb-3 flex items-center gap-2 pb-1">
            <span className="bg-gradient-to-br from-[#eef8fb] to-white text-[#138fbc] p-2 rounded-[1rem] shadow-sm border border-[#138fbc]/20">
              <Gamepad2 size={20} className="md:w-8 md:h-8" />
            </span>
            دخول المستفيد
          </h2>
          <p className="text-sm md:text-base lg:text-lg text-slate-600 mb-5 lg:mb-8 leading-relaxed lg:leading-8 max-w-2xl">
            لا نطلب كلمة مرور أو PIN. أدخل كود الدخول ثم ابدأ الأنشطة العلاجية والألعاب المخصصة مباشرة.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block">
              <span className="block text-[0.95rem] font-extrabold text-slate-700 mb-3">كود الدخول</span>
              <input
                type="text"
                dir="ltr"
                autoComplete="off"
                spellCheck="false"
                value={accessCode}
                onChange={(event) => {
                  setAccessCode(event.target.value.toUpperCase());
                  if (error) setError('');
                }}
                placeholder="AHMED123"
                className="w-full rounded-[1.5rem] border-2 border-[#d3e3f8] bg-[#fbfdff] px-6 py-3 text-center text-xl tracking-[0.14em] font-black text-slate-800 outline-none transition-all duration-300 hover:border-blue-400 hover:bg-white hover:shadow-md focus:border-blue-500 focus:ring-[4px] focus:ring-blue-500/20 focus:bg-white focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] uppercase"
              />
            </label>

            <label className="inline-flex items-center gap-2 text-slate-600 font-bold cursor-pointer select-none">
              <div 
                className={`relative flex items-center justify-center w-5 h-5 rounded border-2 transition-colors ${rememberMe ? 'border-[#138fbc] bg-[#f2f9fb]' : 'border-slate-300 bg-white'}`}
              >
                {rememberMe && <Check size={14} className="text-[#138fbc] absolute" strokeWidth={4} />}
              </div>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="hidden"
              />
              تذكرني
            </label>

            {error && (
              <div className="rounded-3xl bg-red-50 border border-red-100 px-5 py-4 text-red-600 font-bold">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              className="w-full !rounded-[1.5rem] !py-3 text-lg bg-[#138fbc] hover:bg-[#0f7ea6]"
            >
              دخول المستفيد
            </Button>
            
            <button
              type="button"
              onClick={() => navigate('/admin/login')}
              className="mt-4 w-full rounded-[1.5rem] border border-slate-200 bg-white px-5 py-3 font-bold text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 lg:hidden shadow-sm"
            >
              <Shield size={18} className="text-slate-500" />
              <span>دخول الأخصائي والإدارة</span>
            </button>
          </form>
          </section>
        </div>

        <aside className="hidden lg:flex flex-col relative overflow-hidden rounded-[2rem] border border-[#8ecfe2] bg-[linear-gradient(180deg,_#0f7ea6,_#138fbc_44%,_#45abd0_100%)] p-4 md:p-5 text-white shadow-[0_24px_60px_rgba(19,143,188,0.24)]">
          <div className="absolute -top-16 -left-12 h-48 w-48 rounded-full bg-white/12 blur-2xl" />
          <div className="absolute bottom-10 right-0 h-44 w-44 rounded-full bg-[#fff0ba]/18 blur-3xl" />

          <div className="relative z-10 flex flex-col flex-1">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-[1.2rem] bg-white/12 border border-white/15 flex items-center justify-center mb-4 overflow-hidden p-2">
              <img src="/logo.png" alt="شعار العيادة" className="w-full h-full object-contain rounded-[1.2rem]" />
            </div>

            <h3 className="text-[1.55rem] md:text-[1.72rem] font-extrabold leading-tight mb-3">واجهة بسيطة وسريعة</h3>
            <p className="text-white/90 text-[0.98rem] md:text-lg leading-7 mb-4">
              بعد إدخال الكود، يصل المستفيد مباشرة إلى الأنشطة العلاجية، الألعاب المخصصة، والجلسات الحالية.
            </p>

            <div className="space-y-3">
              <div className="rounded-[1.35rem] bg-white/12 border border-white/10 p-4">
                <div className="font-extrabold text-sm md:text-[0.96rem] mb-1">بدون كلمة مرور</div>
                <div className="text-white/80 text-sm md:text-base leading-6">
                  تجربة دخول مريحة خاصة بالمستفيد في الـMVP.
                </div>
              </div>

              <div className="rounded-[1.35rem] bg-white/12 border border-white/10 p-4">
                <div className="font-extrabold text-sm md:text-[0.96rem] mb-1">صديق للعيادة</div>
                <div className="text-white/80 text-sm md:text-base leading-6">
                  يمكن للأخصائي بدء الجلسة بسهولة دون خطوات معقدة.
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/admin/login')}
              className="mt-6 w-full rounded-[1.25rem] border border-white/20 bg-white/8 px-5 py-3 font-bold text-sm md:text-base hover:bg-white/14 transition-colors flex items-center justify-center gap-2"
            >
              <Shield size={18} />
              <span>دخول الأخصائي والإدارة</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default StudentLogin;
