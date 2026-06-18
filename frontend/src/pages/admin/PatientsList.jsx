import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  UserPlus, 
  ExternalLink,
  Activity,
  Key,
  Calendar
} from 'lucide-react';
import { useTherapyStore } from '../../hooks/useTherapyStore';
import ConfirmModal from '../../components/ConfirmModal';

const PatientsList = () => {
  const navigate = useNavigate();
  const { students, deleteStudent } = useTherapyStore();
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [deletePatientId, setDeletePatientId] = useState(null);
  const menuRef = useRef();

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

  const handleDelete = (id) => {
    setDeletePatientId(id);
    setActiveMenuId(null);
  };

  const confirmDelete = () => {
    if (deletePatientId) {
      deleteStudent(deletePatientId).catch(() => alert('حدث خطأ أثناء الحذف'));
      setDeletePatientId(null);
    }
  };

  const handleEdit = (id) => {
    navigate(`/admin/patients/edit/${id}`); // Assuming there's an edit route, or handle differently
    setActiveMenuId(null);
  };

  const mergedPatients = useMemo(() => {
    return Array.isArray(students)
      ? students.map((student) => ({
          id: String(student.id),
          name: student.name,
          age: student.age,
          diagnosis: student.diagnosis || 'غير محدد',
          code: student.accessCode || student.code || '---',
          progress: student.progress ?? '--',
          attendance: student.attendanceRate ?? '--',
        }))
      : [];
  }, [students]);

  return (
    <div dir="rtl" className="h-full font-sans text-slate-800">
      <div className="space-y-8">
        
        {/* --- الترويسة العلوية --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-cyan-50 rounded-2xl flex items-center justify-center text-[#178bb6]">
              <Users size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">المرضى / المستفيدون</h1>
              <p className="text-slate-500 mt-1 text-sm">اختر مريضًا لفتح صفحة المتابعة الرئيسية الخاصة به.</p>
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/admin/patients/create')}
            className="flex items-center justify-center gap-2 rounded-[1.1rem] border border-[#cfe3f3] bg-[linear-gradient(135deg,#eef8fd,#f8fcff)] px-6 py-3 font-semibold text-[#1584C3] shadow-[0_12px_26px_-22px_rgba(21,132,195,0.34)] transition-all hover:bg-[linear-gradient(135deg,#e7f5fc,#f4fbff)] active:scale-95"
          >
            <UserPlus size={20} />
            إضافة مريض جديد
          </button>
        </div>

        {/* --- شبكة البطاقات (Grid) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mergedPatients.map((patient) => (
            <div 
              key={patient.id} 
              className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden cursor-default"
            >
              
              {/* تأثير بصري في الخلفية (Blob) */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-50 to-transparent rounded-bl-full opacity-50 group-hover:scale-110 transition-transform duration-500 pointer-events-none"></div>

              {/* رأس البطاقة: المعلومات والقائمة */}
              <div className="flex justify-between items-start mb-8 relative z-20">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#178bb6] to-cyan-400 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-md transform group-hover:rotate-3 transition-transform duration-300 flex-shrink-0">
                    {patient.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 mb-1 group-hover:text-[#178bb6] transition-colors truncate max-w-[150px]">{patient.name}</h2>
                    <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5"><Key size={14}/> كود: <span className="font-mono text-cyan-600 font-bold">{patient.code}</span></p>
                  </div>
                </div>

                {/* زر الثلاث نقاط والقائمة */}
                <div className="relative z-20" ref={activeMenuId === patient.id ? menuRef : null}>
                  <button 
                    onClick={(e) => toggleMenu(patient.id, e)}
                    className={`p-2 rounded-xl transition-all ${activeMenuId === patient.id ? 'bg-cyan-50 text-[#178bb6]' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                  >
                    <MoreVertical size={20} />
                  </button>

                  {/* القائمة المنسدلة (Dropdown) */}
                  {activeMenuId === patient.id && (
                    <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-30 animate-fade-in py-1">
                      <button 
                        onClick={() => handleEdit(patient.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors text-right"
                      >
                        <div className="bg-amber-50 text-amber-500 p-1.5 rounded-lg"><Edit2 size={16} /></div>
                        تعديل البيانات
                      </button>
                      <button 
                        onClick={() => handleDelete(patient.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors text-right border-t border-slate-50"
                      >
                        <div className="bg-red-50 text-red-500 p-1.5 rounded-lg"><Trash2 size={16} /></div>
                        حذف المريض
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* بيانات المريض والشارات (Badges) في أسفل البطاقة */}
              <div className="flex flex-wrap gap-2 mb-6 relative z-10">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm">
                  <Calendar size={14} className="text-slate-400" />
                  العمر: {patient.age || '-'} سنوات
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm">
                  <Activity size={14} className="text-emerald-500" />
                  {patient.diagnosis}
                </div>
              </div>

              {/* زر الدخول لصفحة المريض */}
              <button 
                onClick={() => navigate(`/admin/patients/${patient.id}`)}
                className="mt-auto w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-[#178bb6] text-[#178bb6] hover:text-white border border-slate-100 hover:border-[#178bb6] px-4 py-3 rounded-xl font-bold transition-all duration-300 relative z-10 group/btn"
              >
                فتح صفحة المريض
                <ExternalLink size={18} className="text-[#178bb6] group-hover/btn:text-white transition-colors" />
              </button>

            </div>
          ))}

          {/* بطاقة الإضافة السريعة */}
          <div 
            onClick={() => navigate('/admin/patients/create')}
            className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[2rem] p-6 flex flex-col items-center justify-center text-slate-400 hover:bg-cyan-50/50 hover:border-cyan-300 hover:text-[#178bb6] transition-all cursor-pointer min-h-[200px] group"
          >
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300 group-hover:shadow-cyan-100 text-slate-300 group-hover:text-[#178bb6]">
              <UserPlus size={28} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg">إضافة مريض جديد</span>
          </div>

        </div>
      </div>

      <ConfirmModal
        isOpen={!!deletePatientId}
        onClose={() => setDeletePatientId(null)}
        onConfirm={confirmDelete}
        title="حذف المريض"
        message="هل أنت متأكد من حذف هذا المريض؟ لا يمكن التراجع عن هذه الخطوة."
        confirmText="نعم، احذف المريض"
        cancelText="إلغاء"
        isDestructive={true}
      />

      <style dangerouslySetInnerHTML={{__html: `
        .animate-fade-in { 
          animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1); 
          transform-origin: top left;
        }
        @keyframes fadeIn { 
          from { opacity: 0; transform: scale(0.95) translateY(-5px); } 
          to { opacity: 1; transform: scale(1) translateY(0); } 
        }
      `}} />
    </div>
  );
};

export default PatientsList;
