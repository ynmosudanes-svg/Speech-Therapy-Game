import React from 'react';

const GoogleButton = ({ onClick, children = 'المتابعة بحساب Google', disabled = false, provider = 'google' }) => {
  const isApple = provider === 'apple';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl border border-[#D9EAF2] bg-white px-5 py-3 text-base font-extrabold text-[#0F172A] transition-colors hover:border-[#1584C3] hover:bg-[#EAF7FD] focus:outline-none focus:ring-4 focus:ring-[#1584C3]/15 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span
        className={`grid h-7 w-7 place-items-center rounded-full border border-[#D9EAF2] text-sm font-black ${
          isApple ? 'bg-[#073B5C] text-white' : 'bg-white text-[#1584C3]'
        }`}
      >
        {isApple ? '' : 'G'}
      </span>
      <span>{children}</span>
    </button>
  );
};

export default GoogleButton;
