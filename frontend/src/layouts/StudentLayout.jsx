import React, { useMemo, useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, FileText, Gamepad2, Home, LogOut, Menu, UserRound, X } from 'lucide-react';
import { useTherapyStore } from '../hooks/useTherapyStore';

const PAGE_TITLES = {
  '/student/home': 'الرئيسية',
  '/student/library': 'الألعاب',
  '/student/sessions': 'الجلسات',
  '/student/reports': 'التقارير',
  '/student/medical': 'الملف الطبي',
};

const navItems = [
  { to: '/student/home', label: 'الرئيسية', icon: Home },
  { to: '/student/library', label: 'الألعاب', icon: Gamepad2 },
  { to: '/student/sessions', label: 'الجلسات', icon: CalendarDays },
  { to: '/student/reports', label: 'التقارير', icon: FileText },
];

const StudentLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeMode, currentStudent, logoutStudent } = useTherapyStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isLoginRoute = location.pathname === '/student/login';
  const isGameScreen = location.pathname.includes('/student/game/');

  const currentTitle = useMemo(() => {
    const match = Object.keys(PAGE_TITLES).find((path) => location.pathname.startsWith(path));
    return match ? PAGE_TITLES[match] : 'بوابة المستفيد';
  }, [location.pathname]);

  const handleLogout = () => {
    logoutStudent();
    setMobileNavOpen(false);
    navigate('/', { replace: true, state: { mode: 'student' } });
  };

  if (isLoginRoute) {
    if (currentStudent) {
      return <Navigate to="/student/home" replace />;
    }

    return <Outlet />;
  }

  if (!currentStudent) {
    return <Navigate to="/" replace state={{ mode: 'student' }} />;
  }

  if (isGameScreen) {
    return (
      <div dir="rtl" className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#eaf7fb,_#f7fcfd_34%,_#ffffff_75%)] font-arabic text-slate-800">
        <div className="min-h-screen px-3 py-4 md:px-6 md:py-5">
          <Outlet />
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="relative h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#eaf7fb,_#f7fcfd_34%,_#ffffff_75%)] font-arabic text-slate-800">
      <header className="app-nav-shell fixed inset-x-0 top-0 z-[80] border-b backdrop-blur-md">
        <div dir="rtl" className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate('/student/home')}
            className="flex shrink-0 items-center gap-3"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-[#dbe7f3]">
              <img src="/logo.png" alt="العيادة السودانية" className="h-7 w-7 object-contain" />
            </span>
            <span className="app-brand-text font-arabic text-right text-base leading-none tracking-normal sm:text-lg" dir="rtl">
              العيادة السودانية
            </span>
          </button>

          <nav className="hidden items-center gap-2 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `app-nav-link ${isActive ? 'app-nav-link-active' : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex min-w-0 items-center gap-2">
            <div className="hidden min-w-0 items-center gap-2 rounded-2xl bg-white/80 px-3 py-2 ring-1 ring-[#dbe7f3] lg:flex">
              <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
                {currentStudent?.avatarUrl ? (
                  <img src={currentStudent.avatarUrl} alt="صورة المستفيد" className="h-full w-full object-cover" />
                ) : (
                  <UserRound size={21} strokeWidth={2} />
                )}
              </div>
              <div className="min-w-0 text-right">
                <p className="text-[10px] font-black text-[var(--primary)]">
                  {activeMode === 'therapist' ? 'جلسة علاجية' : currentTitle}
                </p>
                <p className="max-w-[130px] truncate text-sm font-black text-slate-800">
                  {currentStudent?.name || 'المستفيد'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-red-500 ring-1 ring-red-100 transition hover:bg-red-50 lg:inline-flex"
              title="خروج"
            >
              <LogOut size={19} />
            </button>
            <button
              type="button"
              onClick={() => setMobileNavOpen((value) => !value)}
              className="app-icon-button inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition lg:hidden"
              title="تبديل القائمة"
            >
              {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {mobileNavOpen && (
        <button
          type="button"
          aria-label="إغلاق القائمة"
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/35 backdrop-blur-[1px] lg:hidden"
        />
      )}

      <aside
        className={`fixed right-0 top-0 z-40 border-l border-[#dbe7f3] bg-white/95 pt-24 shadow-2xl backdrop-blur-md transition-all lg:hidden ${
          mobileNavOpen
            ? 'bottom-0 w-[78vw] max-w-[320px] translate-x-0 opacity-100'
            : 'bottom-0 w-[78vw] max-w-[320px] translate-x-full opacity-0 pointer-events-none'
        }`}
      >
        <nav className="flex h-full flex-col gap-2 overflow-visible p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileNavOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-start gap-3 rounded-xl border px-3 py-3 transition-all duration-200 ${
                    isActive
                      ? 'border-[var(--border)] bg-[var(--primary-soft)] text-[var(--primary)] shadow-sm'
                      : 'border-transparent text-slate-700 hover:border-[#e2edf6] hover:bg-slate-50'
                  }`
                }
              >
                <Icon size={19} />
                <span className="text-sm font-bold">{item.label}</span>
              </NavLink>
            );
          })}

          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 flex items-center justify-start gap-3 rounded-xl border border-red-300/80 bg-red-50/40 px-3 py-3 font-bold text-red-600 transition-all duration-200 hover:bg-red-50"
          >
            <LogOut size={19} />
            <span className="text-sm font-bold">خروج</span>
          </button>
        </nav>
      </aside>

      <main className="relative z-0 h-full overflow-y-auto page-scroll-right transition-all">
        <div className="mx-auto max-w-6xl px-4 pb-24 pt-[112px] md:px-6 md:pb-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default StudentLayout;
