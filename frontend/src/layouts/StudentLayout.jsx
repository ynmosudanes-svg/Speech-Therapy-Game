import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, CalendarDays, FileText, Gamepad2, Home, LogOut, Menu, X } from 'lucide-react';
import { useTherapyStore } from '../hooks/useTherapyStore';

const PAGE_TITLES = {
  '/student/home': 'الرئيسية',
  '/student/sessions': 'الجلسات',
  '/student/reports': 'التقارير',
  '/student/games': 'الألعاب',
  '/student/medical': 'الملف الطبي',
};

const StudentLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeMode, currentStudent, logoutStudent } = useTherapyStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isLoginRoute = location.pathname === '/student/login';

  const isGameScreen = location.pathname.includes('/student/game/');

  const navItems = [
    { to: '/student/home', label: 'خطتي العلاجية', icon: Home },
    { to: '/student/library', label: 'مكتبة الألعاب', icon: Gamepad2 },
    { to: '/student/sessions', label: 'الجلسات', icon: CalendarDays },
    { to: '/student/reports', label: 'التقارير', icon: FileText },
  ];

  const currentTitle = useMemo(() => {
    const match = Object.keys(PAGE_TITLES).find((path) => location.pathname.startsWith(path));
    return match ? PAGE_TITLES[match] : 'بوابة المستفيد';
  }, [location.pathname]);

  if (isLoginRoute) {
    if (currentStudent) {
      return <Navigate to="/student/home" replace />;
    }

    return <Outlet />;
  }

  if (!currentStudent) {
    return <Navigate to="/student/login" replace />;
  }

  if (isGameScreen) {
    return (
      <div dir="rtl" className="min-h-screen bg-[radial-gradient(circle_at_top,_#eaf7fb,_#f7fcfd_34%,_#ffffff_75%)] text-slate-800 font-arabic">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-5">
          <Outlet />
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="relative h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#eaf7fb,_#f7fcfd_34%,_#ffffff_75%)] text-slate-800 font-arabic">
      <header className="fixed top-0 left-0 right-0 lg:right-[74px] z-[80] border-b border-[#dbe7f3] bg-white/92 backdrop-blur-md shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
        <div className="w-full px-3 md:px-6 py-2 md:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileNavOpen((value) => !value)}
              className="lg:hidden inline-flex items-center justify-center h-10 w-10 md:h-12 md:w-12 rounded-xl border border-[#dbe7f3] bg-white hover:bg-slate-50 shrink-0"
              title="تبديل القائمة"
            >
              {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-[#dbe7f3] bg-white px-3 py-1.5 md:px-4 md:py-2">
              <span className="font-black text-slate-800 text-sm md:text-base">{currentTitle}</span>
              {location.pathname.startsWith('/student/sessions') && <CalendarDays size={14} className="text-slate-500 md:w-4 md:h-4" />}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 md:gap-3 rounded-xl md:rounded-2xl border border-[#dbe7f3] bg-white px-2 py-1.5 md:px-4 md:py-2 shadow-sm shrink-0">
              <div className="hidden sm:block text-right">
                <div className="text-[10px] md:text-xs text-slate-500 font-bold">{activeMode === 'therapist' ? 'جلسة علاجية' : 'المستفيد'}</div>
                <div className="text-sm md:text-base font-black text-slate-900 truncate max-w-[100px] md:max-w-none">{currentStudent?.name}</div>
              </div>
              <div className="w-8 h-8 md:w-11 md:h-11 rounded-lg md:rounded-xl overflow-hidden bg-blue-100 flex items-center justify-center shrink-0">
                {currentStudent?.avatarUrl ? (
                  <img src={currentStudent.avatarUrl} alt="صورة المستفيد" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg md:text-2xl">👦</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {mobileNavOpen && (
        <button
          type="button"
          aria-label="إغلاق القائمة"
          onClick={() => setMobileNavOpen(false)}
          className="lg:hidden fixed inset-0 top-[86px] bg-slate-900/35 backdrop-blur-[1px] z-30"
        />
      )}

      <aside
        className={`fixed right-0 top-[86px] z-30 border-l border-b border-[#dbe7f3] bg-white/92 backdrop-blur-md transition-all
          lg:top-0 lg:bottom-4 lg:w-[74px] lg:rounded-bl-2xl
          ${mobileNavOpen ? 'bottom-0 w-[78vw] max-w-[320px] opacity-100 translate-x-0' : 'bottom-0 w-[78vw] max-w-[320px] opacity-0 translate-x-full pointer-events-none'}
          lg:opacity-100 lg:translate-x-0 lg:pointer-events-auto`}
      >
        <nav className="h-full flex flex-col p-2 pt-5 lg:pt-6 gap-2 overflow-visible">
          <div className="hidden lg:flex items-center justify-center mb-3">
            <div className="w-12 h-12 rounded-2xl border border-[#dbe7f3] bg-white/85 flex items-center justify-center shadow-sm">
              <img src="/logo.png" alt="logo" className="w-8 h-8 object-contain opacity-90" />
            </div>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileNavOpen(false)}
                className={({ isActive }) =>
                  `group relative flex items-center justify-start lg:justify-center gap-3 px-3 lg:px-2 py-3 rounded-xl border transition-all duration-200 ${
                    isActive
                      ? 'bg-[#e9f4fb] text-[#138fbc] border-[#cfe5f3] shadow-sm'
                      : 'text-slate-700 border-transparent hover:bg-slate-50 hover:border-[#e2edf6]'
                  }`
                }
              >
                <Icon size={19} />
                <span className="text-sm font-bold lg:hidden">{item.label}</span>
                <span className="pointer-events-none hidden lg:block absolute z-[120] right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-[#138fbc] px-3 py-1.5 text-xs font-bold text-white opacity-0 translate-x-2 transition-all duration-200 shadow-lg shadow-cyan-900/25 group-hover:opacity-100 group-hover:translate-x-0">
                  {item.label}
                  <span className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-0 h-0 border-y-[6px] border-y-transparent border-l-[6px] border-l-[#138fbc]" />
                </span>
              </NavLink>
            );
          })}

          <button
            onClick={() => {
              logoutStudent();
              setMobileNavOpen(false);
              navigate('/student/login', { replace: true });
            }}
            className="group relative mt-2 flex items-center justify-start lg:justify-center gap-3 px-3 lg:px-2 py-3 rounded-xl border border-red-300/80 bg-red-50/40 font-bold text-red-600 hover:bg-red-50 transition-all duration-200"
          >
            <LogOut size={19} />
            <span className="text-sm font-bold lg:hidden">خروج</span>
            <span className="pointer-events-none hidden lg:block absolute z-[120] right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-[#138fbc] px-3 py-1.5 text-xs font-bold text-white opacity-0 translate-x-2 transition-all duration-200 shadow-lg shadow-cyan-900/25 group-hover:opacity-100 group-hover:translate-x-0">
              خروج
              <span className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-0 h-0 border-y-[6px] border-y-transparent border-l-[6px] border-l-[#138fbc]" />
            </span>
          </button>
        </nav>
      </aside>

      <main className="relative z-0 h-full overflow-y-auto page-scroll-left transition-all mr-0 lg:mr-[74px]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 pt-[106px] pb-24 md:pt-[112px] md:pb-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default StudentLayout;
