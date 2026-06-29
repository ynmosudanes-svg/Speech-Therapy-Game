import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Check, Copy, Database, Eye, EyeOff, KeyRound, Save, ShieldCheck, UserCheck, UserCog } from 'lucide-react';
import { useTherapyStore } from '../../hooks/useTherapyStore';
import { therapistService } from '../../services/therapistService';

const T = {
  createTitle: '\u0625\u0636\u0627\u0641\u0629 \u0645\u0633\u062a\u062e\u062f\u0645 \u062c\u062f\u064a\u062f',
  editTitle: '\u062a\u0639\u062f\u064a\u0644 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645',
  createSubtitle: '\u0623\u0636\u0641 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0648\u062d\u062f\u062f \u0627\u0644\u062f\u0648\u0631 \u0627\u0644\u0645\u0646\u0627\u0633\u0628 \u062d\u0633\u0628 \u0645\u0633\u0624\u0648\u0644\u064a\u0629 \u0627\u0644\u062d\u0633\u0627\u0628.',
  editSubtitle: '\u062d\u062f\u062b \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645 \u0648\u062f\u0648\u0631\u0647 \u062f\u0627\u062e\u0644 \u0627\u0644\u0646\u0638\u0627\u0645.',
  name: '\u0627\u0644\u0627\u0633\u0645 \u0643\u0627\u0645\u0644\u0627\u064b',
  namePlaceholder: '\u0645\u062b\u0627\u0644: \u062f. \u0645\u062d\u0645\u062f \u0623\u062d\u0645\u062f',
  email: '\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a',
  password: '\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631',
  optionalPassword: '\u0627\u062a\u0631\u0643\u0647\u0627 \u0641\u0627\u0631\u063a\u0629 \u0625\u0630\u0627 \u0644\u0645 \u062a\u0631\u063a\u0628 \u0628\u062a\u063a\u064a\u064a\u0631\u0647\u0627',
  generatePassword: '\u062a\u0648\u0644\u064a\u062f',
  copyPassword: '\u0646\u0633\u062e',
  copiedPassword: '\u062a\u0645 \u0627\u0644\u0646\u0633\u062e',
  accountStatus: '\u062d\u0627\u0644\u0629 \u0627\u0644\u062d\u0633\u0627\u0628',
  activeAccount: '\u062d\u0633\u0627\u0628 \u0646\u0634\u0637',
  activeHelp: '\u064a\u0645\u0643\u0646 \u0644\u0644\u0645\u0633\u062a\u062e\u062f\u0645 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0637\u0627\u0644\u0645\u0627 \u0623\u0646 \u0627\u0644\u062d\u0633\u0627\u0628 \u0646\u0634\u0637.',
  roleTitle: '\u0627\u062e\u062a\u0631 \u0627\u0644\u062f\u0648\u0631',
  roleHelp: '\u0627\u0644\u062f\u0648\u0631 \u064a\u062d\u062f\u062f \u0627\u0644\u0635\u0644\u0627\u062d\u064a\u0627\u062a \u0627\u0644\u0641\u0639\u0644\u064a\u0629 \u062f\u0627\u062e\u0644 \u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645.',
  sessionError: '\u062c\u0644\u0633\u0629 \u0627\u0644\u0625\u062f\u0627\u0631\u0629 \u063a\u064a\u0631 \u0645\u062a\u0627\u062d\u0629. \u0633\u062c\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649.',
  notFound: '\u0644\u0645 \u064a\u062a\u0645 \u0627\u0644\u0639\u062b\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645.',
  fetchError: '\u062d\u062f\u062b \u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u062c\u0644\u0628 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645.',
  passwordError: '\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u064a\u062c\u0628 \u0623\u0646 \u062a\u0643\u0648\u0646 6 \u0623\u062d\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644.',
  submitError: '\u062d\u062f\u062b \u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u0627\u0644\u062d\u0641\u0638.',
  saving: '\u062c\u0627\u0631\u064a \u0627\u0644\u062d\u0641\u0638...',
  createSave: '\u062d\u0641\u0638 \u0648\u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645',
  editSave: '\u062d\u0641\u0638 \u0627\u0644\u062a\u0639\u062f\u064a\u0644\u0627\u062a',
};

