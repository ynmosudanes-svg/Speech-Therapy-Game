import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import Button from '../../components/Button';
import { useTherapyStore } from '../../hooks/useTherapyStore';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { loginAdmin } = useTherapyStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    const result = await loginAdmin(email, password);
    if (!result.success) {
      const friendlyMessage =
        result.message?.includes('404')
          ? 'تعذر الوصول إلى خدمة تسجيل الدخول. تأكدي أن الباك شغال على المسار الصحيح.'
          : result.message || 'بيانات الدخول غير صحيحة.';
      setError(friendlyMessage);
      setSubmitting(false);
      return;
    }

    setError('');
    
    // Redirect based on role
    if (result.session?.user?.role === 'SUPER_ADMIN') {
      navigate('/admin/dashboard');
    } else {
      navigate('/admin/patients');
    }
  };

  return (
    <div dir="rtl" className="min-h-[100dvh] bg-[linear-gradient(180deg,_#eef5ff,_#f8fafc_45%,_#f7f4ea_100%)] overflow-y-auto px-4 py-8 md:p-6 flex flex-col">
      <div className="w-full max-w-4xl m-auto flex flex-col-reverse lg:grid lg:grid-cols-[0.9fr_1.1fr] gap-6 lg:min-h-[600px]">
        <aside className="hidden lg:block bg-blue-600 text-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-blue-950/20">
          <div className="w-28 h-28 rounded-[2rem] bg-white p-3 flex items-center justify-center mb-6 shadow-lg shadow-blue-950/15">
            <img src="/logo.png" alt="Speech Therapy Logo" className="h-full w-full rounded-[1.25rem] object-contain" />
          </div>
          <h1 className="text-4xl font-black mb-4">Therapist Mode</h1>
          <p className="text-lg text-white/85 leading-8 mb-8">
            هذه المنطقة مخصصة للدكتور أو الأخصائي لإدارة المستفيدين والجلسات والتقارير.
          </p>
          <div className="rounded-[2rem] bg-white/10 p-5 leading-8">
            <div className="font-black mb-2">وصول آمن</div>
            <div>يتم تسجيل الدخول بحسابات الإدارة الحقيقية من قاعدة البيانات.</div>
            <div>لن يتم عرض كلمات المرور أو الحسابات الافتراضية على الواجهة.</div>
          </div>
        </aside>

        <div className="relative group h-full">
          <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-[2.8rem] blur-xl opacity-30 md:opacity-40 transition duration-1000 group-hover:opacity-50"></div>
          <section className="relative h-full flex flex-col justify-center bg-white/95 backdrop-blur-xl rounded-[2rem] lg:rounded-[2.5rem] p-5 lg:p-10 border border-white shadow-2xl">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold lg:font-black text-slate-900 leading-tight mb-3">دخول الدكتور</h2>
          <p className="text-sm md:text-base lg:text-lg text-slate-600 mb-5 lg:mb-8 leading-relaxed lg:leading-8 max-w-2xl">
            سجل الدخول لمتابعة المستفيدين، ضبط المستويات، وبدء الجلسة العلاجية مباشرة.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="block text-base font-bold text-slate-700 mb-3">البريد الإلكتروني</span>
              <div className="relative">
                <Mail size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError('');
                  }}
                  placeholder="name@example.com"
                  className="w-full rounded-[1.6rem] border-2 border-slate-200 bg-slate-50 pr-12 pl-4 py-3 md:py-4 text-base md:text-lg outline-none transition-all duration-300 hover:border-blue-400 hover:bg-white hover:shadow-md focus:border-blue-500 focus:ring-[4px] focus:ring-blue-500/20 focus:bg-white focus:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                />
              </div>
            </label>

            <label className="block">
              <span className="block text-base font-bold text-slate-700 mb-3">كلمة المرور</span>
              <div className="relative">
                <LockKeyhole size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError('');
                  }}
                  placeholder="********"
                  className="w-full rounded-[1.6rem] border-2 border-slate-200 bg-slate-50 pr-12 pl-14 py-3 md:py-4 text-base md:text-lg outline-none transition-all duration-300 hover:border-blue-400 hover:bg-white hover:shadow-md focus:border-blue-500 focus:ring-[4px] focus:ring-blue-500/20 focus:bg-white focus:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                />
              </div>
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
              className="w-full !rounded-[1.6rem] !py-3 md:!py-4 text-lg md:text-xl bg-blue-600 hover:bg-blue-700"
            >
              دخول لوحة التحكم
            </Button>
            
            <button
              type="button"
              onClick={() => navigate('/student/login')}
              className="mt-6 w-full rounded-[1.6rem] border border-slate-200 bg-slate-50 px-5 py-3 md:py-4 font-bold text-base md:text-lg text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 lg:hidden"
            >
              العودة لدخول المستفيد
            </button>
          </form>
        </section>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
