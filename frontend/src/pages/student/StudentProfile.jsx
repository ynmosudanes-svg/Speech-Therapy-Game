import React from 'react';
import { useTherapyStore } from '../../hooks/useTherapyStore';

const StudentProfile = () => {
  const { currentStudent, activeMode } = useTherapyStore();

  const gamesCount = Array.isArray(currentStudent?.assignedGames) ? currentStudent.assignedGames.length : 0;

  return (
    <div className="space-y-5">
      <section className="bg-white/95 border border-[#dbe7f3] rounded-[2.1rem] p-6 md:p-8 shadow-sm text-center">
        <div className="w-20 h-20 rounded-[1.4rem] bg-blue-100 mx-auto mb-4 flex items-center justify-center text-4xl">
          {currentStudent?.avatar || '👦'}
        </div>
        <h1 className="text-[2rem] md:text-[2.7rem] font-black text-slate-900 mb-2">صفحتي</h1>
        <p className="text-base md:text-lg text-slate-600 leading-7 md:leading-8 max-w-3xl mx-auto">
          {activeMode === 'therapist'
            ? 'أنت داخل جلسة علاجية. استمر يا بطل!'
            : 'هذه صفحتك الشخصية. هنا يمكنك متابعة معلوماتك.'}
        </p>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <article className="bg-white border border-[#dbe7f3] rounded-[1.8rem] p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 mb-2">اسم الطفل</h2>
          <p className="text-2xl font-extrabold text-blue-700">{currentStudent?.name || '-'}</p>
        </article>

        <article className="bg-white border border-[#dbe7f3] rounded-[1.8rem] p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 mb-2">عدد الألعاب المخصصة</h2>
          <p className="text-2xl font-extrabold text-blue-700">{gamesCount}</p>
        </article>
      </section>
    </div>
  );
};

export default StudentProfile;