const ROLE_OPTIONS = [
  { value: 'THERAPIST', label: '\u0623\u062e\u0635\u0627\u0626\u064a', description: '\u0645\u0631\u0627\u062c\u0639\u0629 \u0627\u0644\u0645\u062d\u062a\u0648\u0649 \u0627\u0644\u062a\u0639\u0644\u064a\u0645\u064a \u0648\u0627\u0639\u062a\u0645\u0627\u062f\u0647 \u0623\u0648 \u0631\u0641\u0636\u0647.', Icon: UserCheck, activeClass: 'border-emerald-400 bg-emerald-50 text-emerald-700' },
  { value: 'DATA_ENTRY', label: '\u0645\u062f\u062e\u0644 \u0628\u064a\u0627\u0646\u0627\u062a', description: '\u0625\u0646\u0634\u0627\u0621 \u0645\u0633\u0648\u062f\u0627\u062a \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0648\u0631\u0641\u0639 \u0627\u0644\u0635\u0648\u0631 \u0648\u0625\u0631\u0633\u0627\u0644\u0647\u0627 \u0644\u0644\u0645\u0631\u0627\u062c\u0639\u0629.', Icon: Database, activeClass: 'border-sky-400 bg-sky-50 text-sky-700' },
  { value: 'ADMIN', label: '\u0623\u062f\u0645\u0646 \u0645\u062d\u062a\u0648\u0649', description: '\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0648\u0646\u0634\u0631\u0647\u0627 \u0648\u0623\u0631\u0634\u0641\u062a\u0647\u0627 \u0628\u062f\u0648\u0646 \u062d\u0630\u0641 \u0646\u0647\u0627\u0626\u064a.', Icon: UserCog, activeClass: 'border-blue-400 bg-blue-50 text-blue-700' },
  { value: 'SUPER_ADMIN', label: '\u0645\u0633\u0624\u0648\u0644 \u0631\u0626\u064a\u0633\u064a', description: '\u0635\u0644\u0627\u062d\u064a\u0629 \u0643\u0627\u0645\u0644\u0629 \u0644\u0644\u0646\u0638\u0627\u0645 \u0648\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u064a\u0646 \u0648\u0627\u0644\u0633\u062c\u0644\u0627\u062a.', Icon: ShieldCheck, activeClass: 'border-amber-400 bg-amber-50 text-amber-700' },
];

