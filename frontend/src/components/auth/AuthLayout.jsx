import React from 'react';
import { Link } from 'react-router-dom';

const AuthLayout = ({ children, title, subtitle, compact = false }) => {
  return (
    <main
      dir="rtl"
      className="min-h-[100dvh] overflow-x-hidden bg-[#F8FBFD] px-4 py-5 text-[#0F172A] sm:px-6 md:py-8"
    >
      <div className="mx-auto flex min-h-[calc(100dvh-40px)] w-full max-w-5xl flex-col">
        <header className="flex justify-center pb-4 md:justify-start">
          <Link
            to="/"
            className="inline-flex items-center gap-3 rounded-2xl border border-[#D9EAF2] bg-white px-3.5 py-2 shadow-sm"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D9EAF2] bg-[#EAF7FD] p-1.5">
              <img src="/logo.png" alt="شعار المنصة" className="h-full w-full object-contain" />
            </span>
            <span className="text-right">
              <span className="block text-sm font-black text-[#0F6FA6]">منصة الألعاب العلاجية</span>
              <span className="block text-xs font-bold text-[#64748B]">تجربة بسيطة وآمنة</span>
            </span>
          </Link>
        </header>

        <section className="flex flex-1 items-center justify-center">
          <div
            className={`w-full ${compact ? 'max-w-xl' : 'max-w-4xl'} rounded-[1.75rem] border border-[#D9EAF2] bg-white p-4 shadow-[0_18px_45px_rgba(7,59,92,0.08)] sm:p-6 md:p-8`}
          >
            {(title || subtitle) && (
              <div className="mb-6 text-center md:mb-7">
                {title && (
                  <h1 className="text-2xl font-black leading-tight text-[#073B5C] md:text-[2rem]">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="mx-auto mt-2 max-w-2xl text-sm font-bold leading-7 text-[#64748B] md:text-base">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
            {children}
          </div>
        </section>
      </div>
    </main>
  );
};

export default AuthLayout;
