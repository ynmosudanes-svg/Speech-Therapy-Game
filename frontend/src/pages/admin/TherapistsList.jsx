import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Plus, ShieldCheck, UserCheck, EyeOff, MoreVertical, ShieldAlert, Trash2 } from 'lucide-react';
import Button from '../../components/Button';
import ConfirmModal from '../../components/ConfirmModal';
import { useTherapyStore } from '../../hooks/useTherapyStore';
import { therapistService } from '../../services/therapistService';

const TherapistsList = () => {
  const navigate = useNavigate();
  const { adminSession } = useTherapyStore();
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (id, e) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const displayedTherapists = useMemo(() => {
    const list = Array.isArray(therapists) ? [...therapists] : [];

    if (adminSession?.user?.role !== 'SUPER_ADMIN') {
      return list;
    }

    const currentAdminId = adminSession?.user?.id;
    const alreadyIncluded = list.some((therapist) => String(therapist.id) === String(currentAdminId));

    let finalDisplay = list;
    if (!alreadyIncluded && currentAdminId) {
      finalDisplay = [
        {
          id: currentAdminId,
          name: adminSession?.name || adminSession?.user?.name || 'المسؤول الرئيسي',
          email: adminSession?.email || adminSession?.user?.email || '',
          role: 'SUPER_ADMIN',
          isActive: true,
        },
        ...list,
      ];
    }

    if (searchTerm.trim() !== '') {
      const lowerTerm = searchTerm.toLowerCase();
      finalDisplay = finalDisplay.filter(t => 
        (t.name && t.name.toLowerCase().includes(lowerTerm)) || 
        (t.email && t.email.toLowerCase().includes(lowerTerm))
      );
    }

    return finalDisplay;
  }, [adminSession?.email, adminSession?.name, adminSession?.user?.id, adminSession?.user?.name, adminSession?.user?.role, therapists, searchTerm]);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, currentStatus: false, actionType: null });

  useEffect(() => {
    const fetchTherapists = async () => {
      if (!adminSession?.token) {
        setTherapists([]);
        setError('جلسة الإدارة غير متاحة. سجّل الدخول مرة أخرى.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const response = await therapistService.getTherapists(adminSession.token);
        setTherapists(Array.isArray(response?.data) ? response.data : []);
      } catch (_fetchError) {
        setTherapists([]);
        setError('حدث خطأ أثناء جلب قائمة الدكاترة.');
      } finally {
        setLoading(false);
      }
    };

    fetchTherapists();
  }, [adminSession?.token]);

  const handleToggleActiveClick = (id, currentStatus) => {
    setActiveMenuId(null);
    setConfirmModal({ isOpen: true, id, currentStatus, actionType: 'toggle' });
  };

  const handleDeleteClick = (id) => {
    setActiveMenuId(null);
    setConfirmModal({ isOpen: true, id, currentStatus: false, actionType: 'delete' });
  };

  const executeConfirmAction = async () => {
    const { id, currentStatus, actionType } = confirmModal;
    setConfirmModal({ isOpen: false, id: null, currentStatus: false, actionType: null });

    try {
      setError('');
      if (actionType === 'delete') {
        await therapistService.deleteTherapist(adminSession.token, id);
      } else if (actionType === 'toggle') {
        if (currentStatus) {
          await therapistService.deactivateTherapist(adminSession.token, id);
        } else {
          await therapistService.updateTherapist(adminSession.token, id, { isActive: true });
        }
      }

      const response = await therapistService.getTherapists(adminSession.token);
      setTherapists(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء تنفيذ الإجراء.');
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
    <div className="animate-fade-in space-y-8 h-full font-sans text-slate-800" dir="rtl">
      {/* الترويسة العلوية */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-cyan-50 rounded-2xl flex items-center justify-center text-[#178bb6]">
            <ShieldCheck size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">إدارة الدكاترة</h1>
            <p className="text-slate-500 mt-1 text-sm">إضافة الدكاترة الجدد وتعيين حساباتهم وصلاحياتهم.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-72">
            <input 
              type="text" 
              placeholder="ابحث عن دكتور..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-[#178bb6] transition-all"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button 
            onClick={() => navigate('/admin/therapists/create')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-[#178bb6] to-cyan-500 hover:from-[#126d8f] hover:to-[#178bb6] text-white px-6 py-3 rounded-xl font-bold shadow-md shadow-cyan-500/30 transition-all active:scale-95"
          >
            <Plus size={20} strokeWidth={2.5} />
            إضافة دكتور جديد
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-red-600 font-bold">
          {error}
        </div>
      )}

      {/* شبكة الدكاترة */}
      {displayedTherapists.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-[2rem] p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-20 h-20 rounded-[2rem] bg-slate-50 flex items-center justify-center mb-6 text-slate-400">
            <ShieldAlert size={40} />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-3">لا يوجد دكاترة بعد</h3>
          <p className="text-slate-500 mb-8 max-w-md">
            يمكنك الآن إضافة دكتور جديد لتمكينه من إدارة جلسات وطلاب العيادة.
          </p>
          <Button onClick={() => navigate('/admin/therapists/create')} variant="primary" className="bg-[#178bb6] hover:bg-[#126d8f]">
            إضافة دكتور
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedTherapists.map((doctor) => (
            <div key={doctor.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden cursor-default">
              
              {/* تأثير بصري في الخلفية (Blob) */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-50 to-transparent rounded-bl-full opacity-50 group-hover:scale-110 transition-transform duration-500 pointer-events-none"></div>

              {/* رأس البطاقة: المعلومات والقائمة */}
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#178bb6] to-cyan-400 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-md transform group-hover:rotate-3 transition-transform duration-300 flex-shrink-0">
                    {doctor.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 mb-1 group-hover:text-[#178bb6] transition-colors truncate max-w-[150px]">{doctor.name}</h2>
                    <p className="text-sm font-medium text-slate-500 truncate max-w-[150px]">{doctor.email}</p>
                  </div>
                </div>

                {/* القائمة المنسدلة للخيارات (ثلاث نقاط) */}
                <div className="relative z-20" ref={activeMenuId === doctor.id ? menuRef : null}>
                  <button 
                    onClick={(e) => toggleMenu(doctor.id, e)}
                    className={`p-2 rounded-xl transition-all ${activeMenuId === doctor.id ? 'bg-cyan-50 text-[#178bb6]' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                  >
                    <MoreVertical size={20} />
                  </button>

                  {activeMenuId === doctor.id && (
                    <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-30 animate-fade-in py-1">
                      <button 
                        onClick={() => {
                          setActiveMenuId(null);
                          navigate(`/admin/therapists/edit/${doctor.id}`);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors text-right"
                      >
                        <div className="bg-amber-50 text-amber-500 p-1.5 rounded-lg"><Edit size={16} /></div>
                        تعديل البيانات
                      </button>
                      
                      {doctor.role !== 'SUPER_ADMIN' && (
                        <>
                          <button 
                            onClick={() => handleToggleActiveClick(doctor.id, doctor.isActive)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-colors text-right border-t border-slate-50 ${doctor.isActive ? 'text-slate-500 hover:bg-slate-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                          >
                            <div className={`p-1.5 rounded-lg ${doctor.isActive ? 'bg-slate-50 text-slate-500' : 'bg-emerald-50 text-emerald-500'}`}>
                              {doctor.isActive ? <EyeOff size={16} /> : <UserCheck size={16} />}
                            </div>
                            {doctor.isActive ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                          </button>
                          
                          <button 
                            onClick={() => handleDeleteClick(doctor.id)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors text-right border-t border-slate-50"
                          >
                            <div className="bg-red-50 text-red-500 p-1.5 rounded-lg"><Trash2 size={16} /></div>
                            حذف نهائي
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* الشارات (Badges) في أسفل البطاقة */}
              <div className="mt-auto pt-4 border-t border-slate-50 flex flex-wrap gap-2 relative z-10">
                {doctor.role === 'SUPER_ADMIN' && (
                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 text-amber-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm">
                    <ShieldCheck size={14} strokeWidth={2.5} />
                    مسؤول رئيسي
                  </div>
                )}
                {doctor.isActive ? (
                  <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-600 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm">
                    <UserCheck size={14} strokeWidth={2.5} />
                    حساب نشط
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-500 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm">
                    <EyeOff size={14} strokeWidth={2.5} />
                    غير نشط
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* بطاقة الإضافة السريعة */}
          <div 
            onClick={() => navigate('/admin/therapists/create')}
            className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[2rem] p-6 flex flex-col items-center justify-center text-slate-400 hover:bg-cyan-50/50 hover:border-cyan-300 hover:text-[#178bb6] transition-all cursor-pointer min-h-[200px] group"
          >
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300 group-hover:shadow-cyan-100 text-slate-300 group-hover:text-[#178bb6]">
              <Plus size={28} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg">إضافة دكتور جديد</span>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .animate-fade-in { 
          animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); 
        }
        @keyframes fadeIn { 
          from { opacity: 0; transform: translateY(10px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
      `}} />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null, currentStatus: false, actionType: null })}
        onConfirm={executeConfirmAction}
        title={
          confirmModal.actionType === 'delete' ? 'حذف نهائي للحساب' :
          confirmModal.currentStatus ? 'تعطيل الحساب' : 'تفعيل الحساب'
        }
        message={
          confirmModal.actionType === 'delete' ? 'هل أنت متأكد من رغبتك في حذف هذا الحساب نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.' :
          confirmModal.currentStatus 
          ? 'هل أنت متأكد من رغبتك في تعطيل هذا الحساب؟ لن يتمكن من الدخول للمنصة مرة أخرى.' 
          : 'هل أنت متأكد من رغبتك في تفعيل هذا الحساب؟ سيتمكن من الدخول للمنصة وإدارة الطلاب.'
        }
        confirmText={
          confirmModal.actionType === 'delete' ? 'نعم، قم بالحذف' :
          confirmModal.currentStatus ? 'نعم، قم بالتعطيل' : 'نعم، قم بالتفعيل'
        }
        cancelText="إلغاء"
        isDestructive={confirmModal.actionType === 'delete' || confirmModal.currentStatus}
      />
    </div>
  );
};

export default TherapistsList;