const TherapistForm = ({ mode = 'create' }) => {
  const navigate = useNavigate();
  const { therapistId } = useParams();
  const { adminSession } = useTherapyStore();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', isActive: true, role: 'THERAPIST' });
  const [loading, setLoading] = useState(mode === 'edit');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);

  useEffect(() => {
    const fetchTherapist = async () => {
      if (mode !== 'edit' || !therapistId) return;
      if (!adminSession?.token) {
        setError(T.sessionError);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError('');
        const response = await therapistService.getTherapists(adminSession.token);
        const therapistFromList = Array.isArray(response?.data) ? response.data.find((item) => item.id === therapistId) : null;
        const therapist = therapistFromList || (adminSession?.user?.role === 'SUPER_ADMIN' && adminSession?.user?.id === therapistId ? { id: adminSession.user.id, name: adminSession.name || adminSession.user.name || '', email: adminSession.email || adminSession.user.email || '', isActive: true, role: 'SUPER_ADMIN' } : null);
        if (!therapist) {
          setError(T.notFound);
          return;
        }
        setFormData({ name: therapist.name || '', email: therapist.email || '', password: '', isActive: therapist.isActive !== undefined ? therapist.isActive : true, role: therapist.role || 'THERAPIST' });
      } catch (_fetchError) {
        setError(T.fetchError);
      } finally {
        setLoading(false);
      }
    };
    fetchTherapist();
  }, [adminSession?.email, adminSession?.name, adminSession?.token, adminSession?.user, mode, therapistId]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    if (name === 'password') setPasswordCopied(false);
  };

  const generatePassword = () => {
    const lowercase = 'abcdefghjkmnpqrstuvwxyz';
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const numbers = '23456789';
    const symbols = '!@#$%&*?';
    const groups = [lowercase, uppercase, numbers, symbols];
    const allChars = groups.join('');

    const pick = (chars) => {
      const random = new Uint32Array(1);
      if (window.crypto?.getRandomValues) {
        window.crypto.getRandomValues(random);
        return chars[random[0] % chars.length];
      }
      return chars[Math.floor(Math.random() * chars.length)];
    };

    const password = [
      ...groups.map(pick),
      ...Array.from({ length: 8 }, () => pick(allChars)),
    ].sort(() => Math.random() - 0.5).join('');

    setFormData((current) => ({ ...current, password }));
    setShowPassword(true);
    setPasswordCopied(false);
  };

  const copyPassword = async () => {
    if (!formData.password) return;
    try {
      await navigator.clipboard.writeText(formData.password);
      setPasswordCopied(true);
      window.setTimeout(() => setPasswordCopied(false), 1600);
    } catch (_error) {
      window.prompt(T.copyPassword, formData.password);
    }
  };

  const selectRole = (role) => {
    setFormData((current) => ({ ...current, role, isActive: role === 'SUPER_ADMIN' ? true : current.isActive }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (mode === 'create') {
        if (!formData.password || formData.password.length < 6) throw new Error(T.passwordError);
        await therapistService.createTherapist(adminSession.token, formData);
      } else {
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        await therapistService.updateTherapist(adminSession.token, therapistId, payload);
      }
      navigate('/admin/therapists');
    } catch (submitError) {
      setError(submitError?.response?.data?.message || submitError?.message || T.submitError);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-200 border-t-[#178bb6]" /></div>;
  }

  return (
    <div className="mx-auto max-w-4xl animate-fade-in font-sans text-slate-800" dir="rtl">
      <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900">{mode === 'create' ? T.createTitle : T.editTitle}</h1>
          <p className="mt-2 text-sm text-slate-500 md:text-base">{mode === 'create' ? T.createSubtitle : T.editSubtitle}</p>
        </div>
        <button type="button" onClick={() => navigate('/admin/therapists')} className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:border-cyan-200 hover:bg-slate-50 hover:text-[#178bb6] hover:shadow"><ArrowRight size={24} /></button>
      </div>

      {error && <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 font-bold text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="relative space-y-5 overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/40 md:p-6">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-50 opacity-60 blur-3xl" />

        <div className="relative z-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="mr-1 block text-sm font-bold text-slate-700">{T.name}</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder={T.namePlaceholder} required className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 transition-all focus:border-[#178bb6] focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-500/10" />
          </div>
          <div className="space-y-2">
            <label className="mr-1 block text-sm font-bold text-slate-700">{T.email}</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="doctor@clinic.com" required dir="ltr" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-right text-slate-900 transition-all placeholder:text-right focus:border-[#178bb6] focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-500/10" />
          </div>
        </div>

        <div className="relative z-10 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="mr-1 block text-sm font-bold text-slate-700">{T.password} {mode === 'edit' && <span className="font-normal text-slate-400">({T.optionalPassword})</span>}</label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={generatePassword} className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-xs font-bold text-[#178bb6] transition-colors hover:bg-cyan-100">
                <KeyRound size={14} />
                {T.generatePassword}
              </button>
              <button type="button" onClick={copyPassword} disabled={!formData.password} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                {passwordCopied ? <Check size={14} /> : <Copy size={14} />}
                {passwordCopied ? T.copiedPassword : T.copyPassword}
              </button>
            </div>
          </div>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="********" required={mode === 'create'} minLength={6} dir="ltr" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 pl-12 text-right tracking-widest text-slate-900 transition-all placeholder:text-right focus:border-[#178bb6] focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-500/10" />
            <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-cyan-50 hover:text-[#178bb6]">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
          </div>
        </div>

        <div className="relative z-10 border-t border-slate-100 pt-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-base font-black text-slate-900">{T.accountStatus}</h2>
            <span className="text-xs font-medium text-slate-500">{T.activeHelp}</span>
          </div>
          <label className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 transition-all ${formData.isActive ? 'border-[#178bb6] bg-cyan-50/50' : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'}`}>
            <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <span className={`rounded-md p-1.5 shadow-sm ${formData.isActive ? 'bg-[#178bb6] text-white' : 'border border-slate-100 bg-white text-slate-400'}`}><UserCheck size={15} strokeWidth={2.5} /></span>
              {T.activeAccount}
            </span>
            <span className="relative flex items-center justify-center">
              <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} disabled={formData.role === 'SUPER_ADMIN'} className="h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-slate-300 shadow-sm transition-all checked:border-[#178bb6] checked:bg-[#178bb6] disabled:cursor-not-allowed disabled:opacity-60" />
              {formData.isActive && <Check size={13} className="pointer-events-none absolute text-white" strokeWidth={3} />}
            </span>
          </label>
        </div>
        <div className="relative z-10 space-y-3 border-t border-slate-100 pt-4">
          <div><h2 className="text-lg font-black text-slate-900">{T.roleTitle}</h2><p className="mt-1 text-sm text-slate-500">{T.roleHelp}</p></div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {ROLE_OPTIONS.map(({ value, label, description, Icon, activeClass }) => {
              const isSelected = formData.role === value;
              return (
                <button key={value} type="button" onClick={() => selectRole(value)} className={`flex min-h-[6.25rem] items-start justify-between rounded-xl border-2 p-3 text-right transition-all ${isSelected ? activeClass : 'border-slate-100 bg-slate-50/50 text-slate-600 hover:border-slate-200 hover:bg-slate-50'}`}>
                  <span className="flex gap-2"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm ${isSelected ? 'bg-white/80' : 'border border-slate-100 bg-white text-slate-400'}`}><Icon size={17} /></span><span><span className="block text-base font-black text-slate-900">{label}</span><span className="mt-1 block text-[11px] leading-5 text-slate-500">{description}</span></span></span>
                  <span className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 ${isSelected ? 'border-current bg-current text-white' : 'border-slate-200 bg-white'}`}>{isSelected && <Check size={14} className="text-white" strokeWidth={3} />}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 flex justify-end border-t border-slate-100 pt-5">
          <button type="submit" disabled={submitting} className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#178bb6] to-cyan-500 px-6 py-3 text-base font-bold text-white shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5 hover:from-[#126d8f] hover:to-[#178bb6] active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0"><Save size={19} />{submitting ? T.saving : mode === 'create' ? T.createSave : T.editSave}</button>
        </div>
      </form>

      <style dangerouslySetInnerHTML={{ __html: `
        .animate-fade-in { animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      ` }} />
    </div>
  );
};

export default TherapistForm;
