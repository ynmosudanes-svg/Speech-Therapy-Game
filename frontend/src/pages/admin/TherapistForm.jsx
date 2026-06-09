import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Save, ShieldCheck, UserCheck, Check } from 'lucide-react';
import { useTherapyStore } from '../../hooks/useTherapyStore';
import { therapistService } from '../../services/therapistService';

const TherapistForm = ({ mode = 'create' }) => {
  const navigate = useNavigate();
  const { therapistId } = useParams();
  const { adminSession } = useTherapyStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    isActive: true,
    role: 'THERAPIST',
  });
  const [loading, setLoading] = useState(mode === 'edit');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchTherapist = async () => {
      if (mode !== 'edit' || !therapistId) {
        return;
      }

      if (!adminSession?.token) {
        setError('جلسة الإدارة غير متاحة. سجّل الدخول مرة أخرى.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const response = await therapistService.getTherapists(adminSession.token);
        const therapistFromList = Array.isArray(response?.data)
          ? response.data.find((item) => item.id === therapistId)
          : null;
        const therapist =
          therapistFromList ||
          (adminSession?.user?.role === 'SUPER_ADMIN' && adminSession?.user?.id === therapistId
            ? {
                id: adminSession.user.id,
                name: adminSession.name || adminSession.user.name || '',
                email: adminSession.email || adminSession.user.email || '',
                isActive: true,
                role: 'SUPER_ADMIN',
              }
            : null);

        if (!therapist) {
          setError('لم يتم العثور على الدكتور.');
          return;
        }

        setFormData({
          name: therapist.name || '',
          email: therapist.email || '',
          password: '',
          isActive: therapist.isActive !== undefined ? therapist.isActive : true,
          role: therapist.role || 'THERAPIST',
        });
      } catch (_fetchError) {
        setError('حدث خطأ أثناء جلب بيانات الدكتور.');
      } finally {
        setLoading(false);
      }
    };

    fetchTherapist();
  }, [adminSession?.token, mode, therapistId]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (mode === 'create') {
        if (!formData.password || formData.password.length < 6) {
          throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
        }

        await therapistService.createTherapist(adminSession.token, formData);
      } else {
        const payload = { ...formData };
        if (!payload.password) {
          delete payload.password;
        }

        await therapistService.updateTherapist(adminSession.token, therapistId, payload);
      }

      navigate('/admin/therapists');
    } catch (submitError) {
      setError(
        submitError?.response?.data?.message || submitError?.message || 'حدث خطأ أثناء الحفظ.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 rounded-full border-4 border-cyan-200 border-t-[#178bb6] animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-3xl mx-auto font-sans text-slate-800" dir="rtl">
      {/* الترويسة مع زر الرجوع */}
      <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900">
            {mode === 'create' ? 'إضافة دكتور جديد' : 'تعديل بيانات الدكتور'}
          </h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base">
            {mode === 'create' 
              ? 'قم بإدخال البيانات الأساسية للدكتور لإرسال دعوة الدخول.'
              : 'تحديث معلومات الدكتور وكلمة المرور.'}
          </p>
        </div>
        <button 
          onClick={() => navigate('/admin/therapists')}
          className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50 hover:text-[#178bb6] hover:border-cyan-200 transition-all shadow-sm hover:shadow"
        >
          <ArrowRight size={24} />
        </button>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-red-600 font-bold mb-6">
          {error}
        </div>
      )}

      {/* نموذج الإدخال (Form) */}
      <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] p-6 md:p-10 shadow-lg shadow-slate-200/40 border border-slate-100 space-y-8 relative overflow-hidden">
        
        {/* زخرفة خلفية للفورم */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          {/* الاسم */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 ml-1">اسم الدكتور كاملاً</label>
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="مثال: د. محمد أحمد"
              required
              className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-[#178bb6] transition-all focus:bg-white"
            />
          </div>

          {/* البريد الإلكتروني */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 ml-1">البريد الإلكتروني</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="doctor@clinic.com"
              required
              dir="ltr"
              className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 text-right rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-[#178bb6] transition-all placeholder:text-right focus:bg-white"
            />
          </div>
        </div>

        {/* كلمة المرور */}
        <div className="space-y-2 relative z-10">
          <label className="block text-sm font-bold text-slate-700 ml-1">
            كلمة المرور {mode === 'edit' && <span className="text-slate-400 font-normal">(اتركها فارغة إذا لم ترغب بتغييرها)</span>}
          </label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required={mode === 'create'}
              minLength={6}
              dir="ltr"
              className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 text-right rounded-2xl px-5 py-4 pl-14 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-[#178bb6] transition-all placeholder:text-right tracking-widest focus:bg-white"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-[#178bb6] hover:bg-cyan-50 transition-all"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {/* الصلاحيات (Checkboxes) المخصصة */}
        <div className="space-y-4 pt-6 border-t border-slate-100 relative z-10">
          
          {/* حساب نشط */}
          <label className={`flex items-center justify-between p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${formData.isActive ? 'border-[#178bb6] bg-gradient-to-l from-cyan-50/50 to-white shadow-sm' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200'}`}>
            <div className="flex-1 pr-2">
              <h4 className="font-bold text-slate-900 text-lg flex items-center gap-3">
                <div className={`p-2.5 rounded-xl transition-colors shadow-sm ${formData.isActive ? 'bg-[#178bb6] text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>
                  <UserCheck size={20} strokeWidth={2.5} />
                </div>
                حساب نشط
              </h4>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">يمكن للدكتور تسجيل الدخول وإدارة الطلاب إذا كان الحساب نشطاً.</p>
            </div>
            <div className="relative flex items-center justify-center ml-2">
              <input 
                type="checkbox" 
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-7 h-7 border-2 border-slate-300 rounded-xl checked:bg-[#178bb6] checked:border-[#178bb6] appearance-none cursor-pointer transition-all shadow-sm"
              />
              {formData.isActive && <Check size={18} className="absolute text-white pointer-events-none" strokeWidth={3} />}
            </div>
          </label>

          {/* مسؤول رئيسي */}
          <label className={`flex items-center justify-between p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${formData.role === 'SUPER_ADMIN' ? 'border-amber-500 bg-gradient-to-l from-amber-50/50 to-white shadow-sm' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200'}`}>
            <div className="flex-1 pr-2">
              <h4 className="font-bold text-slate-900 text-lg flex items-center gap-3">
                <div className={`p-2.5 rounded-xl transition-colors shadow-sm ${formData.role === 'SUPER_ADMIN' ? 'bg-amber-500 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>
                  <ShieldCheck size={20} strokeWidth={2.5} />
                </div>
                تعيينه مسؤولاً رئيسياً
              </h4>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">عند التفعيل سيبقى هذا الحساب دكتوراً، مع منحه أيضاً صلاحية المسؤول الرئيسي.</p>
            </div>
            <div className="relative flex items-center justify-center ml-2">
              <input 
                type="checkbox" 
                name="isMainAdmin"
                checked={formData.role === 'SUPER_ADMIN'}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    role: event.target.checked ? 'SUPER_ADMIN' : 'THERAPIST',
                  }))
                }
                className="w-7 h-7 border-2 border-slate-300 rounded-xl checked:bg-amber-500 checked:border-amber-500 appearance-none cursor-pointer transition-all shadow-sm"
              />
              {formData.role === 'SUPER_ADMIN' && <Check size={18} className="absolute text-white pointer-events-none" strokeWidth={3} />}
            </div>
          </label>

        </div>

        {/* زر الحفظ */}
        <div className="pt-8 border-t border-slate-100 flex justify-end relative z-10">
          <button 
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-3 bg-gradient-to-r from-[#178bb6] to-cyan-500 hover:from-[#126d8f] hover:to-[#178bb6] text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer"
          >
            <Save size={22} />
            {submitting ? 'جارٍ الحفظ...' : (mode === 'create' ? 'حفظ وإضافة الدكتور' : 'حفظ التعديلات')}
          </button>
        </div>

      </form>
      <style dangerouslySetInnerHTML={{__html: `
        .animate-fade-in { 
          animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); 
        }
        @keyframes fadeIn { 
          from { opacity: 0; transform: translateY(10px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
      `}} />
    </div>
  );
};

export default TherapistForm;
