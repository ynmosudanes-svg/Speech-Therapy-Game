import React from 'react';
import { LockKeyhole } from 'lucide-react';

const LockedFeatureCard = () => {
  return (
    <section className="rounded-3xl border border-[#D9EAF2] bg-white p-5 shadow-sm md:p-6">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#EAF7FD] text-[#0F6FA6]">
          <LockKeyhole size={22} />
        </div>
        <div>
          <h2 className="text-lg font-black text-[#0F172A]">الخطة العلاجية</h2>
          <p className="mt-2 text-sm font-bold leading-7 text-[#64748B]">
            سيتم تفعيل الخطة العلاجية بعد مراجعة بياناتك من المختص.
          </p>
          <span className="mt-4 inline-flex rounded-full border border-[#D9EAF2] bg-[#EAF7FD] px-3 py-1 text-xs font-black text-[#64748B]">
            قيد المراجعة
          </span>
        </div>
      </div>
    </section>
  );
};

export default LockedFeatureCard;
