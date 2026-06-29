import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LottieModule from 'lottie-react';
import { ArrowRight, Home } from 'lucide-react';
import sleepingBirdAnimation from '../assets/Animation/Sleeping.json';

const Lottie = LottieModule.default || LottieModule;

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#dff5ff_0%,_#f7fcfd_38%,_#ffffff_78%)] px-5 py-8 text-slate-800"
    >
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col items-center justify-center gap-8 text-center">
        <div className="relative flex w-full max-w-sm items-center justify-center sm:max-w-md">
          <div className="absolute inset-x-10 bottom-8 h-12 rounded-full bg-sky-200/50 blur-2xl" />
          <Lottie
            animationData={sleepingBirdAnimation}
            loop
            autoplay
            className="relative z-10 h-64 w-64 sm:h-80 sm:w-80"
            aria-label="طائر نائم"
          />
        </div>

        <section className="flex max-w-2xl flex-col items-center gap-4">
          <p className="text-7xl font-black leading-none text-[#0788c2] drop-shadow-sm sm:text-8xl">404</p>
          <h1 className="text-2xl font-black text-slate-800 sm:text-4xl">الصفحة غير موجودة</h1>
          <p className="max-w-xl text-base font-bold leading-8 text-slate-500 sm:text-lg">
            الرابط الذي تحاول فتحه غير صحيح أو تم تغييره. يمكنك الرجوع للصفحة السابقة أو العودة للرئيسية.
          </p>
        </section>

        <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-sky-100 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-100"
          >
            <ArrowRight size={18} />
            رجوع
          </button>
          <Link
            to="/"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0b8fc5] px-5 text-sm font-black text-white shadow-lg shadow-sky-200/60 transition hover:bg-[#087cac] focus:outline-none focus:ring-4 focus:ring-sky-100"
          >
            <Home size={18} />
            الصفحة الرئيسية
          </Link>
        </div>
      </div>
    </main>
  );
};

export default NotFoundPage;
