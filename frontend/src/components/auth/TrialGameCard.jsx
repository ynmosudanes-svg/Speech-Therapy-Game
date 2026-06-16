import React from 'react';
import { Play } from 'lucide-react';

const TrialGameCard = ({ title, description, icon: Icon, onStart }) => {
  return (
    <article className="rounded-3xl border border-[#D9EAF2] bg-white p-5 shadow-sm transition-colors hover:border-[#1584C3]/50">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#EAF7FD] text-[#1584C3]">
          {Icon && <Icon size={22} />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-black text-[#0F172A]">{title}</h3>
          <p className="mt-1.5 text-sm font-bold leading-6 text-[#64748B]">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onStart}
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#1584C3,#20B7B5)] px-4 py-2.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,#0F6FA6,#168D8B)] focus:outline-none focus:ring-4 focus:ring-[#1584C3]/20"
      >
        <Play size={17} fill="currentColor" />
        ابدأ التجربة
      </button>
    </article>
  );
};

export default TrialGameCard;
